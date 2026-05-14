import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import fr from "./fr.json";
import en from "./en.json";

const savedLang = (typeof window !== "undefined" && localStorage.getItem("lang")) || undefined;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: savedLang || "fr",
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

export default i18n;
