// Association Aicha - Desktop Application
// Tauri + React + SQLite

mod config;
mod database;
mod errors;
mod models;
mod services;

use models::{LoginResponse, CreateUserRequest, UpdateUserRequest, UserPublic};
use services::{Eleve, EleveListItem, CreateEleveRequest, UpdateEleveRequest};
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

