// Copyright (c) 2025 Jema Technology.
// Tests for AISettingsSection component

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AISettingsSection from '@/components/ai/AISettingsSection';
import { translate } from '@/i18n/translations';

import { render, screen, waitFor } from '@/tests/utils/test-utils';

vi.mock('@/services/ai/mistralService', () => ({
  aiService: {
    getConnectionStatus: vi.fn(),
    connectAccount: vi.fn(),
    disconnectAccount: vi.fn(),
    setModel: vi.fn(),
    getCacheStats: vi.fn().mockResolvedValue({
      cacheSize: 0,
      maxCacheSize: 100,
      historySize: 0,
      maxHistorySize: 50,
      cacheDuration: 0,
    }),
    clearCache: vi.fn().mockResolvedValue(undefined),
    clearHistory: vi.fn().mockResolvedValue(undefined),
  },
  AI_DEFAULT_MODEL: 'mistral-medium-latest',
  AI_MODELS: [
    { id: 'mistral-small-latest', label: 'Mistral Small' },
    { id: 'mistral-medium-latest', label: 'Mistral Medium' },
    { id: 'mistral-large-latest', label: 'Mistral Large' },
  ],
  AINotConnectedError: class AINotConnectedError extends Error {
    constructor() {
      super('not connected');
      this.name = 'AINotConnectedError';
    }
  },
}));

async function getAiService() {
  const mod = await import('@/services/ai/mistralService');
  return mod.aiService as unknown as {
    getConnectionStatus: ReturnType<typeof vi.fn>;
    connectAccount: ReturnType<typeof vi.fn>;
    disconnectAccount: ReturnType<typeof vi.fn>;
    setModel: ReturnType<typeof vi.fn>;
    getCacheStats: ReturnType<typeof vi.fn>;
  };
}

describe('AISettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the auth-required message and no connect form when userId is null', async () => {
    const aiService = await getAiService();

    render(<AISettingsSection userId={null} />);

    expect(await screen.findByText(translate('aiAuthRequired'))).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(translate('mistralApiKeyPlaceholder'))).toBeNull();
    expect(
      screen.queryByRole('button', { name: translate('connectMistralAccount') })
    ).toBeNull();
    expect(aiService.getConnectionStatus).not.toHaveBeenCalled();
  });

  it('shows the connect form when the account is not connected', async () => {
    const aiService = await getAiService();
    aiService.getConnectionStatus.mockResolvedValue({
      connected: false,
      model: null,
      key_last4: null,
    });

    render(<AISettingsSection userId="u1" />);

    const input = await screen.findByPlaceholderText(translate('mistralApiKeyPlaceholder'));
    expect(input).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: translate('connectMistralAccount') })
    ).toBeInTheDocument();
    expect(aiService.getConnectionStatus).toHaveBeenCalledTimes(1);
  });

  it('shows the masked key label and disconnect button when connected', async () => {
    const aiService = await getAiService();
    aiService.getConnectionStatus.mockResolvedValue({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: 'abcd',
    });

    render(<AISettingsSection userId="u1" />);

    expect(
      await screen.findByText(translate('connectedAs', { last4: 'abcd' }))
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: translate('disconnectMistral') })
    ).toBeInTheDocument();
  });

  it('calls connectAccount with the typed key on submit', async () => {
    const user = userEvent.setup();
    const aiService = await getAiService();
    aiService.getConnectionStatus.mockResolvedValue({
      connected: false,
      model: null,
      key_last4: null,
    });
    aiService.connectAccount.mockResolvedValue({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: 'wxyz',
    });

    render(<AISettingsSection userId="u1" />);

    const input = await screen.findByPlaceholderText(translate('mistralApiKeyPlaceholder'));
    await user.type(input, 'sk-test-key-123');
    await user.click(screen.getByRole('button', { name: translate('connectMistralAccount') }));

    await waitFor(() => {
      expect(aiService.connectAccount).toHaveBeenCalledWith('sk-test-key-123', 'mistral-medium-latest');
    });
  });

  it('calls setModel with the selected model when connected', async () => {
    const user = userEvent.setup();
    const aiService = await getAiService();
    aiService.getConnectionStatus.mockResolvedValue({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: 'abcd',
    });
    aiService.setModel.mockResolvedValue({
      connected: true,
      model: 'mistral-large-latest',
      key_last4: 'abcd',
    });

    render(<AISettingsSection userId="u1" />);

    await screen.findByText(translate('connectedAs', { last4: 'abcd' }));
    const select = screen.getByLabelText(translate('aiModelLabel'));
    await user.selectOptions(select, 'mistral-large-latest');

    await waitFor(() => {
      expect(aiService.setModel).toHaveBeenCalledWith('mistral-large-latest');
    });
  });

  it('calls disconnectAccount when clicking disconnect', async () => {
    const user = userEvent.setup();
    const aiService = await getAiService();
    aiService.getConnectionStatus.mockResolvedValue({
      connected: true,
      model: 'mistral-medium-latest',
      key_last4: 'abcd',
    });
    aiService.disconnectAccount.mockResolvedValue(undefined);

    render(<AISettingsSection userId="u1" />);

    const disconnect = await screen.findByRole('button', {
      name: translate('disconnectMistral'),
    });
    await user.click(disconnect);

    await waitFor(() => {
      expect(aiService.disconnectAccount).toHaveBeenCalledTimes(1);
    });
  });
});
