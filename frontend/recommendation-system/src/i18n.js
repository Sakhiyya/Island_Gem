import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import zh from "./locales/zh.json";
import hi from "./locales/hi.json";

i18n
  .use(LanguageDetector) // detects browser language
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      de: { translation: de },
      zh: { translation: zh },
      hi: { translation: hi },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;