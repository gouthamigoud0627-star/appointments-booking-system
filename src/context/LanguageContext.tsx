import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLocale } from '../types';
import { AVAILABLE_LANGUAGES, getTranslation, LanguageInfo } from '../i18n';

interface LanguageContextType {
  language: SupportedLocale;
  setLanguage: (lang: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANGUAGE_STORAGE_KEY = 'schedora_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLocale>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLocale;
      if (stored && ['en', 'te', 'hi', 'ta', 'kn', 'ml'].includes(stored)) {
        return stored;
      }
      // Check browser language
      const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
      if (['te', 'hi', 'ta', 'kn', 'ml'].includes(browserLang as SupportedLocale)) {
        return browserLang as SupportedLocale;
      }
    } catch (_) {}
    return 'en';
  });

  const setLanguage = useCallback((newLang: SupportedLocale) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (_) {}
  }, [language]);

  const t = useCallback((key: string, fallback?: string) => {
    return getTranslation(language, key, fallback);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: AVAILABLE_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
