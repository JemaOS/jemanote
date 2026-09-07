// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { Command } from 'cmdk';
import {
  FileText,
  Search,
  Settings,
  Moon,
  Sun,
  Plus,
  LogIn,
  LogOut,
  Paintbrush,
  History,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ViewMode, Note } from '@/types';

interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly notes: readonly Note[];
  readonly currentView: ViewMode;
  readonly onViewChange: (view: ViewMode) => void;
  readonly onNoteSelect: (noteId: string) => void;
  readonly onCreateNote: () => void;
  readonly onShowAuth: () => void;
  readonly user: unknown;
  readonly onSignOut: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  notes,
  currentView,
  onViewChange,
  onNoteSelect,
  onCreateNote,
  onShowAuth,
  user,
  onSignOut,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSelect = (callback: () => void) => {
    callback();
    onClose();
    setSearch('');
  };

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in w-full h-full"
      onClick={onClose}
      aria-label={t('closeCommandPalette')}
    >
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
        <Command
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-modal border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700 px-4">
            <Search className="h-5 w-5 text-neutral-500 mr-2" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={t('commandPalettePlaceholder')}
              className="w-full h-14 bg-transparent border-none outline-none text-body text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500"
              autoFocus
            />
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-body text-neutral-500">
              {t('noResults')}
            </Command.Empty>

            {/* Actions */}
            <Command.Group
              heading={t('actions')}
              className="text-caption text-neutral-500 px-2 py-2 font-semibold"
            >
              <Command.Item
                onSelect={() => {
                  handleSelect(onCreateNote);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                <Plus className="h-5 w-5" />
                <span>{t('createNewNote')}</span>
                <span className="ml-auto text-caption text-neutral-500">Ctrl+N</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  handleSelect(toggleTheme);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span>{theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}</span>
                <span className="ml-auto text-caption text-neutral-500">Ctrl+Shift+L</span>
              </Command.Item>

              {user ? (
                <Command.Item
                  onSelect={() => {
                    handleSelect(onSignOut);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('signOut')}</span>
                </Command.Item>
              ) : (
                <Command.Item
                  onSelect={() => {
                    handleSelect(onShowAuth);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
                >
                  <LogIn className="h-5 w-5" />
                  <span>{t('signIn')}</span>
                </Command.Item>
              )}
            </Command.Group>

            {/* Vues */}
            <Command.Group
              heading={t('views')}
              className="text-caption text-neutral-500 px-2 py-2 font-semibold mt-2"
            >
              <Command.Item
                onSelect={() => {
                  handleSelect(() => {
                    onViewChange('workspace');
                  });
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                <FileText className="h-5 w-5" />
                <span>{t('workspace')}</span>
                {currentView === 'workspace' && (
                  <span className="ml-auto text-caption text-primary-500">{t('active')}</span>
                )}
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  handleSelect(() => {
                    onViewChange('canvas');
                  });
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                <Paintbrush className="h-5 w-5" />
                <span>{t('canvas')}</span>
                {currentView === 'canvas' && (
                  <span className="ml-auto text-caption text-primary-500">{t('active')}</span>
                )}
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  handleSelect(() => {
                    onViewChange('timeline');
                  });
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                <History className="h-5 w-5" />
                <span>{t('timeline')}</span>
                {currentView === 'timeline' && (
                  <span className="ml-auto text-caption text-primary-500">{t('active')}</span>
                )}
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  handleSelect(() => {
                    onViewChange('search');
                  });
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                <Search className="h-5 w-5" />
                <span>{t('searchTitle')}</span>
                {currentView === 'search' && (
                  <span className="ml-auto text-caption text-primary-500">{t('active')}</span>
                )}
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  handleSelect(() => {
                    onViewChange('settings');
                  });
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
              >
                <Settings className="h-5 w-5" />
                <span>{t('settings')}</span>
                {currentView === 'settings' && (
                  <span className="ml-auto text-caption text-primary-500">{t('active')}</span>
                )}
              </Command.Item>
            </Command.Group>

            {/* Notes */}
            {notes.length > 0 && (
              <Command.Group
                heading={t('notes')}
                className="text-caption text-neutral-500 px-2 py-2 font-semibold mt-2"
              >
                {notes.slice(0, 10).map(note => (
                  <Command.Item
                    key={note.id}
                    value={note.title}
                    onSelect={() => {
                      handleSelect(() => {
                        onNoteSelect(note.id);
                      });
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body text-neutral-900 dark:text-neutral-100"
                  >
                    <FileText className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{note.title}</div>
                      {note.content && (
                        <div className="text-caption text-neutral-500 truncate">
                          {note.content.slice(0, 60)}...
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </button>
  );
}
