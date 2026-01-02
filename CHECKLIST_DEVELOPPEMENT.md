# 🚀 CHECKLIST DÉVELOPPEMENT - Association Aicha
> Application Desktop Mono-Poste | Tauri + React + SQLite

---

## 📋 SPRINT 0 : Fondations & Architecture (Semaine 1)
*Objectif : Base solide, scalable et maintenable*

### Environnement de développement
- [x] Installer Rust (rustup) sur le poste de dev
- [x] Installer Node.js (v20 LTS)
- [x] Installer pnpm (gestionnaire de paquets)
- [x] Créer le projet Tauri + React + Vite
  - [x] `pnpm create tauri-app association-aicha --template react-ts`
  - [x] Vérifier que `pnpm tauri dev` ouvre une fenêtre vide
- [x] Configurer VS Code (extensions Rust Analyzer, ESLint, Prettier)
- [ ] Configurer Git + .gitignore (ignorer .db, uploads, builds)

### 🏗️ Architecture Backend (Rust) - Clean Architecture
- [x] Définir la structure en couches :
  ```
  /src-tauri/src
    /commands     # Couche Présentation (Points d'entrée Tauri)
    /services     # Couche Application (Logique métier)
    /repositories # Couche Infrastructure (Accès données)
    /models       # Couche Domaine (Entités & DTOs)
    /errors       # Gestion centralisée des erreurs
    /config       # Configuration (paths, constantes)
  ```
- [ ] Implémenter le pattern **Repository**
  - [ ] Trait `Repository<T>` générique (CRUD de base)
  - [ ] `EleveRepository`, `RecuRepository`, etc.
  - [ ] Abstraction pour pouvoir changer de BDD plus tard
- [ ] Implémenter le pattern **Service**
  - [ ] `PaymentService` (logique de paiement centralisée)
  - [ ] `AuthService` (authentification)
  - [ ] Les services appellent les repositories, jamais de SQL direct
- [ ] Gestion des erreurs centralisée
  - [ ] Enum `AppError` (NotFound, Unauthorized, ValidationError, DbError)
  - [ ] Conversion automatique vers erreurs Tauri lisibles
- [ ] Configuration centralisée
  - [ ] Constantes (chemins, versions, limites)
  - [ ] Lecture depuis fichier `.env` local (optionnel)

### 🏗️ Architecture Frontend (React) - Feature-Based
- [x] Définir la structure modulaire :
  ```
  /src
    /app           # Configuration globale (Router, Providers)
    /components    # UI Kit (Atoms: Button, Input, Card...)
    /features      # Modules autonomes par domaine
      /auth        # Login, AuthContext, useAuth
      /eleves      # Liste, Fiche, CRUD
      /paiements   # Modale, Grille 12 mois
      /finances    # Dashboard, Stats
    /hooks         # Hooks globaux (useDebounce, useLocalStorage)
    /lib           # Utilitaires (formatDate, formatCurrency)
    /stores        # État global (Zustand ou Context)
  ```
- [x] Chaque `/features/X` contient :
  - [x] `components/` (UI spécifique au module)
  - [ ] `hooks/` (useEleves, usePaiement)
  - [ ] `services/` (appels Tauri invoke)
  - [ ] `types.ts` (Interfaces TypeScript)
- [x] Typage strict TypeScript
  - [x] `strict: true` dans tsconfig.json
  - [ ] Types partagés Backend <-> Frontend (via génération ou manuel)
- [ ] Gestion d'état centralisée
  - [ ] Zustand pour l'état global (user connecté, thème)
  - [ ] TanStack Query pour le cache des données serveur

### Base de données SQLite
- [ ] Ajouter les dépendances Rust : `rusqlite`, `serde`, `thiserror`
- [x] Créer le fichier de migration SQL initial (`migrations/001_init.sql`)
  - [x] Table `users` (id UUID, nom, prenom, email, password_hash, role ENUM, created_at, deleted_at)
  - [x] Table `eleves` (id UUID, code_matricule UNIQUE, + champs personnels + timestamps)
  - [x] Table `enseignants`
  - [x] Table `niveaux`
  - [x] Table `classes` (FK niveau, FK enseignant)
  - [x] Table `inscriptions` (FK eleve, FK classe, année, UNIQUE(eleve,classe,annee))
  - [x] Table `recus` (numero UNIQUE, type, montant, status ENUM, FK user créateur)
  - [x] Table `lignes_paiement` (FK recu, mois, annee, UNIQUE(eleve,mois,annee))
  - [x] Table `depenses`
  - [x] Table `donneurs`
  - [x] Table `messages`
  - [x] Table `audit_logs` (action, entite, ancien_valeur JSON, nouveau_valeur JSON, timestamp)
- [x] Index sur les colonnes fréquemment recherchées (nom, code_matricule)
- [ ] Script de création automatique de la BDD au premier lancement
- [x] Seed de données de test (utilisateur admin, quelques niveaux)

### UI de base (Design System)
- [x] Installer TailwindCSS + plugins (forms, typography)
- [ ] Configurer le thème (couleurs de l'association, fonts)
- [x] Installer Shadcn/UI (composants accessibles)
  - [x] Button, Input, Card, Dialog, Toast, DataTable
- [ ] Créer le Layout principal
  - [ ] `<AppShell>` : Sidebar collapsible + Header + Content
  - [ ] Responsive (même si Desktop, prévoir les breakpoints)
- [ ] Créer la page Login (maquette statique)
- [ ] Créer un composant `<ErrorBoundary>` global

## 📋 SPRINT 1 : Authentification & Utilisateurs (Semaine 2)
*Objectif : Pouvoir se connecter en tant qu'Admin ou Secrétaire*

### Backend (Rust)
- [x] Commande `login(email, password)` 
  - [x] Vérification du hash (Argon2 ou Bcrypt)
  - [x] Retourner les infos utilisateur + rôle
- [x] Commande `get_current_user()`
- [x] Commande `logout()`
- [x] Seed initial : créer un Admin par défaut (admin@aicha.local / admin123)

### Frontend (React)
- [x] Page Login fonctionnelle
  - [x] Formulaire email + mot de passe
  - [x] Gestion des erreurs (Toast)
  - [x] Redirection vers Dashboard après login
- [x] Contexte Auth (stocker l'utilisateur connecté)
- [x] Guard de routes (rediriger vers Login si non connecté)
- [x] Affichage du nom utilisateur dans le Header
- [x] Bouton Déconnexion

### Gestion des utilisateurs (Admin only)
- [ ] Page "Gestion des Utilisateurs"
- [x] Liste des utilisateurs existants (API prête)
- [x] Formulaire d'ajout d'un nouvel utilisateur (API prête)
  - [x] Nom, Prénom, Email, Mot de passe, Rôle (Select)
- [x] Modification d'un utilisateur (API prête)
- [x] Suppression (soft delete) avec confirmation (API prête)

---

## 📋 SPRINT 2 : Gestion des Élèves (Semaine 3)
*Objectif : CRUD complet des élèves*

### Backend (Rust)
- [x] Commande `get_all_eleves()`
- [x] Commande `get_eleve_by_id(id)`
- [x] Commande `create_eleve(data)`
- [x] Commande `update_eleve(id, data)`
- [x] Commande `delete_eleve(id)` (soft delete)
- [x] Commande `search_eleves(query)` (intégré dans get_all)

### Frontend (React)
- [x] Page "Liste des Élèves"
  - [x] Tableau avec colonnes : Photo, Nom, Prénom, Classe, Statut Paiement
  - [x] Barre de recherche instantanée
  - [x] Bouton "Ajouter un Élève"
- [x] Modale / Page "Fiche Élève"
  - [x] Onglet Infos : Formulaire complet
    - [x] Photo (upload local)
    - [x] Nom, Prénom
    - [x] Date de naissance, Sexe
    - [x] Tuteur : Nom, Téléphone, CIN
    - [x] Adresse
  - [ ] Onglet Finances : (lecture seule pour l'instant)
  - [ ] Onglet Scolarité : Classe actuelle
- [x] Confirmation avant suppression

### Upload de photos
- [x] Créer le dossier sécurisé pour les uploads
- [x] Commande Rust `upload_photo(file_bytes, eleve_id)`
- [x] Affichage de la photo dans la fiche et la liste

---

## 📋 SPRINT 3 : Gestion Pédagogique (Semaine 4)
*Objectif : Gérer les Niveaux, Classes, Enseignants et Inscriptions*

### Backend (Rust)
- [ ] CRUD `niveaux` (Année 1, Massar, Chatibia...)
- [ ] CRUD `enseignants`
- [ ] CRUD `classes`
  - [ ] Associer un niveau
  - [ ] Associer un enseignant principal (optionnel)
- [ ] CRUD `inscriptions`
  - [ ] Associer un élève à une classe pour une année scolaire

### Frontend (React)
- [ ] Page "Paramètres > Niveaux"
  - [ ] Liste + Ajout/Modif/Suppression
- [ ] Page "Enseignants"
  - [ ] Tableau + CRUD complet
- [ ] Page "Classes"
  - [ ] Vue en grille (Cards) ou Tableau
  - [ ] Afficher le nombre d'élèves par classe
  - [ ] Lien vers le détail de la classe
- [ ] Page "Détail Classe"
  - [ ] Liste des élèves inscrits
  - [ ] Bouton "Inscrire un élève" (Modale avec recherche)
  - [ ] Bouton "Retirer de la classe"

---

## 📋 SPRINT 4 : Paiements (Cœur du Système) (Semaines 5-6)
*Objectif : Encaisser un paiement et imprimer un reçu*

### Backend (Rust)
- [ ] Commande `get_paiement_status(eleve_id, annee)`
  - [ ] Retourne les 12 mois avec statut (payé/non payé)
- [ ] Commande `create_recu(data)`
  - [ ] Insérer dans `recus`
  - [ ] Insérer les lignes dans `lignes_paiement`
  - [ ] Vérifier qu'un mois n'est pas payé deux fois (contrainte)
- [ ] Commande `get_recus_by_eleve(eleve_id)`
- [ ] Commande `annuler_recu(recu_id)` (Admin only, soft delete)

### Frontend (React)
- [ ] Modale "Nouveau Paiement"
  - [ ] Recherche d'élève (autocomplete)
  - [ ] Affichage photo + classe de l'élève sélectionné
  - [ ] Grille des 12 mois (cases à cocher)
    - [ ] Mois déjà payés = Grisés + Check
    - [ ] Mois sélectionnés = Surlignés
  - [ ] Calcul automatique du total
  - [ ] Sélection type de paiement
  - [ ] Bouton "Confirmer & Imprimer"
- [ ] Toast de succès
- [ ] Génération du reçu PDF
  - [ ] Numéro de reçu, Date
  - [ ] Infos Élève
  - [ ] Détail des mois payés
  - [ ] Montant Total
- [ ] Envoi à l'imprimante système

### Impression
- [ ] Intégration impression via Tauri (API système)
- [ ] Format Ticket 80mm (Imprimante thermique)
- [ ] Format A4 (Imprimante normale)
- [ ] Option "Aperçu avant impression"

---

## 📋 SPRINT 5 : Ordres de Paiement & Dépenses (Semaine 7)
*Objectif : Gérer les sorties d'argent*

### Backend (Rust)
- [ ] CRUD `depenses` (Ordres de paiement)
  - [ ] Champs : Bénéficiaire, Motif, Montant, Pièce jointe
- [ ] Workflow de validation
  - [ ] Création par Secrétaire -> Statut "En Attente"
  - [ ] Validation par Admin -> Statut "Payé"

### Frontend (React)
- [ ] Page "Dépenses"
  - [ ] Liste des ordres de paiement
  - [ ] Filtres : Statut, Date
- [ ] Formulaire "Nouvel Ordre de Paiement"
  - [ ] Type : Facture / Autre
  - [ ] Si Facture : Upload de la preuve (photo)
  - [ ] Si Autre : Liste d'articles (nom + prix)
  - [ ] Montant total
- [ ] Vue Admin : Liste "En attente de validation"
  - [ ] Boutons Valider / Rejeter
- [ ] Affichage de la photo de la facture (Modale zoom)

---

## 📋 SPRINT 6 : Dons & Donneurs (Semaine 8)
*Objectif : Enregistrer les dons (élèves, externes, anonymes)*

### Backend (Rust)
- [ ] CRUD `donneurs` (Personnes externes)
- [ ] Logique Don dans `recus`
  - [ ] Type = "Don"
  - [ ] Source = Élève / Donneur / Anonyme

### Frontend (React)
- [ ] Page "Donneurs"
  - [ ] Liste + CRUD
- [ ] Modale "Enregistrer un Don"
  - [ ] Sélectionner source : Élève existant / Donneur existant / Nouveau donneur / Anonyme
  - [ ] Montant
  - [ ] Commentaire
- [ ] Historique des dons sur la fiche donneur

---

## 📋 SPRINT 7 : Messagerie Interne (Semaine 9)
*Objectif : Communication Admin <-> Secrétaire*

### Backend (Rust)
- [ ] CRUD `messages`
  - [ ] Expéditeur, Destinataire, Contenu, Vu, Date
- [ ] Commande `get_unread_count(user_id)`

### Frontend (React)
- [ ] Icône Notifications dans le Header (Badge count)
- [ ] Page "Messages"
  - [ ] Liste des messages reçus
  - [ ] Marquage "Lu" au clic
- [ ] Modale "Nouveau Message"
  - [ ] Destinataire (Select utilisateur)
  - [ ] Contenu

---

## 📋 SPRINT 8 : Dashboard & Statistiques (Semaine 10)
*Objectif : Vue d'ensemble pour l'Admin*

### Backend (Rust)
- [ ] Commande `get_dashboard_stats()`
  - [ ] Recettes du jour / Semaine / Mois
  - [ ] Nombre d'élèves inscrits
  - [ ] Élèves en retard de paiement (liste)

### Frontend (React)
- [ ] Page Dashboard (Home)
  - [ ] Cards KPIs : Recettes, Élèves, Alertes
  - [ ] Graphique simple (Recettes sur 7 jours)
  - [ ] Liste "Retards de paiement" (Top 10)
  - [ ] Fil d'activité récente

---

## 📋 SPRINT 8.5 : Rapports & Génération de Documents (Semaine 10-11)
*Objectif : Générer des rapports PDF/Excel avec sélection de plage de dates*

### Backend (Rust)
- [ ] Commande `generate_report(type, date_debut, date_fin, format)`
  - [ ] Types de rapports :
    - [ ] `RECETTES` : Tous les paiements reçus sur la période
    - [ ] `DEPENSES` : Toutes les dépenses validées
    - [ ] `BILAN` : Recettes - Dépenses (Solde)
    - [ ] `RETARDS` : Liste des élèves avec mois impayés
    - [ ] `INSCRIPTIONS` : Élèves inscrits par classe/niveau
  - [ ] Formats supportés :
    - [ ] PDF (pour impression/archives)
    - [ ] Excel (.xlsx) (pour comptabilité externe)
- [ ] Commande `get_report_preview(type, date_debut, date_fin)`
  - [ ] Retourne les données brutes (JSON) pour prévisualisation avant export
- [ ] Logique de calcul
  - [ ] Totaux par mois, par niveau, par type de paiement
  - [ ] Comparaison avec période précédente (optionnel)

### Frontend (React)
- [ ] Page "Rapports"
  - [ ] Sélecteur de type de rapport (Dropdown)
  - [ ] **Sélection de plage de dates** (Date Picker Range)
    - [ ] Présets : "Ce mois", "Mois dernier", "Cette année scolaire", "Personnalisé"
    - [ ] Date début + Date fin (calendrier)
  - [ ] Bouton "Prévisualiser"
  - [ ] Aperçu des données (Tableau récapitulatif)
  - [ ] Boutons "Télécharger PDF" / "Télécharger Excel"
- [ ] Composant `<DateRangePicker>`
  - [ ] Intégration Shadcn Calendar
  - [ ] Validation (date fin >= date début)
  - [ ] Format d'affichage localisé (JJ/MM/AAAA)
- [ ] Génération PDF côté client
  - [ ] En-tête avec logo Association Aicha
  - [ ] Tableau des données
  - [ ] Pied de page (date génération, page X/Y)
- [ ] Historique des rapports générés (optionnel)
  - [ ] Liste des derniers rapports avec lien de re-téléchargement

### Rapports Spécifiques
- [ ] **Rapport Mensuel de Trésorerie**
  - [ ] Résumé : Total Recettes, Total Dépenses, Solde
  - [ ] Détail par catégorie
  - [ ] Graphique camembert (Répartition)
- [ ] **Rapport Élèves en Retard**
  - [ ] Tableau : Nom, Classe, Mois impayés, Total dû
  - [ ] Option "Envoyer rappel" (futur)
- [ ] **Attestation de Paiement (individuelle)**
  - [ ] Pour un élève précis sur une période
  - [ ] Document officiel avec signature numérique (optionnel)

## 📋 SPRINT 9 : Exports & Backup (Semaine 11)
*Objectif : Sauvegarder et exporter les données*

### Backend (Rust)
- [ ] Commande `export_to_excel(type)` (Élèves, Recus, Depenses)
- [ ] Commande `backup_database(destination_path)`
  - [ ] Copie du fichier `.db`
  - [ ] Copie du dossier `uploads`
- [ ] Commande `restore_database(source_path)` (Admin only)

### Frontend (React)
- [ ] Page "Paramètres > Sauvegarde"
  - [ ] Bouton "Sauvegarder maintenant" (Sélection dossier/clé USB)
  - [ ] Bouton "Restaurer une sauvegarde" (Admin only)
- [ ] Boutons "Exporter Excel" sur chaque liste (Élèves, Finances)

---

## 📋 SPRINT 10 : Logs & Sécurité (Semaine 12)
*Objectif : Traçabilité complète des actions*

### Backend (Rust)
- [ ] Table `logs` (user_id, action, details, timestamp)
- [ ] Logger automatique sur chaque action sensible
  - [ ] Création/Modif/Suppression Paiement
  - [ ] Validation Dépense
  - [ ] Modification Utilisateur

### Frontend (React)
- [ ] Page "Paramètres > Historique des Actions" (Admin only)
  - [ ] Tableau avec filtres (Utilisateur, Date, Type d'action)

---

## 📋 SPRINT 11 : Polissage & Tests (Semaines 13-14)
*Objectif : Application prête pour la production*

### UX / UI
- [ ] Revoir toutes les pages pour cohérence visuelle
- [ ] Ajouter les animations (Framer Motion)
- [ ] Gérer les états vides (Aucun élève, Aucun paiement...)
- [ ] Raccourcis clavier (Ctrl+N = Nouveau Paiement)
- [ ] Mode sombre (optionnel)

### Tests
- [ ] Tests unitaires Backend (Rust)
- [ ] Tests d'intégration (Scénarios complets)
- [ ] Tests manuels avec données réelles

### Build & Déploiement
- [ ] Générer l'installateur Windows `.msi`
- [ ] Tester l'installation sur un PC vierge
- [ ] Créer un guide d'installation utilisateur (PDF/Markdown)
- [ ] Préparer les données initiales (Niveaux, Admin par défaut)

---

## 📋 POST-PRODUCTION : Maintenance & Évolutions

### À prévoir
- [ ] Mises à jour de l'application (système de versioning)
- [ ] Évolutions demandées par l'association
- [ ] Extension multi-postes (si besoin futur)
