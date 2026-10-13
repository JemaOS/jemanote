// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

/**
 * Unit tests for the LOCAL Mistral account API (no network, fetch stubbed).
 *
 * Focus: request shape to /v1/models, parsing of the locally stored status,
 * invalid-key / unreachable / not-connected error mapping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { aiService, AINotConnectedError, AI_DEFAULT_MODEL } from '@/services/ai/mistralService';
import { translate } from '@/i18n/translations';
import { mockLocalforage } from '@/tests/__mocks__/localStorage';

const MODELS_URL = 'https://api.mistral.ai/v1/models';
const TEST_API_KEY = 'sk-test-key-1234567890';

/** Build a minimal fetch Response stub for the service under test. */
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('mistralService local account API', () => {
  const mockFetch = vi.fn();

  beforeEach(async () => {
    await mockLocalforage.clear();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const firstCall = (): [string, RequestInit] =>
    mockFetch.mock.calls[0] as unknown as [string, RequestInit];

  async function seedCredentials(model: string = AI_DEFAULT_MODEL): Promise<void> {
    await mockLocalforage.setItem('mistral', {
      apiKey: TEST_API_KEY,
      model,
      key_last4: TEST_API_KEY.slice(-4),
      connectedAt: Date.now(),
    });
  }

  it('getConnectionStatus parses stored credentials and updates the cached model', async () => {
    await seedCredentials('mistral-large-latest');

    const status = await aiService.getConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.model).toBe('mistral-large-latest');
    expect(status.key_last4).toBe(TEST_API_KEY.slice(-4));
    expect(status.connected_at).toBeTruthy();
    expect(aiService.getModel()).toBe('mistral-large-latest');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('getConnectionStatus reports a disconnected status when nothing is stored', async () => {
    const status = await aiService.getConnectionStatus();

    expect(status).toEqual({
      connected: false,
      model: null,
      key_last4: null,
      connected_at: null,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('connectAccount GETs /v1/models with a Bearer key and returns the connected status', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { object: 'list', data: [] }));

    const status = await aiService.connectAccount(TEST_API_KEY, 'mistral-small-latest');

    const [url, init] = firstCall();
    expect(url).toBe(MODELS_URL);
    // GET request: no method set (or explicitly GET).
    expect(init.method ?? 'GET').toBe('GET');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TEST_API_KEY}`);

    expect(status.connected).toBe(true);
    expect(status.model).toBe('mistral-small-latest');
    expect(status.key_last4).toBe(TEST_API_KEY.slice(-4));
    expect(aiService.isConfigured()).toBe(true);
  });

  it('connectAccount defaults to AI_DEFAULT_MODEL when no model is given', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { object: 'list', data: [] }));

    const status = await aiService.connectAccount(TEST_API_KEY);

    expect(status.model).toBe(AI_DEFAULT_MODEL);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('connectAccount rejects with the invalid-key message on HTTP 401', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(401, { error: { message: 'Unauthorized' } }));

    await expect(aiService.connectAccount(TEST_API_KEY)).rejects.toThrow(translate('aiInvalidKey'));
  });

  it('connectAccount rejects with the invalid-key message on HTTP 403', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { error: { message: 'Forbidden' } }));

    await expect(aiService.connectAccount(TEST_API_KEY)).rejects.toThrow(translate('aiInvalidKey'));
  });

  it('connectAccount rejects with cannotReachMistral when the request fails', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(aiService.connectAccount(TEST_API_KEY)).rejects.toThrow(
      translate('cannotReachMistral')
    );
  });

  it('connectAccount rejects a too-short key without calling Mistral', async () => {
    await expect(aiService.connectAccount('short-key')).rejects.toThrow(translate('aiInvalidKey'));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('setModel updates the persisted model', async () => {
    // clearCache would otherwise wipe credentials under the shared mock store.
    const clearSpy = vi.spyOn(aiService, 'clearCache').mockResolvedValue(undefined);
    await seedCredentials('mistral-medium-latest');

    const status = await aiService.setModel('mistral-large-latest');

    expect(status).toMatchObject({ connected: true, model: 'mistral-large-latest' });
    expect(aiService.getModel()).toBe('mistral-large-latest');

    const reread = await aiService.getConnectionStatus();
    expect(reread.model).toBe('mistral-large-latest');

    clearSpy.mockRestore();
  });

  it('setModel rejects with AINotConnectedError when nothing is stored', async () => {
    await expect(aiService.setModel('mistral-small-latest')).rejects.toBeInstanceOf(
      AINotConnectedError
    );
  });

  it('disconnectAccount clears the stored connection', async () => {
    await seedCredentials();

    await aiService.disconnectAccount();

    const status = await aiService.getConnectionStatus();
    expect(status.connected).toBe(false);
  });

  it('summarize rejects with AINotConnectedError when no key is stored', async () => {
    await expect(aiService.summarize('__unit_no_connection_prompt__')).rejects.toBeInstanceOf(
      AINotConnectedError
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
