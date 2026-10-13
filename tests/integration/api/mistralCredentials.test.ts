// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

/**
 * Integration regression tests for the LOCAL Mistral credentials contract.
 *
 * In local mode there is no JemaNote account: the user's Mistral key is
 * validated against https://api.mistral.ai/v1/models and then stored on the
 * device (localforage store `ai_credentials`, key `mistral`). Chat calls go
 * directly to https://api.mistral.ai/v1/chat/completions.
 *
 * MSW handlers are defined INLINE so the network contract (URLs + headers) of
 * the local credential endpoints and the direct chat call can be asserted
 * precisely.
 */

import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';

import { aiService, AINotConnectedError, AI_DEFAULT_MODEL } from '@/services/ai/mistralService';
import { translate } from '@/i18n/translations';
import { mockLocalforage } from '@/tests/__mocks__/localStorage';

const MODELS_URL = 'https://api.mistral.ai/v1/models';
const CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';
const TEST_API_KEY = 'sk-test-key-1234567890';

let server: ReturnType<typeof import('msw/node').setupServer>;

// Captured request data for contract assertions.
let modelsCalled = false;
let modelsAuthHeader: string | null = null;

const handlers = [
  http.get(MODELS_URL, ({ request }) => {
    modelsCalled = true;
    modelsAuthHeader = request.headers.get('authorization');
    return HttpResponse.json({
      object: 'list',
      data: [
        { id: 'mistral-small-latest', object: 'model' },
        { id: 'mistral-medium-latest', object: 'model' },
        { id: 'mistral-large-latest', object: 'model' },
      ],
    });
  }),

  http.post(CHAT_URL, async () => {
    return HttpResponse.json({
      choices: [{ message: { content: 'RÉSUMÉ' } }],
      usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 },
    });
  }),
];

let clearCacheSpy: { mockRestore: () => void } | undefined;

beforeAll(async () => {
  const { setupServer } = await import('msw/node');
  server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
  // The localforage mock is a single shared store; reset it between tests.
  await mockLocalforage.clear();
  modelsCalled = false;
  modelsAuthHeader = null;
});

afterEach(() => {
  server.resetHandlers();
  clearCacheSpy?.mockRestore();
  clearCacheSpy = undefined;
});

afterAll(() => {
  server.close();
});

/** Pre-seed a valid local connection (bypasses clearCache mock artifact). */
async function seedConnection(model: string = AI_DEFAULT_MODEL): Promise<void> {
  await mockLocalforage.setItem('mistral', {
    apiKey: TEST_API_KEY,
    model,
    key_last4: TEST_API_KEY.slice(-4),
    connectedAt: Date.now(),
  });
}

describe('Mistral local credentials contract', () => {
  it('connectAccount GETs /v1/models with the key and persists the connection', async () => {
    // Isolate the persistence concern from the cache-clearing side effect: under
    // the shared localforage mock, clearCache() would also wipe the credentials
    // it just stored (in production these are two separate stores).
    clearCacheSpy = vi.spyOn(aiService, 'clearCache').mockResolvedValue(undefined);

    const status = await aiService.connectAccount(TEST_API_KEY, 'mistral-large-latest');

    expect(modelsCalled).toBe(true);
    expect(modelsAuthHeader).toBe(`Bearer ${TEST_API_KEY}`);
    expect(status).toMatchObject({
      connected: true,
      model: 'mistral-large-latest',
      key_last4: TEST_API_KEY.slice(-4),
    });

    const persisted = await aiService.getConnectionStatus();
    expect(persisted.connected).toBe(true);
    expect(persisted.model).toBe('mistral-large-latest');
    expect(persisted.key_last4).toBe(TEST_API_KEY.slice(-4));
  });

  it('getConnectionStatus returns the persisted status', async () => {
    await seedConnection('mistral-medium-latest');

    const status = await aiService.getConnectionStatus();

    expect(status).toMatchObject({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: TEST_API_KEY.slice(-4),
    });
    expect(status.connected_at).toBeTruthy();
  });

  it('getConnectionStatus reports disconnected when nothing is stored', async () => {
    const status = await aiService.getConnectionStatus();

    expect(status).toEqual({
      connected: false,
      model: null,
      key_last4: null,
      connected_at: null,
    });
  });

  it('setModel updates the stored model', async () => {
    clearCacheSpy = vi.spyOn(aiService, 'clearCache').mockResolvedValue(undefined);
    await seedConnection('mistral-medium-latest');

    const status = await aiService.setModel('mistral-small-latest');

    expect(status).toMatchObject({ connected: true, model: 'mistral-small-latest' });
    const reread = await aiService.getConnectionStatus();
    expect(reread.model).toBe('mistral-small-latest');
  });

  it('disconnectAccount clears the stored connection', async () => {
    await seedConnection();

    await aiService.disconnectAccount();

    const status = await aiService.getConnectionStatus();
    expect(status.connected).toBe(false);
    expect(status.key_last4).toBeNull();
  });

  it('connectAccount rejects with the invalid-key message on 401 from /v1/models', async () => {
    server.use(
      http.get(MODELS_URL, () =>
        HttpResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
      )
    );

    await expect(aiService.connectAccount(TEST_API_KEY)).rejects.toThrow(
      translate('aiInvalidKey')
    );
  });

  it('connectAccount rejects with cannotReachMistral on a network error', async () => {
    server.use(http.get(MODELS_URL, () => HttpResponse.error()));

    await expect(aiService.connectAccount(TEST_API_KEY)).rejects.toThrow(
      translate('cannotReachMistral')
    );
  });

  it('summarize with no connection rejects with AINotConnectedError', async () => {
    await expect(
      aiService.summarize('Texte sans connexion locale Mistral.', 'short')
    ).rejects.toBeInstanceOf(AINotConnectedError);
  });

  it('summarize hits api.mistral.ai and returns the native choice content', async () => {
    await seedConnection();
    const uniqueText = 'Texte unique local 1 pour le contrat des identifiants Mistral.';

    const summary = await aiService.summarize(uniqueText, 'short');

    expect(summary).toBe('RÉSUMÉ');
  });
});
