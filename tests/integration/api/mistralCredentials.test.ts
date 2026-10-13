// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

/**
 * Integration regression tests for the per-user Mistral backend contract.
 *
 * MSW handlers are defined INLINE (the shared handlers in
 * tests/integration/mocks/handlers.ts are referenced for style only) so the
 * network contract of the credential endpoints and the chat proxy can be
 * asserted precisely.
 */

import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { aiService, AINotConnectedError } from '@/services/ai/mistralService';

const FUNCTIONS_BASE = 'https://yadtnmgyrmigqbndnmho.supabase.co/functions/v1';
const STATUS_URL = `${FUNCTIONS_BASE}/mistral-credentials/status`;
const CONNECT_URL = `${FUNCTIONS_BASE}/mistral-credentials/connect`;
const MODEL_URL = `${FUNCTIONS_BASE}/mistral-credentials/model`;
const DISCONNECT_URL = `${FUNCTIONS_BASE}/mistral-credentials/disconnect`;
const PROXY_URL = `${FUNCTIONS_BASE}/mistral-proxy`;

let server: ReturnType<typeof import('msw/node').setupServer>;

// Captured request data for contract assertions.
let statusHeaders: { authorization: string | null; apikey: string | null } | null = null;
let connectBody: unknown = null;
let modelBody: unknown = null;
let disconnectCalled = false;

const handlers = [
  http.post(STATUS_URL, async ({ request }) => {
    statusHeaders = {
      authorization: request.headers.get('authorization'),
      apikey: request.headers.get('apikey'),
    };
    return HttpResponse.json({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: '4321',
    });
  }),

  http.post(CONNECT_URL, async ({ request }) => {
    connectBody = await request.json();
    return HttpResponse.json({
      connected: true,
      model: 'mistral-large-latest',
      key_last4: 'a-key',
    });
  }),

  http.post(MODEL_URL, async ({ request }) => {
    modelBody = await request.json();
    return HttpResponse.json({
      connected: true,
      model: 'mistral-small-latest',
      key_last4: '4321',
    });
  }),

  http.post(DISCONNECT_URL, async () => {
    disconnectCalled = true;
    return HttpResponse.json({ connected: false, model: null, key_last4: null });
  }),

  http.post(PROXY_URL, async () => {
    return HttpResponse.json({
      data: {
        choices: [{ message: { content: 'RÉSUMÉ' } }],
        usage: { promptTokens: 10, completionTokens: 3, totalTokens: 13 },
      },
    });
  }),
];

beforeAll(async () => {
  const { setupServer } = await import('msw/node');
  server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  statusHeaders = null;
  connectBody = null;
  modelBody = null;
  disconnectCalled = false;
});

afterAll(() => {
  server.close();
});

describe('Mistral per-user credentials contract', () => {
  it('getConnectionStatus hits /status with auth headers and returns the status', async () => {
    const status = await aiService.getConnectionStatus();

    expect(status).toMatchObject({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: '4321',
    });
    expect(statusHeaders?.authorization).toBeTruthy();
    expect(statusHeaders?.apikey).toBeTruthy();
  });

  it('connectAccount POSTs api_key + model to /connect and returns the connected status', async () => {
    const status = await aiService.connectAccount('a-key', 'mistral-large-latest');

    expect(connectBody).toEqual({ api_key: 'a-key', model: 'mistral-large-latest' });
    expect(status).toMatchObject({ connected: true, model: 'mistral-large-latest' });
  });

  it('setModel POSTs the model to /model and returns the updated status', async () => {
    const status = await aiService.setModel('mistral-small-latest');

    expect(modelBody).toEqual({ model: 'mistral-small-latest' });
    expect(status).toMatchObject({ connected: true, model: 'mistral-small-latest' });
  });

  it('disconnectAccount POSTs to /disconnect', async () => {
    await aiService.disconnectAccount();

    expect(disconnectCalled).toBe(true);
  });

  it('summarize hits /mistral-proxy and returns the choice content', async () => {
    const uniqueText = 'Texte unique proxy 5 pour le contrat des identifiants Mistral.';

    const summary = await aiService.summarize(uniqueText, 'short');

    expect(summary).toBe('RÉSUMÉ');
  });

  it('summarize rejects with AINotConnectedError on 409 not_connected', async () => {
    server.use(
      http.post(PROXY_URL, () =>
        HttpResponse.json({ error: { code: 'not_connected' } }, { status: 409 })
      )
    );

    const uniqueText = 'Texte unique proxy 6 pour le contrat des identifiants Mistral.';

    await expect(aiService.summarize(uniqueText, 'short')).rejects.toThrow(AINotConnectedError);
  });
});
