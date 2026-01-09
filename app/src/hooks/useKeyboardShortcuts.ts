import { useEffect, useCallback } from "react";

type KeyboardShortcut = {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return;
        }

        for (const shortcut of shortcuts) {
            const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
            const altMatches = shortcut.altKey ? event.altKey : !event.altKey;
            const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

            if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
                event.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}

// Pre-defined shortcuts for the application
export const APP_SHORTCUTS = {
    NEW_PAYMENT: { key: "p", ctrlKey: true, description: "Nouveau paiement" },
    NEW_STUDENT: { key: "e", ctrlKey: true, description: "Nouvel élève" },
    NEW_EXPENSE: { key: "d", ctrlKey: true, description: "Nouvelle dépense" },
    SEARCH: { key: "k", ctrlKey: true, description: "Recherche globale" },
    DASHBOARD: { key: "h", ctrlKey: true, description: "Retour au tableau de bord" },
} as const;
