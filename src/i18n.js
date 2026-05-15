import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation modules (use JS modules to avoid JSON parsing issues in build)
import translationFR from './locales/fr/translation';
import translationEN from './locales/en/translation';

const resources = {
  fr: {
    translation: translationFR
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('einvoicepro_language') || 'en', // default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    // Allow keys to be phrases
    keySeparator: '.',
    
    // Save language preference
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('einvoicepro_language', lng);
});

export default i18n;