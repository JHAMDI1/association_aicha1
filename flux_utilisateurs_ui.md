# Flux Utilisateurs & Vision UI/UX - Association Aicha

## 1. Vision UI/UX "Pro" & Moderne

L'objectif est de créer une application Desktop qui ne ressemble pas à un vieux tableau Excel grid. Nous visons une expérience fluide, rassurante et efficace.

### **Style Visuel (Look & Feel)**
*   **Thème** : Clean / Minimaliste avec des touches chaleureuses (l'esprit associatif).
    *   *Couleurs* : Blanc cassé pour le fond, Vert émeraude sombre (sérieux/confiance) pour les actions principales, touches d'Or/Ocre pour les éléments "Sacrés/Importants" (référence coranique subtile).
*   **Layout** :
    *   **Sidebar Latérale Fixe** : Navigation sombre avec iconographie claire (Dashboard, Elèves, Employés, Finances, Paramètres).
    *   **Header Flottant** : Barre de recherche globale (Ctrl+K), Notifications (Messages), Profil connecté.
    *   **Card Design** : Tout contenu est dans des "Cartes" blanches avec une ombre légère (`box-shadow` subtile) et des coins arrondis (`border-radius: 12px`).

### **Expérience Utilisateur (UX Points Clés)**
*   **Feedback Immédiat** : Chaque action (paiement, ajout) affiche un "Toast" de succès en bas à droite.
*   **Zéro Clic Inutile** : Le dashboard donnera les infos vitales tout de suite.
*   **Mode Focus** : Lors de la saisie d'un paiement, le reste de l'interface s'estompe pour éviter les erreurs.

---

## 2. Flux Utilisateurs (User Flows)

### **Flux 1 : Le Secrétaire Encaisse un Paiement (Le Cœur du Système)**
*C'est l'action la plus critique. Elle doit être rapide et sans erreur.*

1.  **Déclencheur** : Un tuteur arrive pour payer le mois de son enfant.
2.  **Action** : Le secrétaire clique sur "Nouveau Paiement" (Bouton Fab "+" toujours visible) OU Barre de recherche -> Tape le nom de l'enfant.
3.  **L'Interface (La Modale de Paiement)** :
    *   Affiche la photo de l'élève et sa classe (Vérification visuelle).
    *   **La Grille des 12 Mois** :
        *   Les mois *déjà payés* sont grisés avec une icône "Check" verte et la date du paiement au survol.
        *   Les mois *impayés* sont blancs/cliquables.
        *   Les mois *futurs* sont cliquables mais marqués distinctement.
4.  **Saisie** :
    *   Le secrétaire coche "Novembre" et "Décembre".
    *   Le système calcule automatiquement le total (ex: 200 DH x 2 = 400 DH) (le montant nest pas fixe et le secretaire peut mettre le montant manuellement).
    *   Il sélectionne le mode (Espèces/Chèque).
5.  **Validation** : Clic sur "Confirmer" (il ya un carnet physique et on va metre le numero de carnet et recu dans la page de payment) .
6.  **Résultat** :
    *   La base de données est mise à jour.
    *   Une notification "En attente de validation admin" est créée (silencieusement).

### **Flux 2 : L'Admin Valide les Finances (Contrôle)**
*L'admin ne doit pas être submergé, il doit contrôler.*

1.  **Dashboard Admin** : Une section "A Valider" clignote ou affiche un badge rouge (ex: "5 Opérations").
2.  **Vue Liste** : Tableau des opérations récentes.
    *   Ligne : "Paiement 400 DH - Elève X - Par Secrétaire Y".
    *   Action : Bouton "Valider" (Check) ou "Rejeter/Demander modif" (Croix).
3.  **Bulk Action** : L'admin peut tout sélectionner et cliquer "Tout Valider" en fin de journée.
4.  **Sécurité** : Si une modification/suppression est demandée par le secrétaire, elle apparaît ici en ROUGE avec le motif avant d'être effective.

### **Flux 3 : Communication Interne (Le carnet de liaison numérique)**
*Remplacer les post-it perdus.*

1.  **Scénario** : Le secrétaire veut dire à l'admin qu'il manque de papier.
2.  **Action** : Clic sur l'icône "Enveloppe" en haut -> "Nouveau Message".
3.  **Destinataire** : Sélectionne "Admin".
4.  **Contenu** : "Besoin de ramettes A4 urgemment."
5.  **Réception** :
    *   L'Admin se connecte le soir.
    *   Cloche de notification active.
    *   Il lit et peut marquer comme "Vu" ou "Traité".

### **Flux 4 : Gestion des Classes (Rentrée Scolaire)**
1.  **Vue** : Drag & Drop Interface.
2.  **Action** : Une liste d'élèves "Sans Classe" à gauche, les Classes (Cercles ou Colonnes) à droite.
3.  **Interaction** : On glisse un élève dans une classe.
4.  **Feedback** : La jauge de la classe se remplit (ex: 25/30 élèves).

---

## 3. Maquettes Mentales (Wireframes Description)

### **A. Le Dashboard (Page d'accueil)**
*   **Top Cards (KPIs)** :
    *   💰 Recettes du Jour (ex: 1200 DH).
    *   🎓 Élèves Présents.
    *   ⚠️ Retards de Paiement (Liste rouge).
*   **Centre** : Graphique simple "Entrées vs Sorties" sur la semaine.
*   **Droite (Activité)** : Fil d'actualité "Mohamed a payé Mars", "Fatima a inscrit son fils".

### **B. La Fiche Élève (Profil 360°)**
*   **En-tête** : Grande photo ronde, Nom, Classe actuelle, Badge "À Jour" (Vert) ou "Retard" (Rouge).
*   **Onglets** :
    *   *Infos* : Parents, Tél, Adresse.
    *   *Finances* : Historique complet de tous les reçus scannés/générés.
    *   *Scolarité* : Historique des classes précédentes.

### **C. La Page "Finances" (La Comptabilité)**
*   Tableau puissant avec filtres avancés (Date, Type, Mode de paiement).
*   Bouton "Export Excel" (Indispensable pour l'asso).
*   Onglet "Dépenses" : Galerie des factures (photos) uploadées.
