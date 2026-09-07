// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, Lang } from '@/i18n/translations';

interface LanguageSelectorProps {
  readonly variant?: 'mobile' | 'desktop';
}

// Language selector dropdown (EN/FR toggle, runtime override only)
export default function LanguageSelector({ variant = 'desktop' }: LanguageSelectorProps) {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (langCode: Lang) => {
    setLang(langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.language-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const otherLang = lang === 'en' ? 'fr' : 'en';

  const triggerClass =
    variant === 'mobile'
      ? 'p-1.5 xs:p-2 sm:p-2 md:p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors min-w-[40px] min-h-[40px] xs:min-w-[44px] xs:min-h-[44px] flex items-center justify-center gap-0.5 text-neutral-700 dark:text-neutral-300'
      : 'p-2 laptop:p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-1 text-neutral-700 dark:text-neutral-300';

  const iconClass =
    variant === 'mobile'
      ? 'h-4.5 w-4.5 xs:h-5 xs:w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6'
      : 'h-5 w-5 laptop:h-5.5 laptop:w-5.5 laptop-lg:h-6 laptop-lg:w-6';

  return (
    <div className="language-selector relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={triggerClass}
        title={t('language')}
        aria-label={t('language')}
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconClass}
        >
          <path d="M5 8l6 6M4 14h8M5.5 14l2-6h1l2 6" />
          <path d="M14 5h6M17 5v9M14 9h6" />
        </svg>
        <span className="text-xs font-medium">
          {lang.toUpperCase()}/{otherLang.toUpperCase()}
        </span>
        <span className="text-[8px] leading-none">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 min-w-[120px] py-1">
          {Object.values(LANGUAGES).map(l => (
            <button
              key={l.code}
              onClick={e => {
                e.stopPropagation();
                handleSelect(l.code);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                lang === l.code
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
