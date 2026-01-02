# Analyse et Conception de la Base de Données - Association Aicha

## 1. Introduction
Ce document détaille la structure de la base de données relationnelle pour l'application de gestion de l'association Aicha. L'objectif est de garantir l'intégrité des données financières et pédagogiques.

## 2. Schéma Relationnel (SQL Structure Conceptuelle)

### A. Gestion des Personnes (Ressources Humaines & Tiers)

#### 1. `users` (Personnel de l'association)
Table unique pour gérer l'authentification et les droits.
- `id` (PK, UUID)
- `nom`, `prenom`
- `email` (Unique - Login)
- `mot_de_passe_hash`
- `role` (ENUM: 'ADMIN', 'SECRETAIRE', 'EMPLOYE')
- `fonction_id` (Pour les non-connectés ex: jardiniers, femme de ménage)
- `statut` (Actif/Inactif)

#### 2. `eleves` (Les étudiants)
- `id` (PK, UUID)
- `code_eleve` (Matricule unique visible ex: 2024-001)
- `nom`, `prenom`
- `date_naissance`, `sexe`
- `photo_url`
- `tuteur_nom`, `tuteur_tel`, `tuteur_cin`
- `adresse`
- `created_at`, `updated_at`, `deleted_at` (Soft Delete)

#### 3. `enseignants`
- `id` (PK, UUID)
- `nom`, `prenom`, `tel`, `email`
- `specialite`
- `statut` (Actif/Inactif)

### B. Structure Pédagogique

#### 4. `annees_scolaires`
- `id` (PK)
- `libelle` (ex: "2023-2024")
- `date_debut`, `date_fin`
- `est_courante` (Boolean)

#### 5. `niveaux` (Libellés)
- `id` (PK)
- `nom` (ex: "Année 1", "Massar 2")
- `ordre` (Pour le tri)

#### 6. `classes`
- `id` (PK)
- `nom` (ex: "Classe A")
- `niveau_id` (FK)
- `annee_scolaire_id` (FK)
- `enseignant_principal_id` (FK, Nullable)

#### 7. `inscriptions` (Lien Élève-Classe)
- `id` (PK)
- `eleve_id` (FK)
- `classe_id` (FK)
- `date_inscription`

### C. Gestion Financière (Cœur du Système)

#### 8. `recus` (Entrées d'argent)
- `id` (PK, UUID)
- `numero_recu` (Séquentiel unique ex: REC-000123)
- `date_operation`
- `user_id` (Celui qui a encaissé - Audit)
- `eleve_id` (FK, Nullable si c'est un Don externe)
- `donneur_externe` (String, si pas d'élève)
- `montant_total`
- `mode_paiement` (Espèces, Chèque, Virement)
- `etat` (ENUM: 'EN_ATTENTE', 'VALIDE', 'REJETE', 'ANNULE')
- `commentaire`

#### 9. `lignes_paiement` (Détail des mois)
- `id` (PK)
- `recu_id` (FK)
- `type` (ENUM: 'MENSUALITE', 'INSCRIPTION', 'ASSURANCE', 'DON', 'AUTRE')
- `mois_concerne` (Int 1-12, Nullable si pas mensualité)
- `annee_concerne` (Int, Nullable)
- `montant`

#### 10. `depenses` (Sorties d'argent / Ordres de paiement)
- `id` (PK)
- `numero_ordre`
- `beneficiaire`
- `motif`
- `montant`
- `piece_jointe_url` (Facture scannée)
- `cree_par` (FK User)
- `valide_par` (FK User, Nullable)
- `etat` (ENUM: 'BROUILLON', 'EN_ATTENTE_VALIDATION', 'PAYE')

### D. Communication

#### 11. `notifications`
- `id` (PK)
- `type` (Message, Alerte Paiement, Validation Requise)
- `contenu`
- `destinataire_role` (ex: 'ADMIN')
- `vu` (Boolean)

## 3. Règles Métier Importantes

1.  **Immutabilité des Reçus** : Une fois un reçu 'VALIDE', il ne peut pas être modifié. En cas d'erreur, il faut créer un reçu d'annulation (avoir) ou passer par une validation Admin stricte pour l'annuler.
2.  **Unicité des Paiements** : Le système doit empêcher de payer deux fois le mois "Janvier 2024" pour le même élève (Contrainte Unique composite sur `lignes_paiement`).
3.  **Traçabilité** : Chaque mouvement d'argent doit être lié à un utilisateur connecté (`user_id`).
