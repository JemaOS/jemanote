// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getSystemLang,
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

export function LanguageProvider({ children }: { readonly children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSystemLang);

  useEffect(() => {
    // JemaOS: the system language always wins on the languagechange event
    window.addEventListener('languagechange', () => {
      setLangState(getSystemLang());
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    setI18nLang(lang);
  }, [lang]);

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

  const value = useMemo(
    () => ({ lang, setLang: setLangState, t, locale: localeFor(lang) }),
    [lang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
