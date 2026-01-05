use crate::database::get_connection;
use crate::errors::AppError;
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

/// Create a new user
pub fn create_user(req: CreateUserRequest) -> Result<UserPublic, AppError> {
    let conn = get_connection();
    
    // Check if email already exists
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = ? AND deleted_at IS NULL)",
        [&req.email],
        |row| row.get(0)
    )?;
    
    if exists {
        return Err(AppError::ValidationError("Cet email est déjà utilisé".to_string()));
    }
    
    let id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&req.password)?;
    
    conn.execute(
        "INSERT INTO users (id, nom, prenom, email, password_hash, role, actif) 
         VALUES (?, ?, ?, ?, ?, ?, 1)",
        rusqlite::params![id, req.nom, req.prenom, req.email, password_hash, req.role.as_str()]
    )?;
    
    // Initialize default permissions
    crate::services::permissions_service::init_default_permissions(&id, req.role.as_str())?;
    
    get_user_by_id(&id)
}

/// Update an existing user
pub fn update_user(id: &str, req: UpdateUserRequest) -> Result<UserPublic, AppError> {
    let conn = get_connection();
    
    // Check if user exists
    let _existing = get_user_by_id(id)?;
    
    // Build dynamic update query
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(nom) = &req.nom {
        updates.push("nom = ?");
        params.push(Box::new(nom.clone()));
    }
    if let Some(prenom) = &req.prenom {
        updates.push("prenom = ?");
        params.push(Box::new(prenom.clone()));
    }
    if let Some(email) = &req.email {
        updates.push("email = ?");
        params.push(Box::new(email.clone()));
    }
    if let Some(password) = &req.password {
        let hash = hash_password(password)?;
        updates.push("password_hash = ?");
        params.push(Box::new(hash));
    }
    if let Some(role) = &req.role {
        updates.push("role = ?");
        params.push(Box::new(role.as_str().to_string()));
    }
    if let Some(actif) = req.actif {
        updates.push("actif = ?");
        params.push(Box::new(if actif { 1 } else { 0 }));
    }
    
    if updates.is_empty() {
        return get_user_by_id(id);
    }
    
    updates.push("updated_at = datetime('now')");
    
    let query = format!("UPDATE users SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id.to_string()));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&query, params_refs.as_slice())?;
    
    get_user_by_id(id)
}

/// Soft delete a user
pub fn delete_user(id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    let rows = conn.execute(
        "UPDATE users SET deleted_at = datetime('now'), actif = 0 WHERE id = ? AND deleted_at IS NULL",
        [id]
    )?;
    
    if rows == 0 {
        return Err(AppError::NotFound("Utilisateur non trouvé".to_string()));
    }
    
    Ok(())
}
