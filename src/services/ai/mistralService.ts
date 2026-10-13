// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

/**
 * Service client pour l'API Mistral AI — connexion 100 % locale.
 *
 * Aucun compte JemaNote n'est requis : l'utilisateur clique « Se connecter »,
 * colle sa clé Mistral une seule fois ; elle est validée puis stockée
 * uniquement sur SON appareil (IndexedDB), et les appels partent directement
 * vers api.mistral.ai. La clé n'est jamais envoyée à nos serveurs ni
 * réaffichée dans l'interface.
 *
 * Gestion du cache IndexedDB et de l'historique des résumés.
 */

import localforage from 'localforage';

import { translate } from '@/i18n/translations';

interface AIConfig {
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
}

export interface AIConnectionStatus {
  connected: boolean;
  model: string | null;
  key_last4: string | null;
  connected_at?: string | null;
}

interface StoredCredentials {
  apiKey: string;
  model: string;
  key_last4: string;
  connectedAt: number;
}

interface CacheEntry {
  prompt: string;
  response: string;
  timestamp: number;
  expiresIn: number;
}

type SummaryHistoryEntry = {
  id: string;
  noteId?: string;
  noteTitle?: string;
  content: string;
  summary: string;
  summaryType: 'short' | 'detailed' | 'bullets';
  timestamp: number;
};

const MISTRAL_API_BASE = 'https://api.mistral.ai/v1';
const CREDENTIALS_KEY = 'mistral';

export const AI_DEFAULT_MODEL = 'mistral-medium-latest';

export const AI_MODELS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'mistral-small-latest', label: 'Mistral Small' },
  { id: 'mistral-medium-latest', label: 'Mistral Medium' },
  { id: 'mistral-large-latest', label: 'Mistral Large' },
];

// Store local des credentials (clé Mistral de l'utilisateur).
const aiCredentials = localforage.createInstance({
  name: 'Jemanote',
  storeName: 'ai_credentials',
  description: 'Connexion au compte Mistral (stockage local)',
});

// Configure IndexedDB pour le cache IA
const aiCache = localforage.createInstance({
  name: 'Jemanote',
  storeName: 'ai_cache',
  description: 'Cache pour les réponses IA',
});

const summaryHistory = localforage.createInstance({
  name: 'Jemanote',
  storeName: 'summary_history',
  description: 'Historique des résumés IA',
});

/** Erreur typée renvoyée quand aucun compte Mistral n'est connecté. */
export class AINotConnectedError extends Error {
  constructor() {
    super(translate('aiNotConnected'));
    this.name = 'AINotConnectedError';
  }
}

class MistralAIService {
  private readonly config: AIConfig;
  private readonly CACHE_DURATION = 86_400_000; // 24 hours in milliseconds
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_HISTORY_SIZE = 50;
  private abortController: AbortController | null = null;
  private connected = false;

  constructor() {
    this.config = {
      baseURL: `${MISTRAL_API_BASE}/chat/completions`,
      model: AI_DEFAULT_MODEL,
      maxTokens: 2048,
      temperature: 0.7,
    };
  }

  // -------------------------------------------------------------------------
  // Stockage local des credentials
  // -------------------------------------------------------------------------

  private async loadCredentials(): Promise<StoredCredentials | null> {
    try {
      return await aiCredentials.getItem<StoredCredentials>(CREDENTIALS_KEY);
    } catch {
      return null;
    }
  }

  private async persistCredentials(credentials: StoredCredentials): Promise<void> {
    await aiCredentials.setItem(CREDENTIALS_KEY, credentials);
  }

  private async removeCredentials(): Promise<void> {
    await aiCredentials.removeItem(CREDENTIALS_KEY);
  }

  /**
   * Indique si un compte Mistral est connecté (état connu).
   */
  isConfigured(): boolean {
    return this.connected;
  }

  /**
   * @deprecated Les clés ne sont plus configurées ainsi. Conservé en no-op
   * pour compatibilité.
   */
  setApiKey(_apiKey: string): void {
    // No-op: la connexion se fait via `connectAccount`.
  }

  /**
   * Annuler la requête en cours
   */
  cancelRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // -------------------------------------------------------------------------
  // Gestion de la connexion au compte Mistral de l'utilisateur (local)
  // -------------------------------------------------------------------------

  /** Statut de connexion du compte Mistral. */
  async getConnectionStatus(): Promise<AIConnectionStatus> {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      this.connected = false;
      return { connected: false, model: null, key_last4: null, connected_at: null };
    }
    this.connected = true;
    if (credentials.model) {
      this.config.model = credentials.model;
    }
    return {
      connected: true,
      model: credentials.model,
      key_last4: credentials.key_last4,
      connected_at: new Date(credentials.connectedAt).toISOString(),
    };
  }

  /**
   * Connecte le compte Mistral : valide la clé auprès de Mistral puis la
   * stocke localement (jamais envoyée à nos serveurs).
   */
  async connectAccount(
    apiKey: string,
    model: string = AI_DEFAULT_MODEL
  ): Promise<AIConnectionStatus> {
    const key = apiKey.trim();
    if (key.length < 20) {
      throw new Error(translate('aiInvalidKey'));
    }

    let response: Response;
    try {
      response = await fetch(`${MISTRAL_API_BASE}/models`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new Error(translate('cannotReachMistral'));
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(translate('aiInvalidKey'));
    }
    if (!response.ok) {
      throw new Error(translate('mistralServerUnavailable'));
    }

    const credentials: StoredCredentials = {
      apiKey: key,
      model,
      key_last4: key.slice(-4),
      connectedAt: Date.now(),
    };
    await this.persistCredentials(credentials);
    this.connected = true;
    this.config.model = model;
    // Un nouveau compte (ou modèle) invalide les réponses mises en cache.
    await this.clearCache();

    return {
      connected: true,
      model,
      key_last4: credentials.key_last4,
      connected_at: new Date(credentials.connectedAt).toISOString(),
    };
  }

  /** Déconnecte le compte Mistral (supprime la clé stockée localement). */
  async disconnectAccount(): Promise<void> {
    await this.removeCredentials();
    this.connected = false;
    // Ne jamais servir de réponses IA mises en cache après une déconnexion.
    await this.clearCache();
  }

  /** Change le modèle utilisé (défaut : mistral-medium-latest). */
  async setModel(model: string): Promise<AIConnectionStatus> {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      throw new AINotConnectedError();
    }
    credentials.model = model;
    await this.persistCredentials(credentials);
    this.config.model = model;
    await this.clearCache();
    return {
      connected: true,
      model,
      key_last4: credentials.key_last4,
      connected_at: new Date(credentials.connectedAt).toISOString(),
    };
  }

  getModel(): string {
    return this.config.model;
  }

  /**
   * Génère une clé de cache
   */
  private getCacheKey(prompt: string, options?: Partial<AIConfig>): string {
    const key = `${prompt}_${options?.model || this.config.model}_${options?.temperature ?? this.config.temperature}`;
    // Utiliser encodeURIComponent au lieu de btoa pour supporter Unicode
    try {
      return btoa(encodeURIComponent(key)).substring(0, 64);
    } catch (cacheKeyError) {
      // Fallback: utiliser un hash simple si btoa échoue
      console.warn('Cache key generation failed:', cacheKeyError);
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.codePointAt(i) ?? 0;
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36).substring(0, 64);
    }
  }

  /**
   * Récupère une réponse du cache IndexedDB.
   * Compare le prompt complet pour éviter toute collision de clé de cache
   * (la clé est un hash tronqué).
   */
  private async getFromCache(cacheKey: string, expectedPrompt: string): Promise<string | null> {
    try {
      const entry = await aiCache.getItem<CacheEntry>(cacheKey);
      if (!entry) {
        return null;
      }

      if (entry.prompt !== expectedPrompt) {
        return null;
      }

      const now = Date.now();
      if (now - entry.timestamp > entry.expiresIn) {
        await aiCache.removeItem(cacheKey);
        return null;
      }

      return entry.response;
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  /**
   * Ajoute une réponse au cache IndexedDB
   */
  private async addToCache(cacheKey: string, prompt: string, response: string) {
    try {
      await aiCache.setItem(cacheKey, {
        prompt,
        response,
        timestamp: Date.now(),
        expiresIn: this.CACHE_DURATION,
      });

      // Limiter la taille du cache
      const keys = await aiCache.keys();
      if (keys.length > this.MAX_CACHE_SIZE) {
        const entries: Array<[string, CacheEntry]> = [];
        for (const key of keys) {
          const entry = await aiCache.getItem<CacheEntry>(key);
          if (entry) {
            entries.push([key, entry]);
          }
        }

        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const toDelete = entries.slice(this.MAX_CACHE_SIZE);
        for (const [key] of toDelete) {
          await aiCache.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cache:', error);
    }
  }

  private extractErrorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const error = record.error;
      if (error && typeof error === 'object') {
        const message = (error as Record<string, unknown>).message;
        if (typeof message === 'string' && message.length > 0) {
          return message;
        }
      }
      if (typeof record.message === 'string' && record.message.length > 0) {
        return record.message;
      }
    }
    return fallback;
  }

  /**
   * POST vers Mistral. Si l'API répond 429 avec un en-tête Retry-After,
   * on attend puis on retente une fois (en respectant l'annulation).
   */
  private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
    const response = await fetch(url, init);
    if (response.status === 429) {
      const retryAfter = Number(response.headers?.get?.('Retry-After') ?? '0');
      if (Number.isFinite(retryAfter) && retryAfter > 0 && retryAfter <= 30) {
        await new Promise<void>(resolve => {
          setTimeout(resolve, retryAfter * 1000);
        });
        const signal = init.signal as AbortSignal | undefined;
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        return fetch(url, init);
      }
    }
    return response;
  }

  /**
   * Appel API Mistral direct avec gestion d'erreurs
   */
  private async callAPI(
    prompt: string,
    systemPrompt?: string,
    options?: Partial<AIConfig>,
    onProgress?: (progress: number) => void,
    skipCache?: boolean
  ): Promise<AIResponse> {
    // Create the AbortController synchronously so an immediate cancelRequest()
    // (before the first await resolves) still cancels this request.
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const cacheKey = this.getCacheKey(prompt, options);

    try {
      if (!skipCache) {
        const cached = await this.getFromCache(cacheKey, prompt);
        if (cached !== null && !signal.aborted) {
          onProgress?.(100);
          return { content: cached, cached: true };
        }
      }

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const credentials = await this.loadCredentials();
      if (!credentials?.apiKey) {
        throw new AINotConnectedError();
      }

      onProgress?.(20);

      const response = await this.fetchWithRetry(this.config.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        body: JSON.stringify({
          model: options?.model || this.config.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          max_tokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature ?? this.config.temperature,
        }),
        signal,
      });

      onProgress?.(60);

      const data = (await response.json().catch(() => ({}))) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };

      if (!response.ok) {
        switch (response.status) {
          case 401:
          case 403:
            throw new Error(translate('mistralKeyInvalidOrExpired'));
          case 429: {
            const quotaDetail = this.extractErrorMessage(data, '');
            throw new Error(
              quotaDetail
                ? `${translate('apiQuotaExceeded')} (Mistral : ${quotaDetail})`
                : translate('apiQuotaExceeded')
            );
          }
          case 500:
          case 502:
          case 503:
            throw new Error(translate('mistralServerUnavailable'));
          case 400:
            throw new Error(
              translate('invalidRequest', {
                message: this.extractErrorMessage(data, translate('incorrectParameters')),
              })
            );
          default:
            throw new Error(
              this.extractErrorMessage(data, translate('apiErrorCode', { code: response.status }))
            );
        }
      }

      const content = data.choices?.[0]?.message?.content || '';
      onProgress?.(80);

      await this.addToCache(cacheKey, prompt, content);
      onProgress?.(100);

      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
            totalTokens: data.usage.total_tokens ?? 0,
          }
        : undefined;

      return { content, usage, cached: false };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(translate('generationCancelled'));
      }
      throw error;
    } finally {
      if (this.abortController?.signal === signal) {
        this.abortController = null;
      }
    }
  }

  /** Générer un résumé de texte */
  async summarize(
    text: string,
    type: 'short' | 'detailed' | 'bullets' = 'detailed',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const systemPrompts = {
      short: 'Tu es un assistant qui génère des résumés courts et concis (2-3 phrases maximum).',
      detailed: 'Tu es un assistant qui génère des résumés détaillés et structurés.',
      bullets:
        'Tu es un assistant qui génère des résumés sous forme de points clés (bullet points).',
    };

    const userPrompts = {
      short: `Résume ce texte en 2-3 phrases maximum:\n\n${text}`,
      detailed: `Génère un résumé détaillé et structuré de ce texte:\n\n${text}`,
      bullets: `Génère un résumé sous forme de points clés de ce texte:\n\n${text}`,
    };

    const response = await this.callAPI(
      userPrompts[type],
      systemPrompts[type],
      undefined,
      onProgress
    );
    return response.content;
  }

  /** Continuer un texte */
  async continueText(text: string, context?: string): Promise<string> {
    const systemPrompt =
      'Tu es un assistant de rédaction qui aide à continuer et développer des idées de manière cohérente et naturelle.';
    const prompt = context
      ? `Contexte: ${context}\n\nTexte à continuer: ${text}\n\nContinue ce texte de manière naturelle et cohérente.`
      : `Continue ce texte de manière naturelle et cohérente:\n\n${text}`;
    const response = await this.callAPI(prompt, systemPrompt, undefined, undefined, true);
    return response.content;
  }

  /** Améliorer un texte */
  async improveText(text: string): Promise<string> {
    const systemPrompt =
      'Tu es un assistant de rédaction qui améliore la clarté, la structure et le style des textes.';
    const prompt = `Améliore ce texte pour le rendre plus clair, mieux structuré et professionnel:\n\n${text}`;
    const response = await this.callAPI(prompt, systemPrompt, undefined, undefined, true);
    return response.content;
  }

  /** Changer le ton d'un texte */
  async changeTone(
    text: string,
    tone: 'formal' | 'informal' | 'professional' | 'persuasive'
  ): Promise<string> {
    const toneDescriptions = {
      formal: 'formel et académique',
      informal: 'décontracté et accessible',
      professional: 'professionnel et technique',
      persuasive: 'persuasif et convaincant',
    };
    const systemPrompt = `Tu es un assistant de rédaction qui adapte le ton des textes.`;
    const prompt = `Réécris ce texte avec un ton ${toneDescriptions[tone]}:\n\n${text}`;
    const response = await this.callAPI(prompt, systemPrompt, undefined, undefined, true);
    return response.content;
  }

  /** Traduire un texte */
  async translate(text: string, targetLanguage: string): Promise<string> {
    const systemPrompt = 'Tu es un traducteur professionnel qui traduit les textes avec précision.';
    const prompt = `Traduis ce texte en ${targetLanguage}:\n\n${text}`;
    const response = await this.callAPI(prompt, systemPrompt, undefined, undefined, true);
    return response.content;
  }

  /** Générer des tags pour un texte */
  async generateTags(text: string, maxTags: number = 5): Promise<string[]> {
    const systemPrompt =
      'Tu es un assistant qui génère des tags pertinents pour classer et organiser des notes.';
    const prompt = `Génère ${maxTags} tags pertinents pour ce texte. Réponds uniquement avec les tags séparés par des virgules:\n\n${text}`;
    const response = await this.callAPI(prompt, systemPrompt, { temperature: 0.5 });
    return response.content
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, maxTags);
  }

  /** Générer des idées de brainstorming */
  async generateIdeas(topic: string, context?: string): Promise<string[]> {
    const systemPrompt =
      'Tu es un assistant créatif qui génère des idées innovantes et pertinentes pour le brainstorming.';
    const prompt = context
      ? `Contexte: ${context}\n\nSujet: ${topic}\n\nGénère 10 idées créatives et pertinentes liées à ce sujet. Réponds avec une idée par ligne.`
      : `Génère 10 idées créatives et pertinentes sur le sujet suivant: ${topic}\n\nRéponds avec une idée par ligne.`;
    const response = await this.callAPI(prompt, systemPrompt, { temperature: 0.9 });
    return response.content
      .split('\n')
      .map(idea => idea.trim().replace(/^[*\d.-]+\s*/, ''))
      .filter(idea => idea.length > 0);
  }

  /** Synthétiser plusieurs notes */
  async synthesizeNotes(notes: Array<{ title: string; content: string }>): Promise<string> {
    const systemPrompt =
      'Tu es un assistant qui synthétise plusieurs notes en un document cohérent et structuré.';
    const notesText = notes
      .map((note, i) => `Note ${i + 1}: ${note.title}\n${note.content}`)
      .join('\n\n---\n\n');
    const prompt = `Synthétise ces notes en un document cohérent et bien structuré:\n\n${notesText}`;
    const response = await this.callAPI(prompt, systemPrompt, { maxTokens: 4096 });
    return response.content;
  }

  /** Sauvegarder un résumé dans l'historique */
  async saveSummaryToHistory(
    noteId: string | undefined,
    noteTitle: string | undefined,
    content: string,
    summary: string,
    summaryType: 'short' | 'detailed' | 'bullets'
  ) {
    try {
      const id = crypto.randomUUID();
      const entry: SummaryHistoryEntry = {
        id,
        noteId,
        noteTitle,
        content: content.substring(0, 500),
        summary,
        summaryType,
        timestamp: Date.now(),
      };
      await summaryHistory.setItem(id, entry);

      const keys = await summaryHistory.keys();
      if (keys.length > this.MAX_HISTORY_SIZE) {
        const entries: Array<[string, SummaryHistoryEntry]> = [];
        for (const key of keys) {
          const item = await summaryHistory.getItem<SummaryHistoryEntry>(key);
          if (item) {
            entries.push([key, item]);
          }
        }
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const toDelete = entries.slice(this.MAX_HISTORY_SIZE);
        for (const [key] of toDelete) {
          await summaryHistory.removeItem(key);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
    }
  }

  /** Récupérer l'historique des résumés */
  async getSummaryHistory(limit: number = 10): Promise<SummaryHistoryEntry[]> {
    try {
      const keys = await summaryHistory.keys();
      const entries: SummaryHistoryEntry[] = [];
      for (const key of keys) {
        const entry = await summaryHistory.getItem<SummaryHistoryEntry>(key);
        if (entry) {
          entries.push(entry);
        }
      }
      entries.sort((a, b) => b.timestamp - a.timestamp);
      return entries.slice(0, limit);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return [];
    }
  }

  /** Nettoyer le cache */
  async clearCache() {
    try {
      await aiCache.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error);
    }
  }

  /** Nettoyer l'historique */
  async clearHistory() {
    try {
      await summaryHistory.clear();
    } catch (error) {
      console.error("Erreur lors du nettoyage de l'historique:", error);
    }
  }

  /** Obtenir les statistiques du cache */
  async getCacheStats() {
    try {
      const cacheKeys = await aiCache.keys();
      const historyKeys = await summaryHistory.keys();
      return {
        cacheSize: cacheKeys.length,
        maxCacheSize: this.MAX_CACHE_SIZE,
        historySize: historyKeys.length,
        maxHistorySize: this.MAX_HISTORY_SIZE,
        cacheDuration: this.CACHE_DURATION,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        cacheSize: 0,
        maxCacheSize: this.MAX_CACHE_SIZE,
        historySize: 0,
        maxHistorySize: this.MAX_HISTORY_SIZE,
        cacheDuration: this.CACHE_DURATION,
      };
    }
  }
}

// Instance singleton
export const aiService = new MistralAIService();
// Alias de compatibilité (nom historique utilisé par certains tests/imports).
export const mistralService = aiService;
export type { AIResponse, AIConfig, SummaryHistoryEntry };
