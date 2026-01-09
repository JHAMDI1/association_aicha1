use crate::errors::AppError;
use std::fs;
use std::path::Path;
use crate::config::CONFIG;

/// Backup database to specified path
pub fn backup_database(backup_path: &str) -> Result<(), AppError> {
    println!("[BACKUP] 💾 Creating database backup to: {}", backup_path);
    
    let db_path = std::env::current_dir()
        .unwrap()
        .join(&CONFIG.database.filename);
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
        .join(&CONFIG.database.filename);
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

/// Full backup: database + uploads folder
pub fn backup_full(backup_dir: &str) -> Result<(), AppError> {
    println!("[BACKUP] 💾 Creating FULL backup to: {}", backup_dir);
    
    let backup_path = Path::new(backup_dir);
    
    // Create backup directory if it doesn't exist
    fs::create_dir_all(backup_path)
        .map_err(|e| AppError::DatabaseError(format!("Erreur création dossier: {}", e)))?;
    
    // 1. Backup database
    let db_backup_path = backup_path.join(&CONFIG.database.filename);
    backup_database(db_backup_path.to_str().unwrap())?;
    
    // 2. Backup uploads folder
    let uploads_src = std::env::current_dir().unwrap().join("uploads");
    let uploads_dst = backup_path.join("uploads");
    
    if uploads_src.exists() {
        println!("[BACKUP] 📁 Copying uploads folder...");
        copy_dir_recursive(&uploads_src, &uploads_dst)?;
        println!("[BACKUP] ✅ Uploads folder copied");
    } else {
        println!("[BACKUP] ⚠️ No uploads folder found, skipping");
    }
    
    println!("[BACKUP] ✅ Full backup completed!");
    Ok(())
}

/// Helper: Recursively copy a directory
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), AppError> {
    if !dst.exists() {
        fs::create_dir_all(dst)
            .map_err(|e| AppError::DatabaseError(format!("Erreur création dossier: {}", e)))?;
    }
    
    for entry in fs::read_dir(src)
        .map_err(|e| AppError::DatabaseError(format!("Erreur lecture dossier: {}", e)))? 
    {
        let entry = entry.map_err(|e| AppError::DatabaseError(format!("Erreur entrée: {}", e)))?;
        let path = entry.path();
        let dest_path = dst.join(entry.file_name());
        
        if path.is_dir() {
            copy_dir_recursive(&path, &dest_path)?;
        } else {
            fs::copy(&path, &dest_path)
                .map_err(|e| AppError::DatabaseError(format!("Erreur copie fichier: {}", e)))?;
        }
    }
    
    Ok(())
}

