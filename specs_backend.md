# Cahier des Charges Technique - Backend (Logique Interne & Base de Données)

> **Note Architecture "Mono-Poste"** : Comme l'application tourne sur un seul PC, il n'y a PAS de serveur externe. Le "Backend" ici désigne toute la logique métier et la base de données intégrée dans l'application (`.exe`).

## 1. Stack Technologique (Interne)
*   **Langage Core** : **Rust** (Via Tauri). C'est le moteur invisible qui gère la sécurité et les données.
*   **Base de Données** : **SQLite** (Fichier local `.db`).
    *   *Pourquoi ?* : C'est une base de données sans serveur. Tout est stocké dans un fichier sur le disque dur de l'association. C'est zéro configuration pour vous.
*   **ORM / Accès Données** : **SQLx** ou **Diesel** (Rust) pour parler à la base de données.

## 2. Architecture des Données (Local First)

### Emplacement des Données
*   Le fichier de base de données (`aicha_asso.db`) sera stocké dans le dossier `AppData` de Windows de manière sécurisée.
*   Les photos (élèves, factures) seront stockées dans un dossier sécurisé géré par l'application.

### Gestion de la Session (Multi-Utilisateurs Local)
Même sur un seul PC, on garde la sécurité :
*   L'application demande un Login/Mot de passe au lancement.
*   Si "Secrétaire" se connecte -> Accès limité.
*   Si "Admin" se connecte -> Accès complet.
*   Pas de JWT complexe, mais une session locale sécurisée en mémoire.

### Structure des Modules (NestJS)
*   `AuthModule` (Guards, JWT Strategy, Roles).
*   `UsersModule` (CRUD Employés).
*   `StudentsModule` (CRUD Élèves, Inscriptions).
*   `FinanceModule` (Reçus, Dépenses, Stats).
*   `UploadModule` (Gestion des photos/preuves - Stockage Local ou S3).

## 3. Fonctionnalités Clés & Exigences Techniques

### A. Sécurité des Données
*   **Authentification** : JWT (JSON Web Tokens).
*   **RBAC (Role-Based Access Control)** : Décorateurs `@Roles('ADMIN')` pour protéger les routes sensibles (Validation paiements, Suppression).
*   **Hashage** : Mots de passe hashés avec **Argon2** ou **Bcrypt**.
*   **Sanitization** : Protection contre les injections SQL (géré par l'ORM) et XSS.

### B. Gestion des Fichiers (Photos & Factures)
*   **Stockage 100% Local** : Les images sont stockées dans un dossier `C:\ProgramData\AssociationAicha\Uploads`.
*   Pas de Cloud, pas d'internet requis.

### C. Backups & Logs
*   **Logs d'audit** : Table SQLite locale.
*   **Backup** : Bouton "Sauvegarder" qui crée une copie du fichier `.db` sur une clé USB ou un autre dossier.

## 4. Livrables Attendus
1.  Code source complet.
2.  Installateur `.exe`.
3.  Documentation utilisateur.
