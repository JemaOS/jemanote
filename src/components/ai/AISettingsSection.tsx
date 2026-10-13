// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import {
  Sparkles,
  Check,
  Loader2,
  AlertTriangle,
  KeyRound,
  LogOut,
  ShieldCheck,
  Server,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState, useEffect, useCallback, type FormEvent } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  aiService,
  AI_DEFAULT_MODEL,
  AI_MODELS,
  type AIConnectionStatus,
} from '@/services/ai/mistralService';

interface AISettingsSectionProps {
  readonly userId?: string | null;
}

const EMPTY_STATUS: AIConnectionStatus = {
  connected: false,
  model: null,
  key_last4: null,
};

export default function AISettingsSection({ userId }: AISettingsSectionProps) {
  const { t } = useLanguage();

  const [status, setStatus] = useState<AIConnectionStatus>(EMPTY_STATUS);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState<string>(AI_DEFAULT_MODEL);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cacheStats, setCacheStats] = useState({
    cacheSize: 0,
    maxCacheSize: 100,
    historySize: 0,
    maxHistorySize: 50,
    cacheDuration: 0,
  });

  const loadStats = useCallback(async () => {
    const stats = await aiService.getCacheStats();
    setCacheStats(stats);
  }, []);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError('');
    try {
      const next = await aiService.getConnectionStatus();
      setStatus(next);
      if (next.model) {
        setModel(next.model);
      }
    } catch (statusError) {
      setStatus(EMPTY_STATUS);
      setError(statusError instanceof Error ? statusError.message : t('aiServiceConfigProblem'));
    } finally {
      setLoadingStatus(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (userId) {
      void loadStatus();
    } else {
      setLoadingStatus(false);
      setStatus(EMPTY_STATUS);
    }
  }, [userId, loadStatus]);

  const handleConnect = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      return;
    }
    setConnecting(true);
    setError('');
    setNotice('');
    try {
      const next = await aiService.connectAccount(trimmed, model);
      setStatus(next);
      if (next.model) {
        setModel(next.model);
      }
      setApiKey('');
      setShowKey(false);
      setNotice(t('connectSuccess'));
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : t('aiServiceConfigProblem'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError('');
    setNotice('');
    try {
      await aiService.disconnectAccount();
      setStatus(EMPTY_STATUS);
      setModel(AI_DEFAULT_MODEL);
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error ? disconnectError.message : t('aiServiceConfigProblem')
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const handleModelChange = async (nextModel: string) => {
    const previousModel = model;
    setModel(nextModel);
    setNotice('');
    if (!status.connected) {
      return;
    }
    setBusy(true);
    try {
      const next = await aiService.setModel(nextModel);
      setStatus(next);
      setNotice(t('aiModelSaved'));
    } catch (modelError) {
      // Revert the selector: the model was not actually saved.
      setModel(previousModel);
      setError(modelError instanceof Error ? modelError.message : t('aiServiceConfigProblem'));
    } finally {
      setBusy(false);
    }
  };

  const handleClearCache = async () => {
    setBusy(true);
    setError('');
    try {
      await aiService.clearCache();
      await loadStats();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : t('aiServiceConfigProblem'));
    } finally {
      setBusy(false);
    }
  };

  const handleClearHistory = async () => {
    setBusy(true);
    setError('');
    try {
      await aiService.clearHistory();
      await loadStats();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : t('aiServiceConfigProblem'));
    } finally {
      setBusy(false);
    }
  };

  const renderStatus = () => {
    if (!userId) {
      return (
        <div className="p-3 sm:p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md">
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            {t('aiAuthRequired')}
          </p>
        </div>
      );
    }

    if (loadingStatus) {
      return (
        <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-spin" />
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
            {t('checkingMistralConnection')}
          </p>
        </div>
      );
    }

    if (status.connected) {
      return (
        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {status.key_last4
                    ? t('connectedAs', { last4: status.key_last4 })
                    : t('mistralAccountConnected')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                {t('aiServiceConnectedDesc')}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3 py-1.5 text-xs border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
            >
              {disconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <LogOut className="w-3 h-3" />
              )}
              {disconnecting ? t('disconnecting') : t('disconnectMistral')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
              {t('mistralNotConnected')}
            </p>
            <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">
              {t('aiNotConnected')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
        <h3 className="text-sm sm:text-subtitle font-semibold text-neutral-900 dark:text-neutral-100">
          {t('aiAssistantMistral')}
        </h3>
      </div>

      <div className="space-y-4">
        {renderStatus()}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        {notice && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">{notice}</p>
          </div>
        )}

        {/* Connexion du compte Mistral de l'utilisateur */}
        {userId && !status.connected && !loadingStatus && (
          <form onSubmit={handleConnect} className="space-y-3" autoComplete="off">
            <div className="flex items-start gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
              <KeyRound className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary-500" />
              <p>{t('mistralConnectDesc')}</p>
            </div>

            <div>
              <label
                htmlFor="mistralApiKey"
                className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                {t('mistralApiKeyLabel')}
              </label>
              <div className="relative">
                <input
                  id="mistralApiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={event => { setApiKey(event.target.value); }}
                  placeholder={t('mistralApiKeyPlaceholder')}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-11 px-3 pr-11 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-md text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => { setShowKey(v => !v); }}
                  aria-label={showKey ? t('hideKey') : t('showKey')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t('mistralApiKeyHelp')}
              </p>
            </div>

            <button
              type="submit"
              disabled={connecting || !apiKey.trim()}
              className="w-full px-4 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {connecting ? t('connecting') : t('connectMistralAccount')}
            </button>
          </form>
        )}

        {/* Sélecteur de modèle */}
        {userId && (status.connected || !loadingStatus) && (
          <div>
            <label
              htmlFor="aiModel"
              className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              {t('aiModelLabel')}
            </label>
            <select
              id="aiModel"
              value={model}
              disabled={busy}
              onChange={event => void handleModelChange(event.target.value)}
              className="w-full h-11 px-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-md text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {AI_MODELS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {status.connected && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t('mistralReconnectHint')}
              </p>
            )}
          </div>
        )}

        {/* Cache */}
        <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-md space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 dark:text-neutral-300">{t('cachedResponses')}</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {cacheStats.cacheSize} / {cacheStats.maxCacheSize}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 dark:text-neutral-300">{t('summaryHistory')}</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {cacheStats.historySize} / {cacheStats.maxHistorySize}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearCache}
              disabled={busy}
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              {t('clearCache')}
            </button>
            <button
              onClick={handleClearHistory}
              disabled={busy}
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              {t('clearHistory')}
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('cacheInfo')}</p>
        </div>

        {/* Fonctionnalités disponibles */}
        <div className="p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/20 rounded-md">
          <p className="text-xs sm:text-sm font-medium text-primary-900 dark:text-neutral-100 mb-2">
            {t('availableAIFeatures')}
          </p>
          <ul className="text-xs sm:text-sm text-primary-800 dark:text-neutral-200 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>{t('featureAutoSummaries')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>{t('featureSummaryHistory')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>{t('featureAutoSuggest')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>{t('featureTagGeneration')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>{t('featureWritingAssistance')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>{t('featureBrainstorming')}</span>
            </li>
          </ul>
        </div>

        {/* Note de confidentialité */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>{t('privacy')}</strong> {t('privacyNote')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
