import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ja from "./ja";

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: (typeof localStorage !== "undefined" ? localStorage.getItem("konekto_lang") : null) ?? "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18next;

export type Language = "en" | "ja";

export function setLanguage(lang: Language) {
  i18next.changeLanguage(lang);
  localStorage.setItem("konekto_lang", lang);
}

export function getLanguage(): Language {
  return (i18next.language as Language) ?? "en";
}
