# Manuel Utilisateur - Association Aicha

## 📚 Table des Matières

1. [Introduction](#introduction)
2. [Connexion](#connexion)
3. [Tableau de Bord](#tableau-de-bord)
4. [Gestion des Élèves](#gestion-des-élèves)
5. [Paiements](#paiements)
6. [Dépenses](#dépenses)
7. [Donneurs & Dons](#donneurs--dons)
8. [Messages](#messages)
9. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
10. [Scolarité](#scolarité)

---

## Introduction

Cette application permet de gérer l'Association Aicha, incluant :
- Inscription et suivi des élèves
- Gestion des paiements mensuels
- Suivi des dépenses et validations
- Gestion des dons et donneurs
- Communication interne (messagerie)
- Dashboard avec statistiques

**Rôles** :
- **Administrateur** : Accès complet
- **Secrétaire** : Accès selon permissions définies par l'Admin

---

## Connexion

### Première connexion (Admin)
1. Lancez l'application
2. **Email** : défini dans `config.toml`
3. **Mot de passe** : défini dans `config.toml`
4. Cliquez sur "Se connecter"

### Connexion Secrétaire
Utilisez les identifiants créés par l'Administrateur.

---

## Tableau de Bord

### 📊 Cartes KPI (5 indicateurs)
- **💰 Recettes** : Total des paiements reçus
- **💸 Dépenses** : Total des dépenses validées
- **💵 Solde** : Différence Recettes - Dépenses (vert si positif, rouge si négatif)
- **🎓 Élèves** : Nombre d'élèves actifs
- **⚠️ Retards** : Nombre d'élèves avec paiements en retard

### 📋 Tableau des Retards
Liste les élèves avec mois impayés :
- Nom, Prénom, Classe
- Nombre de mois impayés
- Montant dû (100 DH × mois impayés)

### Actions Rapides
- **Paiements** : Gérer les règlements
- **Dépenses** : Enregistrer une dépense
- **Élèves** : Gérer les inscriptions
- **Messages** : Consulter la messagerie

---

## Gestion des Élèves

### Ajouter un Élève
1. Menu **Élèves** → Bouton **"Nouvel élève"**
2. Remplir :
   - Nom, Prénom
   - Date de naissance
   - Sexe
   - Adresse
   - Téléphone tuteur
   - Classe (sélectionner dans la liste)
3. Cliquer **"Créer"**

### Modifier un Élève
1. Dans la liste, cliquer sur l'icône ✏️ (Modifier)
2. Modifier les informations
3. Cliquer **"Modifier"**

### Supprimer un Élève
1. Cliquer sur l'icône 🗑️ (Supprimer)
2. Confirmer la suppression

### Filtrer les Élèves
- **Par classe** : Sélectionner une classe dans le dropdown
- **Recherche** : Tapez nom/prénom dans la barre de recherche

---

## Paiements

### Enregistrer un Paiement Mensuel
1. Menu **Paiements** → Sélectionner un élève
2. Cliquer sur l'élève dans la liste
3. **Grille 12 mois** s'affiche :
   - 🟢 Vert : Mois payé
   - ⚪ Blanc : Mois non payé
4. Cliquer sur un mois non payé
5. Remplir :
   - Montant (par défaut 100 DH)
   - Mode de paiement (Espèces/Chèque/Virement)
   - Numéro de reçu physique (optionnel)
   - Numéro de carnet (optionnel)
6. Cliquer **"Enregistrer le paiement"**

### Consulter un Reçu
- Cliquer sur un mois payé (vert) dans la grille
- Détails affichés : Date, Montant, Mode, Numéro reçu

### Annuler un Reçu
1. Depuis les détails du reçu
2. Cliquer **"Annuler le reçu"**
3. Confirmer l'annulation

---

## Dépenses

### Créer une Dépense
1. Menu **Dépenses** → Bouton **"Nouvelle dépense"**
2. Remplir :
   - Titre/Description
   - Montant
   - Catégorie (Fournitures, Salaires, Entretien, Autre)
   - Bénéficiaire
   - Date
   - **Photo justificatif** (optionnel) : Glisser-déposer ou cliquer
3. Cliquer **"Créer"**

### Valider une Dépense (Admin uniquement)
1. Filtrer par **Statut** : "En attente"
2. Cliquer sur la dépense
3. Dans la modale de détails, cliquer **"Valider"**
4. Statut passe à "Validée"

### Rejeter une Dépense (Admin)
1. Depuis les détails
2. Cliquer **"Rejeter"**
3. Statut passe à "Rejetée"

### Consulter le Justificatif Photo
- Depuis la modale de détails, cliquer sur l'image pour l'agrandir

---

## Donneurs & Dons

### Ajouter un Donneur
1. Menu **Donneurs** → Bouton **"Nouveau donneur"**
2. Remplir :
   - Nom, Prénom
   - Type (Individu/Organisation)
   - Téléphone, Email, Adresse (optionnels)
   - Commentaire (optionnel)
3. Cliquer **"Créer"**

### Enregistrer un Don
1. Cliquer sur **"Enregistrer un don"** pour un donneur
2. Remplir :
   - Montant
   - Date
   - Mode de paiement
   - Numéro de reçu physique (optionnel)
3. Cliquer **"Enregistrer"**

### Consulter l'Historique des Dons
- Chaque donneur affiche son total de dons et le nombre de contributions

---

## Messages

### Envoyer un Message
1. Menu **Messages** 💬 → Bouton **"Nouveau message"**
2. Sélectionner le **Destinataire** (liste des utilisateurs)
3. Écrire le **contenu** du message
4. Cliquer **"Envoyer"**

### Lire un Message
1. Cliquer sur un message dans la liste
2. Message s'ouvre et est automatiquement marqué comme "Lu"
3. Badge "Nouveau" disparaît

### Supprimer un Message
1. Dans un message ouvert
2. Cliquer sur l'icône **🗑️ Supprimer**
3. Confirmer la suppression

### Notification Badge
- **Icône clochette 🔔** dans le header
- Badge rouge avec le nombre de messages non lus
- Clique pour aller à la page Messages
- Rafraîchissement automatique toutes les 30 secondes

---

## Gestion des Utilisateurs

> ⚠️ **Fonctionnalité réservée à l'Administrateur**

### Créer un Utilisateur
1. Menu **Utilisateurs** 👥 → Bouton **"Nouvel utilisateur"**
2. Remplir :
   - Nom, Prénom
   - Email (utilisé pour se connecter)
   - Mot de passe
   - Rôle (Admin/Secrétaire)
3. Cliquer **"Créer"**

### Modifier un Utilisateur
1. Cliquer sur l'icône ✏️
2. Modifier les informations
3. Laisser le mot de passe vide pour ne pas le changer
4. Cliquer **"Modifier"**

### Gérer les Permissions (Secrétaires uniquement)
1. Cliquer sur l'icône **🛡️ Gérer permissions**
2. **Grille Permissions** s'affiche :
   - Lignes : Modules (Élèves, Paiements, Dépenses, etc.)
   - Colonnes : **Lecture**, **Écriture**, **Validation**
3. Cocher les permissions souhaitées :
   - **Lecture** : Voir les données
   - **Écriture** : Créer/Modifier
   - **Validation** : Approuver (Dépenses uniquement)
4. Cliquer **"Enregistrer"**

**Logique intelligente** :
- Cocher "Écriture" → "Lecture" se coche automatiquement
- Décocher "Lecture" → "Écriture" et "Validation" se décochent

---

## Scolarité

### Classes
1. Menu **Classes** 🏫
2. Créer : Nom de la classe, Niveau associé
3. Modifier/Supprimer

### Niveaux
1. Menu **Niveaux** 📚
2. Créer : Nom du niveau (CP, CE1, etc.)
3. Modifier/Supprimer

### Enseignants
1. Menu **Enseignants** 👨‍🏫
2. Créer : Nom, Prénom, Matière enseignée
3. Modifier/Supprimer

---

## 💡 Conseils d'Utilisation

### Workflow Recommandé
1. **Début d'année** :
   - Créer les Niveaux et Classes
   - Inscrire les Élèves
   - Créer les comptes Secrétaires

2. **Gestion Mensuelle** :
   - Consulter le Dashboard pour voir les retards
   - Enregistrer les paiements mensuels
   - Valider les dépenses

3. **Communication** :
   - Utiliser les Messages pour coordonner entre Admin et Secrétaires

### Sécurité
- Changer le mot de passe admin après première connexion
- Donner uniquement les permissions nécessaires aux Secrétaires
- Sauvegarder régulièrement la base de données (`association.db`)

### Raccourcis
- **Dashboard** : Vue d'ensemble rapide
- **Badge Messages** : Cliquer pour accéder directement
- **Quick Actions (Dashboard)** : Accès rapide aux pages principales

---

## Support

Pour toute question ou problème :
- Contacter l'administrateur système
- Consulter le fichier README.md du projet

**Version** : 1.0  
**Date** : Janvier 2026
