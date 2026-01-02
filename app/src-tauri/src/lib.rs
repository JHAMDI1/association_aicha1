// Association Aicha - Desktop Application
// Tauri + React + SQLite

mod config;
mod database;
mod errors;
mod models;
mod services;

use models::{LoginResponse, CreateUserRequest, UpdateUserRequest, UserPublic, UserRole};
use services::{Eleve, EleveListItem, CreateEleveRequest, UpdateEleveRequest};
use services::niveaux_service::{Niveau, CreateNiveauRequest, UpdateNiveauRequest};
use services::enseignants_service::{Enseignant, CreateEnseignantRequest, UpdateEnseignantRequest};
use services::classes_service::{Classe, ClasseListItem, CreateClasseRequest, UpdateClasseRequest};
use services::{PaiementStatus, CreateRecuRequest, RecuDetail, RecuListItem};
use services::{Depense, DepenseListItem, CreateDepenseRequest, DepenseStats};
use services::{Donneur, DonneurListItem, CreateDonneurRequest};
use std::sync::Mutex;
use once_cell::sync::Lazy;

/// Current logged-in user session (stored in memory)
static CURRENT_USER: Lazy<Mutex<Option<UserPublic>>> = Lazy::new(|| Mutex::new(None));

// ============================================
// AUTH COMMANDS
// ============================================

/// Login command
#[tauri::command]
fn login(email: String, password: String) -> Result<LoginResponse, String> {
    let user = services::authenticate(&email, &password)
        .map_err(|e| e.to_string())?;
    
    let user_public: UserPublic = user.into();
    
    // Store in session
    let mut session = CURRENT_USER.lock().unwrap();
    *session = Some(user_public.clone());
    
    Ok(LoginResponse {
        user: user_public,
        message: "Connexion réussie".to_string(),
    })
}

/// Logout command
#[tauri::command]
fn logout() -> Result<String, String> {
    let mut session = CURRENT_USER.lock().unwrap();
    *session = None;
    Ok("Déconnexion réussie".to_string())
}

/// Get current logged-in user
#[tauri::command]
fn get_current_user() -> Result<Option<UserPublic>, String> {
    let session = CURRENT_USER.lock().unwrap();
    Ok(session.clone())
}

/// Get all users (admin only)
#[tauri::command]
fn get_users() -> Result<Vec<UserPublic>, String> {
    services::get_all_users().map_err(|e| e.to_string())
}

/// Get user by ID
#[tauri::command]
fn get_user(id: String) -> Result<UserPublic, String> {
    services::get_user_by_id(&id).map_err(|e| e.to_string())
}

/// Create a new user (admin only)
#[tauri::command]
fn create_user(request: CreateUserRequest) -> Result<UserPublic, String> {
    services::create_user(request).map_err(|e| e.to_string())
}

/// Update a user (admin only)
#[tauri::command]
fn update_user(id: String, request: UpdateUserRequest) -> Result<UserPublic, String> {
    services::update_user(&id, request).map_err(|e| e.to_string())
}

/// Delete a user (admin only)
#[tauri::command]
fn delete_user(id: String) -> Result<String, String> {
    services::delete_user(&id).map_err(|e| e.to_string())?;
    Ok("Utilisateur supprimé".to_string())
}

// ============================================
// ELEVES COMMANDS
// ============================================

/// Get all élèves with optional search
#[tauri::command]
fn get_eleves(search: Option<String>) -> Result<Vec<EleveListItem>, String> {
    services::get_all_eleves(search).map_err(|e| e.to_string())
}

/// Get élève by ID
#[tauri::command]
fn get_eleve(id: String) -> Result<Eleve, String> {
    services::get_eleve_by_id(&id).map_err(|e| e.to_string())
}

/// Create a new élève
#[tauri::command]
fn create_eleve(request: CreateEleveRequest) -> Result<Eleve, String> {
    services::create_eleve(request).map_err(|e| e.to_string())
}

/// Update an élève
#[tauri::command]
fn update_eleve(id: String, request: UpdateEleveRequest) -> Result<Eleve, String> {
    services::update_eleve(&id, request).map_err(|e| e.to_string())
}

/// Delete an élève
#[tauri::command]
fn delete_eleve(id: String) -> Result<String, String> {
    services::delete_eleve(&id).map_err(|e| e.to_string())?;
    Ok("Élève supprimé".to_string())
}

/// Upload photo for an élève
#[tauri::command]
fn upload_photo(eleve_id: String, photo_base64: String) -> Result<String, String> {
    services::upload_photo(&eleve_id, &photo_base64).map_err(|e| e.to_string())
}

// ============================================
// NIVEAUX COMMANDS
// ============================================

#[tauri::command]
fn get_niveaux() -> Result<Vec<Niveau>, String> {
    services::get_all_niveaux().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_niveau(id: String) -> Result<Niveau, String> {
    services::get_niveau_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_niveau(request: CreateNiveauRequest) -> Result<Niveau, String> {
    services::create_niveau(request).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_niveau(id: String, request: UpdateNiveauRequest) -> Result<Niveau, String> {
    services::update_niveau(&id, request).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_niveau(id: String) -> Result<String, String> {
    services::delete_niveau(&id).map_err(|e| e.to_string())?;
    Ok("Niveau supprimé".to_string())
}

// ============================================
// ENSEIGNANTS COMMANDS
// ============================================

#[tauri::command]
fn get_enseignants(search: Option<String>) -> Result<Vec<Enseignant>, String> {
    services::get_all_enseignants(search).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_enseignant(id: String) -> Result<Enseignant, String> {
    services::get_enseignant_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_enseignant(request: CreateEnseignantRequest) -> Result<Enseignant, String> {
    services::create_enseignant(request).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_enseignant(id: String, request: UpdateEnseignantRequest) -> Result<Enseignant, String> {
    services::update_enseignant(&id, request).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_enseignant(id: String) -> Result<String, String> {
    services::delete_enseignant(&id).map_err(|e| e.to_string())?;
    Ok("Enseignant supprimé".to_string())
}

// ============================================
// CLASSES COMMANDS
// ============================================

#[tauri::command]
fn get_classes() -> Result<Vec<ClasseListItem>, String> {
    services::get_all_classes().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_classe(id: String) -> Result<Classe, String> {
    services::get_classe_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_classe(request: CreateClasseRequest) -> Result<Classe, String> {
    services::create_classe(request).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_classe(id: String, request: UpdateClasseRequest) -> Result<Classe, String> {
    services::update_classe(&id, request).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_classe(id: String) -> Result<String, String> {
    services::delete_classe(&id).map_err(|e| e.to_string())?;
    Ok("Classe supprimée".to_string())
}

// ============================================
// PAIEMENTS COMMANDS
// ============================================

#[tauri::command]
fn get_paiement_status(eleve_id: String, annee_scolaire: String) -> Result<PaiementStatus, String> {
    services::get_paiement_status(&eleve_id, &annee_scolaire).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_paiement(request: CreateRecuRequest) -> Result<RecuDetail, String> {
    // Get current user from session
    let session = CURRENT_USER.lock().unwrap();
    let user_id = session.as_ref()
        .map(|u| u.id.clone())
        .ok_or_else(|| "Non authentifié".to_string())?;
    
    services::create_recu(request, &user_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_recu(recu_id: String) -> Result<RecuDetail, String> {
    services::get_recu_by_id(&recu_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_recus_eleve(eleve_id: String) -> Result<Vec<RecuListItem>, String> {
    services::get_recus_by_eleve(&eleve_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_recus_list() -> Result<Vec<RecuListItem>, String> {
    services::get_all_recus().map_err(|e| e.to_string())
}

#[tauri::command]
fn annuler_paiement(recu_id: String) -> Result<String, String> {
    services::annuler_recu(&recu_id).map_err(|e| e.to_string())?;
    Ok("Reçu annulé".to_string())
}

// ============================================
// DEPENSES COMMANDS
// ============================================

#[tauri::command]
fn get_depenses(etat_filter: Option<String>) -> Result<Vec<DepenseListItem>, String> {
    services::get_all_depenses(etat_filter).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_depense(id: String) -> Result<Depense, String> {
    services::get_depense_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_depense(request: CreateDepenseRequest) -> Result<Depense, String> {
    let session = CURRENT_USER.lock().unwrap();
    let user = session.as_ref().ok_or_else(|| "Non authentifié".to_string())?;
    let is_admin = user.role == UserRole::Admin;
    
    services::create_depense(request, &user.id, is_admin).map_err(|e| e.to_string())
}

#[tauri::command]
fn valider_depense(depense_id: String) -> Result<Depense, String> {
    let session = CURRENT_USER.lock().unwrap();
    let user = session.as_ref().ok_or_else(|| "Non authentifié".to_string())?;
    
    if user.role != UserRole::Admin {
        return Err("Seul un administrateur peut valider une dépense".to_string());
    }
    
    services::valider_depense(&depense_id, &user.id).map_err(|e| e.to_string())
}

#[tauri::command]
fn rejeter_depense(depense_id: String, motif: Option<String>) -> Result<Depense, String> {
    let session = CURRENT_USER.lock().unwrap();
    let user = session.as_ref().ok_or_else(|| "Non authentifié".to_string())?;
    
    if user.role != UserRole::Admin {
        return Err("Seul un administrateur peut rejeter une dépense".to_string());
    }
    
    services::rejeter_depense(&depense_id, &user.id, motif).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_depense(id: String) -> Result<String, String> {
    services::delete_depense(&id).map_err(|e| e.to_string())?;
    Ok("Dépense supprimée".to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
fn upload_piece_jointe(depenseId: String, fileBase64: String) -> Result<String, String> {
    services::upload_piece_jointe(&depenseId, &fileBase64).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_depenses_stats() -> Result<DepenseStats, String> {
    services::get_depenses_stats().map_err(|e| e.to_string())
}

/// Debug log command to forward frontend logs to terminal
#[tauri::command]
fn debug_log(message: String) {
    println!("[FRONTEND] {}", message);
}

// ============================================
// DONNEURS COMMANDS
// ============================================

#[tauri::command]
fn get_donneurs() -> Result<Vec<DonneurListItem>, String> {
    services::get_all_donneurs().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_donneur(id: String) -> Result<Donneur, String> {
    services::get_donneur_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_donneur(request: CreateDonneurRequest) -> Result<Donneur, String> {
    services::create_donneur(request).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_donneur(id: String, request: services::donneurs_service::UpdateDonneurRequest) -> Result<Donneur, String> {
    services::update_donneur(&id, request).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_donneur(id: String) -> Result<String, String> {
    services::delete_donneur(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn search_donneurs(query: String) -> Result<Vec<DonneurListItem>, String> {
    services::search_donneurs(&query).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database on startup
    drop(database::get_connection());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            login,
            logout,
            get_current_user,
            get_users,
            get_user,
            create_user,
            update_user,
            delete_user,
            // Eleves commands
            get_eleves,
            get_eleve,
            create_eleve,
            update_eleve,
            delete_eleve,
            upload_photo,
            // Niveaux
            get_niveaux,
            get_niveau,
            create_niveau,
            update_niveau,
            delete_niveau,
            // Enseignants
            get_enseignants,
            get_enseignant,
            create_enseignant,
            update_enseignant,
            delete_enseignant,
            // Classes
            get_classes,
            get_classe,
            create_classe,
            update_classe,
            delete_classe,
            // Paiements
            get_paiement_status,
            create_paiement,
            get_recu,
            get_recus_eleve,
            get_all_recus_list,
            annuler_paiement,
            // Depenses
            get_depenses,
            get_depense,
            create_depense,
            valider_depense,
            rejeter_depense,
            delete_depense,
            upload_piece_jointe,
            get_depenses_stats,
            debug_log,
            // Donneurs
            get_donneurs,
            get_donneur,
            create_donneur,
            update_donneur,
            delete_donneur,
            search_donneurs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

