// LanguageContext - 国际化上下文
import { createContext, useState, useCallback, useContext } from 'react';
import zh from '../i18n/zh.json';
import en from '../i18n/en.json';

const translations = { zh, en };

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('vfm_language');
    return stored || 'zh';
  });

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    // 如果没找到，尝试中文
    if (!value && language !== 'zh') {
      value = translations.zh;
      for (const k of keys) {
        value = value?.[k];
        if (!value) break;
      }
    }

    // 如果还没找到，返回原始key
    if (!value) return key;

    // 替换参数
    let result = value;
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${k}}`, 'g'), v);
    }

    return result;
  }, [language]);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('vfm_language', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t,
      changeLanguage,
      availableLanguages: ['zh', 'en']
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export default LanguageContext;
