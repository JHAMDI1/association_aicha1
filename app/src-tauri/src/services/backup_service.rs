use crate::errors::AppError;
use std::fs;
use std::path::Path;

/// Backup database to specified path
pub fn backup_database(backup_path: &str) -> Result<(), AppError> {
    println!("[BACKUP] 💾 Creating database backup to: {}", backup_path);
    
    let db_path = std::env::current_dir()
        .unwrap()
        .join("association.db");
    let source = Path::new(&db_path);
    let destination = Path::new(backup_path);
    
    // Ensure source exists
    if !source.exists() {
        return Err(AppError::NotFound("Base de données introuvable".to_string()));
    }
    
    // Copy database file
    fs::copy(source, destination)
        .map_err(|e| AppError::DatabaseError(format!("Erreur lors de la sauvegarde: {}", e)))?;
    
    println!("[BACKUP] ✅ Backup created successfully");
    Ok(())
}

/// Restore database from backup file
pub fn restore_database(backup_path: &str) -> Result<(), AppError> {
    println!("[BACKUP] 📥 Restoring database from: {}", backup_path);
    
    let source = Path::new(backup_path);
    let db_path = std::env::current_dir()
        .unwrap()
        .join("association.db");
    let destination = Path::new(&db_path);
    
    // Ensure backup file exists
    if !source.exists() {
        return Err(AppError::NotFound("Fichier de sauvegarde introuvable".to_string()));
    }
    
    // Create backup of current DB before restore (safety)
    let safety_backup = format!("{}.before_restore", db_path.display());
    if destination.exists() {
        fs::copy(destination, &safety_backup)
            .map_err(|e| AppError::DatabaseError(format!("Erreur sauvegarde sécurité: {}", e)))?;
        println!("[BACKUP] 🛡️ Safety backup created: {}", safety_backup);
    }
    
    // Restore from backup
    fs::copy(source, destination)
        .map_err(|e| AppError::DatabaseError(format!("Erreur lors de la restauration: {}", e)))?;
    
    println!("[BACKUP] ✅ Database restored successfully");
    Ok(())
}
