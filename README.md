# 🏫 Système de Gestion - Association Aicha

![Status](https://img.shields.io/badge/Status-In%20Development-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FEC00F?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-1.75+-000000?logo=rust)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)

> **Une application Desktop moderne, rapide et sécurisée pour la gestion complète d'une association scolaire.**  
> *Développée avec l'architecture Tauri (Rust + React) pour une performance native et une empreinte mémoire minimale.*

---

## 📸 Aperçu

<!-- Ajoutez ici une capture d'écran du Dashboard -->
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Dashboard+Preview" alt="Dashboard Preview" width="100%" />
</div>

## 🚀 À Propos

Ce projet a été conçu pour digitaliser et simplifier la gestion quotidienne de l'**Association Aicha**. Il remplace les registres papiers et les fichiers Excel dispersés par une solution centralisée, **offline-first**, capable de gérer à la fois la scolarité et les finances.

L'objectif technique était de créer une application **robuste** (backend Rust), **distribuable** (fichier .exe autonome) et **ergonomique** (UI moderne Shadcn).

## ✨ Fonctionnalités Clés

### 🎓 Gestion Scolaire
- **Fichiers Élèves Complets** : Données personnelles, tuteurs, photos (stockage local sécurisé).
- **Organisation Pédagogique** : Gestion des niveaux, des classes et des affectations.
- **Enseignants** : Base de données du corps professoral.

### 💰 Gestion Financière (Paiements)
- **Suivi des Mensualités** : Grille visuelle des paiements sur 12 mois (Sept-Août).
- **Reçus Automatiques** : Génération de numéros de reçus uniques et traçabilité.
- **Types de Paiement** : Inscriptions, Mensualités, Assurances, Dons.
- **Calculs Automatisés** : Détection des mois impayés et calcul des totaux.

### 💸 Gestion des Dépenses & Compatibilité
- **Ordres de Paiement** : Saisie des dépenses avec **upload de pièces justificatives** (factures).
- **Workflow de Validation** : 
  - *Secrétaire* : Crée une demande "En attente".
  - *Administrateur* : Valide ou Rejette la dépense.
- **Tableau de Bord** : Suivi en temps réel de la trésorerie.

### 🤝 Gestion des Dons
- **Base Donateurs** : CRM léger pour suivre les donateurs externes.
- **Dons Anonymes** : Enregistrement rapide des dons comptants.
- **Historique** : Suivi des contributions par donateur.

## 🛠️ Stack Technique

Ce projet met en œuvre une architecture moderne et performante :

### 🖥️ Frontend (Interface)
- **Framework** : [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Langage** : TypeScript (Typage strict)
- **UI Kit** : [Shadcn/UI](https://ui.shadcn.com/) + [TailwindCSS](https://tailwindcss.com/)
- **Icônes** : Lucide React
- **Gestionnaire de Paquets** : pnpm

### 🦀 Backend (Core)
- **Runtime** : [Tauri v2](https://tauri.app/) (Rust)
- **Base de Données** : SQLite (embarquée, avec `rusqlite`)
- **Architecture** : Clean Architecture
  - **Services** : Logique métier isolée.
  - **Commands** : Interface sérialisée entre JS et Rust.
  - **Migrations** : Gestion du schéma SQL au démarrage.
- **Sécurité** : Hashage de mots de passe (Argon2), Validation des entrées.

## 🏗️ Architecture du Projet

```bash
📦 association-aicha
├── 📂 src-tauri           # Backend Rust
│   ├── 📂 src
│   │   ├── 📂 services    # Logique Business (User, Paiement, Eleve...)
│   │   ├── 📂 database    # Connexion SQLite & Migrations
│   │   └── lib.rs         # Points d'entrée (Commandes Tauri)
│   └── tauri.conf.json    # Config Build & Permissions
│
├── 📂 src                 # Frontend React
│   ├── 📂 features        # Modules (Dons, Finances, Eleves...)
│   ├── 📂 components      # UI Réutilisable (Boutons, Modales...)
│   └── 📂 lib             # Utilitaires (API, Formatters)
```

## 📦 Installation & Développement

### Installation

L'installateur Windows se trouve dans le dossier :
`app/src-tauri/target/release/bundle/msi/Association Aicha_0.1.0_x64_en-US.msi`

Double-cliquez simplement sur ce fichier pour installer l'application.

### Développement

#### Pré-requis
- **Node.js** (v18+)
- **Rust** (Dernière version stable)
- **pnpm** (recommandé)

#### Lancer le projet localement

1. **Cloner le repo**
   ```bash
   git clone https://github.com/votre-username/association-aicha.git
   cd association-aicha/app
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Lancer en mode développement**
   ```bash
   pnpm tauri dev
   ```
   *La base de données SQLite sera automatiquement créée dans `src-tauri/aicha_asso.db` au premier lancement.*

### Construire l'exécutable (Release)

```bash
pnpm tauri build
```
L'installeur Windows (`.exe` / `.msi`) sera généré dans `src-tauri/target/release/bundle/nsis/`.

---

## 👤 Auteur

**[Jouini Hamdi]**  
*Développeur Fullstack Passionné*  

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/hamdi-jouini-7aa47828b/)

---

*Ce projet est sous licence MIT.*
