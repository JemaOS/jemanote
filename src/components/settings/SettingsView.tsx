// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { Palette, Type, Cloud, Moon, Sun, Keyboard } from 'lucide-react';

import AISettingsSection from '@/components/ai/AISettingsSection';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsViewProps {
  readonly userId?: string | null;
}

export default function SettingsView({ userId }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="h-full bg-surface-bg dark:bg-neutral-900 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-title font-bold text-neutral-900 dark:text-neutral-100 mb-8">
          {t('settingsTitle')}
        </h2>

        <div className="space-y-6">
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="h-6 w-6 text-primary-500" />
              <h3 className="text-subtitle font-semibold text-neutral-900 dark:text-neutral-100">
                {t('appearance')}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="theme-label"
                  className="block text-body font-medium text-neutral-700 dark:text-neutral-300 mb-3"
                >
                  {t('theme')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setTheme('light');
                    }}
                    className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="font-medium">{t('light')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                    }}
                    className={`flex items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="font-medium">{t('dark')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Type className="h-6 w-6 text-primary-500" />
              <h3 className="text-subtitle font-semibold text-neutral-900 dark:text-neutral-100">
                {t('editor')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="lineNumbers"
                  className="text-body text-neutral-700 dark:text-neutral-300"
                >
                  {t('lineNumbers')}
                </label>
                <input
                  id="lineNumbers"
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="autoSave"
                  className="text-body text-neutral-700 dark:text-neutral-300"
                >
                  {t('autoSave')}
                </label>
                <input
                  id="autoSave"
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="vimMode"
                  className="text-body text-neutral-700 dark:text-neutral-300"
                >
                  {t('vimMode')}
                </label>
                <input
                  id="vimMode"
                  type="checkbox"
                  className="h-5 w-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Raccourcis clavier */}
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Keyboard className="h-6 w-6 text-primary-500" />
              <h3 className="text-subtitle font-semibold text-neutral-900 dark:text-neutral-100">
                {t('keyboardShortcuts')}
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { keys: ['Ctrl', 'K'], description: t('openCommandPalette') },
                { keys: ['Ctrl', 'N'], description: t('createNewNote') },
                { keys: ['Ctrl', 'S'], description: t('saveNoteShortcut') },
                { keys: ['Ctrl', 'F'], description: t('searchInNotes') },
                { keys: ['Ctrl', 'Shift', 'L'], description: t('toggleThemeShortcut') },
                { keys: ['Ctrl', 'B'], description: t('boldText') },
                { keys: ['Ctrl', 'I'], description: t('italicText') },
                { keys: ['Ctrl', 'Z'], description: t('undo') },
                { keys: ['Ctrl', 'Y'], description: t('redo') },
                { keys: [t('escapeKey')], description: t('closeActivePanel') },
              ].map(({ keys, description }) => (
                <div
                  key={description}
                  className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700 last:border-0"
                >
                  <span className="text-body text-neutral-700 dark:text-neutral-300">
                    {description}
                  </span>
                  <div className="flex items-center gap-1">
                    {keys.map((key, index) => (
                      <span key={key} className="flex items-center gap-1">
                        {index > 0 && (
                          <span className="text-caption text-neutral-400 dark:text-neutral-500">+</span>
                        )}
                        <kbd className="px-2 py-1 text-caption font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded shadow-sm text-neutral-700 dark:text-neutral-300">
                          {key}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration IA */}
          <AISettingsSection />

          {userId && (
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Cloud className="h-6 w-6 text-primary-500" />
                <h3 className="text-subtitle font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('cloudSync')}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="syncEnabled"
                    className="text-body text-neutral-700 dark:text-neutral-300"
                  >
                    {t('syncEnabledLabel')}
                  </label>
                  <input
                    id="syncEnabled"
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="syncInterval"
                    className="block text-body font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                  >
                    {t('syncInterval')}
                  </label>
                  <input
                    id="syncInterval"
                    type="number"
                    defaultValue={60}
                    min={10}
                    className="w-full h-12 px-4 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-md text-body text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
