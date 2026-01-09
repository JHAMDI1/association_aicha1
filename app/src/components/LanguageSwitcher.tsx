import { useLanguage, languages } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        const newLang = language === "fr" ? "ar" : "fr";
        setLanguage(newLang);
    };

    const otherLang = languages.find(l => l.code !== language);

    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={toggleLanguage}
        >
            <Globe className="w-4 h-4" />
            <span>{otherLang?.flag}</span>
            <span className="hidden sm:inline">{otherLang?.name}</span>
        </Button>
    );
}
