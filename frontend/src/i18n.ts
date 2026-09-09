import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// استيراد ملفات الترجمة
import translationAR from "./locales/ar/translation.json";
import translationEN from "./locales/en/translation.json";

const resources = {
  ar: {
    translation: translationAR,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  .use(LanguageDetector) // كشف لغة المتصفح
  .use(initReactI18next) // ربط React بـ i18next
  .init({
    resources,
    fallbackLng: "ar", // اللغة الافتراضية هي العربية
    interpolation: {
      escapeValue: false, // React يحمي من XSS بالفعل
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
