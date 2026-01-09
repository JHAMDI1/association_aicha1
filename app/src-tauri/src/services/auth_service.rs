use crate::database::get_connection;
use chrono::Utc;
use crate::errors::AppError;
use rusqlite::params;
use crate::models::{User, UserRole, CreateUserRequest, UpdateUserRequest, UserPublic};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use uuid::Uuid;
use rand::rngs::OsRng;

/// Hash a password using Argon2 (sync version for seeding - doesn't use database)
pub fn hash_password_sync(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();
    Ok(hash)
}

/// Hash a password using Argon2
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();
    Ok(hash)
}

/// Verify a password against its hash
pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::InternalError(format!("Invalid hash format: {}", e)))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

/// Authenticate a user by email and password
pub fn authenticate(email: &str, password: &str) -> Result<User, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, nom, prenom, email, password_hash, role, actif, created_at 
         FROM users WHERE email = ? AND actif = 1 AND deleted_at IS NULL"
    )?;
    
    let user = stmt.query_row([email], |row| {
        Ok(User {
            id: row.get(0)?,
            nom: row.get(1)?,
            prenom: row.get(2)?,
            email: row.get(3)?,
            password_hash: row.get(4)?,
            role: UserRole::from_str(&row.get::<_, String>(5)?).unwrap_or(UserRole::Secretaire),
            actif: row.get::<_, i32>(6)? == 1,
            created_at: row.get(7)?,
        })
    }).map_err(|_| AppError::Unauthorized("Email ou mot de passe incorrect".to_string()))?;
    
    // Verify password
    if !verify_password(password, &user.password_hash)? {
        return Err(AppError::Unauthorized("Email ou mot de passe incorrect".to_string()));
    }
    
    Ok(user)
}

/// Get all users
pub fn get_all_users() -> Result<Vec<UserPublic>, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, nom, prenom, email, role, actif 
         FROM users WHERE deleted_at IS NULL ORDER BY nom, prenom"
    )?;
    
    let users = stmt.query_map([], |row| {
        Ok(UserPublic {
            id: row.get(0)?,
            nom: row.get(1)?,
            prenom: row.get(2)?,
            email: row.get(3)?,
            role: UserRole::from_str(&row.get::<_, String>(4)?).unwrap_or(UserRole::Secretaire),
            actif: row.get::<_, i32>(5)? == 1,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(users)
}

/// Get user by ID
pub fn get_user_by_id(id: &str) -> Result<UserPublic, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT id, nom, prenom, email, role, actif 
         FROM users WHERE id = ? AND deleted_at IS NULL"
    )?;
    
    let user = stmt.query_row([id], |row| {
        Ok(UserPublic {
            id: row.get(0)?,
            nom: row.get(1)?,
            prenom: row.get(2)?,
            email: row.get(3)?,
            role: UserRole::from_str(&row.get::<_, String>(4)?).unwrap_or(UserRole::Secretaire),
            actif: row.get::<_, i32>(5)? == 1,
        })
    }).map_err(|_| AppError::NotFound("Utilisateur non trouvé".to_string()))?;
    
    Ok(user)
}

use crate::services::audit_service;
use serde_json::json;

/// Create a new user (admin only)
pub fn create_user(request: CreateUserRequest, admin_id: &str) -> Result<UserPublic, AppError> {
    let conn = get_connection();
    
    // Check if email already exists
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE email = ? AND deleted_at IS NULL",
        [&request.email],
        |row| row.get(0)
    )?;
    
    if count > 0 {
        return Err(AppError::Conflict("Cet email est déjà utilisé".to_string()));
    }
    
    let id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&request.password)?;
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO users (id, nom, prenom, email, password_hash, role, actif, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        params![
            id, request.nom, request.prenom, request.email, 
            password_hash, request.role.as_str(), now
        ]
    )?;
    
    // Log action
    let _ = audit_service::log_action(
        admin_id,
        "CREATION",
        "UTILISATEUR",
        Some(&id),
        Some(json!({
            "email": request.email,
            "role": request.role.as_str()
        }))
    );
    
    Ok(UserPublic {
        id,
        nom: request.nom,
        prenom: request.prenom,
        email: request.email,
        role: request.role,
        actif: true,
    })
}

/// Update a user (admin only)
pub fn update_user(id: &str, request: UpdateUserRequest, admin_id: &str) -> Result<UserPublic, AppError> {
    let conn = get_connection();
    
    // Check if user exists
    let mut current = get_user_by_id(id)?;
    
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(nom) = &request.nom { updates.push("nom = ?"); params.push(Box::new(nom.clone())); current.nom = nom.clone(); }
    if let Some(prenom) = &request.prenom { updates.push("prenom = ?"); params.push(Box::new(prenom.clone())); current.prenom = prenom.clone(); }
    if let Some(email) = &request.email {
        // Check uniqueness if email changes
        if email != &current.email {
             let count: i32 = conn.query_row(
                "SELECT COUNT(*) FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL",
                params![email, id],
                |row| row.get(0)
            )?;
            if count > 0 { return Err(AppError::Conflict("Cet email est déjà utilisé".to_string())); }
        }
        updates.push("email = ?"); params.push(Box::new(email.clone())); current.email = email.clone();
    }
    if let Some(role) = &request.role { updates.push("role = ?"); params.push(Box::new(role.as_str().to_string())); current.role = role.clone(); }
    if let Some(actif) = request.actif { updates.push("actif = ?"); params.push(Box::new(if actif { 1 } else { 0 })); current.actif = actif; }
    if let Some(password) = &request.password {
        let hash = hash_password(password)?;
        updates.push("password_hash = ?"); params.push(Box::new(hash));
    }
    
    if updates.is_empty() { return Ok(current); }
    
    let query = format!("UPDATE users SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id.to_string()));
    
    conn.execute(&query, rusqlite::params_from_iter(params.iter()))?;
    
    // Log action
    let _ = audit_service::log_action(
        admin_id,
        "MODIFICATION",
        "UTILISATEUR",
        Some(id),
        None
    );
    
    Ok(current)
}

/// Delete a user (soft delete)
pub fn delete_user(id: &str, admin_id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    // Prevent self-deletion not handled here, should be handled by business logic/frontend, 
    // but typically user shouldn't delete themselves if it leaves 0 admins. 
    // For now assuming caller check.
    
    let now = Utc::now().to_rfc3339();
    
    let count = conn.execute(
        "UPDATE users SET deleted_at = ? WHERE id = ?",
        params![now, id],
    )?;
    
    if count == 0 {
        return Err(AppError::NotFound("Utilisateur non trouvé".to_string()));
    }
    
    // Log action
    let _ = audit_service::log_action(
        admin_id,
        "SUPPRESSION",
        "UTILISATEUR",
        Some(id),
        None
    );
    
    Ok(())
}
