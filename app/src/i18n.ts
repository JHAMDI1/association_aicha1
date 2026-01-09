import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

// Get saved language or default to French
const savedLanguage = localStorage.getItem("language") || "fr";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: fr },
            ar: { translation: ar }
        },
        lng: savedLanguage,
        fallbackLng: "fr",
        interpolation: {
            escapeValue: false // React already escapes
        }
    });

export default i18n;

// Helper to get current direction
export const getDirection = (lang: string): "ltr" | "rtl" => {
    return lang === "ar" ? "rtl" : "ltr";
};

// Available languages
export const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷", dir: "ltr" },
    { code: "ar", name: "العربية", flag: "🇲🇦", dir: "rtl" }
] as const;
