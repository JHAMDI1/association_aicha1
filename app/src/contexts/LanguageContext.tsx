import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getDirection, languages } from "../i18n";

interface LanguageContextType {
    language: string;
    direction: "ltr" | "rtl";
    setLanguage: (lang: string) => void;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const { i18n } = useTranslation();
    const [language, setLanguageState] = useState(i18n.language || "fr");
    const [direction, setDirection] = useState<"ltr" | "rtl">(getDirection(language));

    const setLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        setLanguageState(lang);
        const dir = getDirection(lang);
        setDirection(dir);
        localStorage.setItem("language", lang);

        // Apply direction to document
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
    };

    // Initialize direction on mount
    useEffect(() => {
        const savedLang = localStorage.getItem("language") || "fr";
        setLanguage(savedLang);
    }, []);

    const isRTL = direction === "rtl";

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

export { languages };
