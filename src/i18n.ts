import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app-locale') : null;
const defaultLocale = (import.meta as any).env?.VITE_DEFAULT_LOCALE || saved || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources: { zh: { translation: zh }, en: { translation: en } },
    lng: defaultLocale,
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('app-locale', lng);
  document.documentElement.lang = lng === 'zh' ? 'zh-CN' : 'en';
});

document.documentElement.lang = defaultLocale === 'zh' ? 'zh-CN' : 'en';

export default i18n;
