use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use crate::config::{Config, load_config};
use crate::services;

/// Global configuration loaded once
pub static CONFIG: Lazy<Config> = Lazy::new(|| load_config());

/// Global database connection wrapped in Mutex for thread safety
pub static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let conn = init_database().expect("Failed to initialize database");
    Mutex::new(conn)
});

/// Get the database file path in the app data directory
fn get_db_path() -> PathBuf {
    // For development, use current directory
    // In production, use tauri::api::path::app_data_dir
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push(&CONFIG.database.filename);
    path
}

/// Initialize the database and run migrations
fn init_database() -> Result<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;
    
    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    
    // Run migrations
    run_migrations(&conn)?;
    
    // Seed admin user if not exists
    seed_admin_user(&conn);
    
    println!("Database initialized at: {:?}", db_path);
    Ok(conn)
}

/// Run all SQL migrations
fn run_migrations(conn: &Connection) -> Result<()> {
    // Migration 001: Initial Schema (without seed data)
    conn.execute_batch(include_str!("../migrations/001_init.sql"))?;

    // Migration 002: Add carnet info
    // We execute statements individually and ignore errors (in case columns already exist)
    let _ = conn.execute("ALTER TABLE recus ADD COLUMN numero_carnet TEXT", []);
    let _ = conn.execute("ALTER TABLE recus ADD COLUMN numero_recu_physique TEXT", []);

    Ok(())
}

/// Seed the admin user with credentials from config.toml
fn seed_admin_user(conn: &Connection) {
    let admin_config = &CONFIG.admin;
    
    // Check if admin already exists
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)",
        [&admin_config.email],
        |row| row.get(0)
    ).unwrap_or(false);
    
    if !exists {
        // Hash the password from config
        let password_hash = services::hash_password_sync(&admin_config.password)
            .unwrap_or_else(|_| "invalid".to_string());
        
        conn.execute(
            "INSERT INTO users (id, nom, prenom, email, password_hash, role, actif) 
             VALUES ('admin-001', ?, ?, ?, ?, 'ADMIN', 1)",
            rusqlite::params![
                admin_config.nom,
                admin_config.prenom,
                admin_config.email,
                password_hash
            ]
        ).ok();
        
        println!("========================================");
        println!("Admin créé avec succès!");
        println!("Email: {}", admin_config.email);
        println!("Mot de passe: {}", admin_config.password);
        println!("⚠️  Changez ce mot de passe après connexion!");
        println!("========================================");
    }
}

/// Get a reference to the database connection
pub fn get_connection() -> std::sync::MutexGuard<'static, Connection> {
    DB.lock().expect("Database mutex poisoned")
}

/// Get the application configuration
pub fn get_config() -> &'static Config {
    &CONFIG
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_db_connection() {
        let conn = get_connection();
        let result: i32 = conn.query_row("SELECT 1", [], |row| row.get(0)).unwrap();
        assert_eq!(result, 1);
    }
}
