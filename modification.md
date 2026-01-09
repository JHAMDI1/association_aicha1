# Rapport des Modifications - Module Élèves

Ce fichier documente les correctifs techniques apportés au module de gestion des élèves pour résoudre les problèmes de plantage ("Deadlock") et d'affichage des photos.

## 1. Backend (Rust)
**Fichier modifié :** `src-tauri/src/services/eleves_service.rs`

### A. Correction des Deadlocks (Plantages)
**Problème :** L'application se figeait lors de la création ou modification d'un élève.
**Cause :** La fonction gardait une connexion à la base de données ouverte (`MutexGuard`) tout en appelant une autre fonction (`get_eleve_by_id`) qui tentait d'ouvrir une *nouvelle* connexion, créant un blocage mutuel.
**Solution :**
- Utilisation de `drop(conn)` pour libérer explicitement la connexion avant de rappeler la base de données.
- Modification appliquée aux fonctions :
  - `create_eleve`
  - `update_eleve`

### B. Correction des Chemins Photos
**Problème :** Les photos ne s'affichaient pas car le backend renvoyait des chemins relatifs (ex: `photos/image.jpg`).
**Solution :**
- Ajout d'une fonction utilitaire `resolve_photo_path` qui convertit le chemin relatif en chemin absolu complet système.
- Modification des fonctions de lecture (`get_all_eleves`, `get_eleve_by_id`) pour utiliser cette conversion.

---

## 2. Frontend (React/TypeScript)
**Fichier modifié :** `src/features/eleves/ElevesList.tsx`

### Affichage des Images Locales
**Problème :** Le navigateur ne peut pas afficher directement une image locale pour des raisons de sécurité.
**Solution :**
- Import de la fonction `convertFileSrc` depuis `@tauri-apps/api/core`.
- Enveloppement des chemins d'images : `<img src={convertFileSrc(eleve.photo_path)} ... />`.
- Cela permet à Tauri de charger l'image de manière sécurisée via le protocole `asset://`.

---

## 3. Configuration
**Fichiers modifiés :** `.gitignore`
- Ajout de `src-tauri/photos/` et `src-tauri/uploads/` pour éviter que l'ajout d'une photo ne redémarre le serveur de développement.

## 4. Stabilité Watcher (Fix Final)
**Fichier modifié :** `src-tauri/.gitignore`
**Problème :** L'application redémarrait en boucle lors de l'upload d'une image car le dossier `photos` était surveillé.
**Solution :** Exclusion explicite des dossiers `photos/` et `uploads/` dans le fichier `.gitignore` du dossier `src-tauri`. Cela permet de stocker les fichiers sans déclencher de rebuild.

---

## 5. Champs Date Personnalisée pour Paiements
**Fichiers modifiés :**
- `src-tauri/src/services/paiements_service.rs` (Backend)
- `src/features/paiements/api.ts` (Frontend API)
- `src/features/paiements/PaiementModal.tsx` (Frontend UI)

### Backend
- Ajout du champ `date_operation: Option<String>` à `CreateRecuRequest`
- La fonction `create_recu` utilise la date fournie ou la date actuelle par défaut

### Frontend
- Ajout d'un champ date dans le modal de paiement
- Les champs **N° Carnet** et **N° Reçu** sont maintenant **obligatoires**
- Sélection automatique du mois courant pour les paiements mensuels

---

## 6. Champ "Date Facture" pour Dépenses
**Fichiers modifiés :**
- `src-tauri/src/services/depenses_service.rs` (Backend)
- `src/features/depenses/api.ts` (Frontend API)
- `src/features/depenses/DepenseModal.tsx` (Frontend UI)

### Fonctionnalité
- Ajout d'un champ date personnalisable pour les dépenses
- L'utilisateur peut choisir la date de la facture

---

## 7. Export PDF/Excel Natif (Tauri FS)
**Fichiers modifiés :**
- `src-tauri/Cargo.toml` - Ajout du plugin `tauri-plugin-fs`
- `src-tauri/src/lib.rs` - Enregistrement du plugin FS
- `src/lib/csvExport.ts` - Export CSV via boîte de dialogue native
- `src/lib/pdfExport.ts` - Export PDF via boîte de dialogue native
- `src/components/ExportButton.tsx` - Ajout de `type="button"`

### Problème
Les boutons Export ne fonctionnaient pas (téléchargement bloqué dans webview)

### Solution
- Utilisation des plugins Tauri `dialog` et `fs` pour sauvegarder les fichiers
- Ouverture d'une boîte de dialogue "Enregistrer sous" native
- Fallback vers téléchargement navigateur si erreur

---

## 8. Correction Sidebar Secrétaire
**Fichier modifié :** `src/features/finances/Dashboard.tsx`

### Problème
Les comptes Secrétaire n'avaient pas de barre latérale visible

### Solution
- Réécriture de la fonction `hasAccess()` pour utiliser correctement les permissions par module
- Le sidebar affiche maintenant les modules pour lesquels le secrétaire a la permission "Lecture"
- Le tableau de bord est toujours accessible

---

## 9. Correction Deadlock Création Utilisateur
**Fichier modifié :** `src-tauri/src/services/auth_service.rs`

### Problème
L'application plantait lors de la création d'un nouvel utilisateur

### Cause
La connexion BD restait verrouillée pendant l'appel à `init_default_permissions`

### Solution
```rust
// AVANT (deadlock)
conn.execute(...)?;
init_default_permissions(...)?;
drop(conn);

// APRÈS (corrigé)
conn.execute(...)?;
drop(conn);  // Libérer AVANT
init_default_permissions(...)?;
```
