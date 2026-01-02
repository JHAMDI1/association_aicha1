# Cahier des Charges Technique - Application Desktop (Tauri Standalone)

## 1. Stack Technologique
*   **Framework** : **Tauri v2** (Rust + Webview).
*   **UI** : **React** + **Vite** + **TypeScript**.
*   **Communication** : **Tauri Commands** (Invoke). Le Frontend appelle directement les fonctions Rust (ex: `invoke('create_student', { ... })`) au lieu de passer par une API HTTP lente.

## 2. Architecture Hybride (Mono-Poste)

### Structure du Code
L'application est un exécutable unique (`.exe`) qui contient tout.

```
/src-tauri       # BACKEND (Rust)
  /src
    database.rs  # Gestion SQLite
    commands.rs  # Fonctions appelées par le front (guichetiers)
    main.rs      # Démarrage
/src             # FRONTEND (React)
  /features/pay  # Ecran Paiement
  /hooks         # useQuery (TanStack Query) pour charger les données
```

## 3. Fonctionnalités Clés & Exigences Techniques

### A. Impression Thermique & Gestion PDF
*   L'app doit pouvoir communiquer avec l'imprimante système par défaut.
*   Génération de reçus PDF à la volée (`@react-pdf/renderer` ou `jspdf`).
*   **Format Ticket** (58mm/80mm) et **Format A4** (Ordres de paiement).

### B. Mode Offline (Optionnel mais recommandé)
*   Si Internet coupe, l'application doit continuer à fonctionner pour les actions critiques (saisie de paiement).
*   Synchronisation automatique dès le retour de la connexion (`TanStack Query` gère cela très bien).

### C. Performance & UI
*   **Virtualisation** : Pour les listes d'élèves (> 1000), utiliser la virtualisation pour scroller sans ralentissement.
*   **Filtres temps réel** : La recherche d'un élève doit être instantanée (< 100ms).

### D. Sécurité Front
*   Gestion des Tokens JWT (Stockage sécurisé).
*   Déconnexion automatique après X minutes d'inactivité (Configurable).

## 4. Livrables Attendus
1.  Code source complet sur Git.
2.  Build exécutable (`.exe` pour Windows).
3.  Guide d'installation.
