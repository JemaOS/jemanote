// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  localeFor,
  lookupTranslation,
  setI18nLang,
  Lang,
  TranslationParams,
} from '@/i18n/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: TranslationParams) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'jemaos_lang';

// Langue initiale : choix persisté de l'utilisateur, sinon langue du
// navigateur/système (en ou fr), sinon anglais. Les PWA suivent donc la
// langue du système/navigateur par défaut.
function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') {
      return saved;
    }
  } catch {
    /* stockage indisponible */
  }
  try {
    const candidates: readonly string[] =
      navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    for (const candidate of candidates) {
      const short = candidate.toLowerCase().split('-')[0];
      if (short === 'en' || short === 'fr') {
        return short;
      }
    }
  } catch {
    /* navigator indisponible */
  }
  return 'en';
}

export function LanguageProvider({ children }: { readonly children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    setI18nLang(lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const value = lookupTranslation(lang, key) ?? lookupTranslation('en', key) ?? key;
      if (!params) {
        return value;
      }
      return value.replace(/\{(\w+)\}/g, (match, param: string) =>
        Object.prototype.hasOwnProperty.call(params, param) ? String(params[param]) : match
      );
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, locale: localeFor(lang) }), [lang, t, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// Le provider et le hook cohabitent volontairement dans ce fichier.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
