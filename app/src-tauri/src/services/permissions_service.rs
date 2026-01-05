use crate::database::get_connection;
use crate::errors::AppError;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ============================================
// MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPermission {
    pub id: String,
    pub user_id: String,
    pub module: String,
    pub can_read: bool,
    pub can_write: bool,
    pub can_validate: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePermissionsRequest {
    pub permissions: Vec<ModulePermission>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModulePermission {
    pub module: String,
    pub can_read: bool,
    pub can_write: bool,
    pub can_validate: bool,
}

// ============================================
// CONSTANTS
// ============================================

pub const MODULES: [&str; 8] = [
    "eleves",
    "paiements",
    "depenses",
    "donneurs",
    "messages",
    "classes",
    "niveaux",
    "enseignants",
];

// ============================================
// SERVICES
// ============================================

/// Get all permissions for a user
pub fn get_user_permissions(user_id: &str) -> Result<Vec<UserPermission>, AppError> {
    println!("[PERMISSIONS] 🔑 Getting permissions for user {}", user_id);
    
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT id, user_id, module, can_read, can_write, can_validate
        FROM user_permissions
        WHERE user_id = ?
        ORDER BY module
        "#,
    )?;
    
    let permissions = stmt.query_map(params![user_id], |row| {
        Ok(UserPermission {
            id: row.get(0)?,
            user_id: row.get(1)?,
            module: row.get(2)?,
            can_read: row.get::<_, i32>(3)? == 1,
            can_write: row.get::<_, i32>(4)? == 1,
            can_validate: row.get::<_, i32>(5)? == 1,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[PERMISSIONS] ✅ Found {} permissions", permissions.len());
    Ok(permissions)
}

/// Update user permissions (Admin only - checked in command layer)
pub fn update_user_permissions(
    user_id: &str,
    permissions: Vec<ModulePermission>,
) -> Result<(), AppError> {
    println!("[PERMISSIONS] 🔄 Updating permissions for user {}", user_id);
    
    let conn = get_connection();
    
    // Verify user exists
    let user_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM users WHERE id = ?",
        params![user_id],
        |row| row.get(0),
    )?;
    
    if !user_exists {
        return Err(AppError::NotFound("Utilisateur introuvable".to_string()));
    }
    
    // Delete existing permissions
    conn.execute("DELETE FROM user_permissions WHERE user_id = ?", params![user_id])?;
    
    // Insert new permissions
    for perm in permissions {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            r#"
            INSERT INTO user_permissions (id, user_id, module, can_read, can_write, can_validate)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
            params![
                &id,
                user_id,
                &perm.module,
                if perm.can_read { 1 } else { 0 },
                if perm.can_write { 1 } else { 0 },
                if perm.can_validate { 1 } else { 0 },
            ],
        )?;
    }
    
    
    println!("[PERMISSIONS] ✅ Permissions updated successfully");
    Ok(())
}

/// Check if a user has permission for a specific action on a module
/// Returns true if user has permission, false otherwise
/// Admin users always have all permissions
#[allow(dead_code)] // Reserved for future permission enforcement in commands
pub fn check_permission(user_id: &str, module: &str, action: &str) -> Result<bool, AppError> {
    let conn = get_connection();
    
    // Admin always has all permissions
    let is_admin: bool = conn.query_row(
        "SELECT role = 'Admin' FROM users WHERE id = ?",
        params![user_id],
        |row| row.get(0),
    )?;
    
    if is_admin {
        return Ok(true);
    }
    
    // Check specific permission
    let has_permission: bool = conn.query_row(
        &format!(
            "SELECT {} = 1 FROM user_permissions WHERE user_id = ? AND module = ?",
            match action {
                "read" => "can_read",
                "write" => "can_write",
                "validate" => "can_validate",
                _ => return Err(AppError::ValidationError("Action invalide".to_string())),
            }
        ),
        params![user_id, module],
        |row| row.get(0),
    ).unwrap_or(false);
    
    Ok(has_permission)
}

/// Initialize default permissions for new user
pub fn init_default_permissions(user_id: &str, role: &str) -> Result<(), AppError> {
    println!("[PERMISSIONS] 🆕 Initializing default permissions for {} ({})", user_id, role);
    
    let conn = get_connection();
    
    // Admin gets all permissions
    if role == "Admin" {
        for module in &MODULES {
            let id = Uuid::new_v4().to_string();
            conn.execute(
                r#"
                INSERT INTO user_permissions (id, user_id, module, can_read, can_write, can_validate)
                VALUES (?, ?, ?, 1, 1, ?)
                "#,
                params![
                    &id,
                    user_id,
                    module,
                    if *module == "depenses" { 1 } else { 0 },
                ],
            )?;
        }
    } else {
        // Secrétaire gets basic READ permissions on common modules
        for module in &["eleves", "messages", "classes"] {
            let id = Uuid::new_v4().to_string();
            conn.execute(
                r#"
                INSERT INTO user_permissions (id, user_id, module, can_read, can_write, can_validate)
                VALUES (?, ?, ?, 1, 0, 0)
                "#,
                params![&id, user_id, module],
            )?;
        }
    }
    
    println!("[PERMISSIONS] ✅ Default permissions initialized");
    Ok(())
}
