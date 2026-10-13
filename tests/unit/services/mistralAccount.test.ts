// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  aiService,
  AINotConnectedError,
  AI_DEFAULT_MODEL,
} from '@/services/ai/mistralService';
import { translate } from '@/i18n/translations';

const SUPABASE_URL = 'https://yadtnmgyrmigqbndnmho.supabase.co';
const CREDENTIALS_BASE = `${SUPABASE_URL}/functions/v1/mistral-credentials`;

/** Build a minimal fetch Response stub for the service under test. */
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('mistralService per-user account API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const firstCall = (): [string, RequestInit] =>
    mockFetch.mock.calls[0] as unknown as [string, RequestInit];

  const headersOf = (init: RequestInit): Record<string, string> =>
    init.headers as Record<string, string>;

  it('getConnectionStatus parses the status and updates the cached model', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        connected: true,
        model: 'mistral-large-latest',
        key_last4: 'ab12',
        connected_at: '2026-01-01T00:00:00Z',
      })
    );

    const status = await aiService.getConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.model).toBe('mistral-large-latest');
    expect(status.key_last4).toBe('ab12');
    expect(aiService.getModel()).toBe('mistral-large-latest');

    const [url] = firstCall();
    expect(url).toBe(`${CREDENTIALS_BASE}/status`);
  });

  it('connectAccount posts api_key and model with auth headers and returns the parsed status', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        connected: true,
        model: 'mistral-small-latest',
        key_last4: '1234',
      })
    );

    const status = await aiService.connectAccount('sk-test-123', 'mistral-small-latest');

    const [url, init] = firstCall();
    expect(url).toBe(`${CREDENTIALS_BASE}/connect`);
    expect(init.method).toBe('POST');

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.api_key).toBe('sk-test-123');
    expect(body.model).toBe('mistral-small-latest');

    const headers = headersOf(init);
    expect(headers.apikey).toBeTruthy();
    expect(headers.Authorization).toMatch(/^Bearer .+/);

    expect(status.connected).toBe(true);
    expect(status.model).toBe('mistral-small-latest');
    expect(status.key_last4).toBe('1234');
  });

  it('connectAccount defaults to AI_DEFAULT_MODEL when no model is given', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { connected: true, model: AI_DEFAULT_MODEL, key_last4: '0000' })
    );

    await aiService.connectAccount('sk-default');

    const [, init] = firstCall();
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.model).toBe(AI_DEFAULT_MODEL);
  });

  it('connectAccount rejects with the invalid-key message on HTTP 400 invalid_key', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(400, { error: { code: 'invalid_key' } })
    );

    await expect(aiService.connectAccount('bad-key')).rejects.toThrow(
      translate('aiInvalidKey')
    );
  });

  it('getConnectionStatus rejects with the auth-required message on HTTP 401', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized' } }));

    await expect(aiService.getConnectionStatus()).rejects.toThrow(
      translate('aiAuthRequired')
    );
  });

  it('disconnectAccount posts to the /disconnect endpoint', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { connected: false }));

    await aiService.disconnectAccount();

    const [url, init] = firstCall();
    expect(url).toBe(`${CREDENTIALS_BASE}/disconnect`);
    expect(init.method).toBe('POST');
  });

  it('setModel posts the model and updates getModel()', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        connected: true,
        model: 'mistral-large-latest',
        key_last4: 'ffff',
      })
    );

    const status = await aiService.setModel('mistral-large-latest');

    const [url, init] = firstCall();
    expect(url).toBe(`${CREDENTIALS_BASE}/model`);
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.model).toBe('mistral-large-latest');

    expect(status.model).toBe('mistral-large-latest');
    expect(aiService.getModel()).toBe('mistral-large-latest');
  });

  it('summarize rejects with AINotConnectedError when the proxy reports not_connected', async () => {
    // Unique prompt: the localforage mock is a shared store and the cache
    // compares the full prompt, so avoid colliding with any other test.
    const uniquePrompt = '__mistral_account_test_unique_prompt_409__';

    mockFetch.mockResolvedValueOnce(
      jsonResponse(409, { error: { code: 'not_connected' } })
    );

    await expect(aiService.summarize(uniquePrompt)).rejects.toBeInstanceOf(
      AINotConnectedError
    );
  });
});
