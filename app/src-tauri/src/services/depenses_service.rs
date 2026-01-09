use crate::database::get_connection;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rusqlite::params;
use chrono::Utc;

// ==========================================
// TYPES
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Depense {
    pub id: String,
    pub numero: String,
    pub date_operation: String,
    pub beneficiaire: String,
    pub motif: Option<String>,
    pub montant: f64,
    pub type_depense: String,
    pub piece_jointe_path: Option<String>,
    pub etat: String,
    pub cree_par: String,
    pub valide_par: Option<String>,
    pub date_validation: Option<String>,
    pub commentaire: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepenseListItem {
    pub id: String,
    pub numero: String,
    pub date_operation: String,
    pub beneficiaire: String,
    pub motif: Option<String>,
    pub montant: f64,
    pub type_depense: String,
    pub etat: String,
    pub cree_par_nom: String,
    pub has_piece_jointe: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateDepenseRequest {
    pub beneficiaire: String,
    pub motif: Option<String>,
    pub montant: f64,
    pub type_depense: String,  // FACTURE, AUTRE
    pub commentaire: Option<String>,
    pub date_operation: Option<String>, // Custom invoice date
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct UpdateDepenseRequest {
    pub beneficiaire: Option<String>,
    pub motif: Option<String>,
    pub montant: Option<f64>,
    pub type_depense: Option<String>,
    pub commentaire: Option<String>,
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

fn generate_depense_number(conn: &rusqlite::Connection) -> Result<String, AppError> {
    let year = Utc::now().format("%Y").to_string();
    
    let last_seq: Option<i32> = conn.query_row(
        "SELECT MAX(CAST(SUBSTR(numero, 6) AS INTEGER)) FROM depenses WHERE numero LIKE ?",
        params![format!("D{}%", year)],
        |row: &rusqlite::Row| row.get(0)
    ).ok().flatten();
    
    let next_seq = last_seq.unwrap_or(0) + 1;
    Ok(format!("D{}{:04}", year, next_seq))
}

fn get_depense_by_id_internal(conn: &rusqlite::Connection, id: &str) -> Result<Depense, AppError> {
    conn.query_row(
        r#"
        SELECT id, numero, date_operation, beneficiaire, motif, montant, type_depense,
               piece_jointe_path, etat, cree_par, valide_par, date_validation, commentaire, created_at
        FROM depenses WHERE id = ?
        "#,
        params![id],
        |row| {
            Ok(Depense {
                id: row.get(0)?,
                numero: row.get(1)?,
                date_operation: row.get(2)?,
                beneficiaire: row.get(3)?,
                motif: row.get(4)?,
                montant: row.get(5)?,
                type_depense: row.get(6)?,
                piece_jointe_path: row.get(7)?,
                etat: row.get(8)?,
                cree_par: row.get(9)?,
                valide_par: row.get(10)?,
                date_validation: row.get(11)?,
                commentaire: row.get(12)?,
                created_at: row.get(13)?,
            })
        }
    ).map_err(|_| AppError::NotFound("Dépense non trouvée".to_string()))
}

// ==========================================
// PUBLIC FUNCTIONS
// ==========================================

pub fn get_depense_by_id(id: &str) -> Result<Depense, AppError> {
    let conn = get_connection();
    get_depense_by_id_internal(&conn, id)
}

pub fn get_all_depenses(etat_filter: Option<String>) -> Result<Vec<DepenseListItem>, AppError> {
    let conn = get_connection();
    
    let query = if etat_filter.is_some() {
        r#"
        SELECT d.id, d.numero, d.date_operation, d.beneficiaire, d.motif, d.montant, 
               d.type_depense, d.etat, u.nom || ' ' || u.prenom as cree_par_nom,
               CASE WHEN d.piece_jointe_path IS NOT NULL THEN 1 ELSE 0 END as has_piece
        FROM depenses d
        JOIN users u ON d.cree_par = u.id
        WHERE d.etat = ?
        ORDER BY d.date_operation DESC
        LIMIT 100
        "#
    } else {
        r#"
        SELECT d.id, d.numero, d.date_operation, d.beneficiaire, d.motif, d.montant, 
               d.type_depense, d.etat, u.nom || ' ' || u.prenom as cree_par_nom,
               CASE WHEN d.piece_jointe_path IS NOT NULL THEN 1 ELSE 0 END as has_piece
        FROM depenses d
        JOIN users u ON d.cree_par = u.id
        ORDER BY d.date_operation DESC
        LIMIT 100
        "#
    };
    
    let mut stmt = conn.prepare(query)?;
    
    let depenses = if let Some(ref etat) = etat_filter {
        stmt.query_map(params![etat], |row| {
            Ok(DepenseListItem {
                id: row.get(0)?,
                numero: row.get(1)?,
                date_operation: row.get(2)?,
                beneficiaire: row.get(3)?,
                motif: row.get(4)?,
                montant: row.get(5)?,
                type_depense: row.get(6)?,
                etat: row.get(7)?,
                cree_par_nom: row.get(8)?,
                has_piece_jointe: row.get::<_, i32>(9)? == 1,
            })
        })?.collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map([], |row| {
            Ok(DepenseListItem {
                id: row.get(0)?,
                numero: row.get(1)?,
                date_operation: row.get(2)?,
                beneficiaire: row.get(3)?,
                motif: row.get(4)?,
                montant: row.get(5)?,
                type_depense: row.get(6)?,
                etat: row.get(7)?,
                cree_par_nom: row.get(8)?,
                has_piece_jointe: row.get::<_, i32>(9)? == 1,
            })
        })?.collect::<Result<Vec<_>, _>>()?
    };
    
    Ok(depenses)
}

use crate::services::audit_service;
use serde_json::json;

pub fn create_depense(req: CreateDepenseRequest, user_id: &str, is_admin: bool) -> Result<Depense, AppError> {
    println!("[DEPENSE] 🔵 Starting create_depense for user: {}, type: {}, montant: {}", user_id, req.type_depense, req.montant);
    
    let conn = get_connection();
    // ... existing logic ...
    
    let id = Uuid::new_v4().to_string();
    let numero = generate_depense_number(&conn)?;
    
    // Use provided date or current date
    let now = req.date_operation.clone().unwrap_or_else(|| Utc::now().format("%Y-%m-%d %H:%M:%S").to_string());
    
    // Admin-created expenses are auto-validated
    let etat = if is_admin { "VALIDE" } else { "EN_ATTENTE" };
    let valide_par = if is_admin { Some(user_id) } else { None };
    let date_validation = if is_admin { Some(now.clone()) } else { None };
    
    conn.execute(
        r#"
        INSERT INTO depenses (id, numero, date_operation, beneficiaire, motif, montant, 
                              type_depense, etat, cree_par, valide_par, date_validation, commentaire, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        params![
            id, numero, now, req.beneficiaire, req.motif, req.montant,
            req.type_depense, etat, user_id, valide_par, date_validation, req.commentaire, now
        ]
    )?;
    
    // Log action
    let _ = audit_service::log_action(
        user_id,
        "CREATION",
        "DEPENSE",
        Some(&id),
        Some(json!({
            "montant": req.montant,
            "numero": numero,
            "beneficiaire": req.beneficiaire
        }))
    );
    
    get_depense_by_id_internal(&conn, &id)
}

pub fn valider_depense(depense_id: &str, admin_id: &str) -> Result<Depense, AppError> {
    let conn = get_connection();
    
    // Verify expense exists and is pending
    let depense = get_depense_by_id_internal(&conn, depense_id)?;
    if depense.etat != "EN_ATTENTE" {
        return Err(AppError::ValidationError("Cette dépense n'est pas en attente de validation".to_string()));
    }
    
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE depenses SET etat = 'VALIDE', valide_par = ?, date_validation = ? WHERE id = ?",
        params![admin_id, now, depense_id]
    )?;
    
    // Log action
    let _ = audit_service::log_action(
        admin_id,
        "VALIDATION",
        "DEPENSE",
        Some(depense_id),
        None
    );
    
    get_depense_by_id_internal(&conn, depense_id)
}

pub fn rejeter_depense(depense_id: &str, admin_id: &str, motif_rejet: Option<String>) -> Result<Depense, AppError> {
    let conn = get_connection();
    
    // Verify expense exists and is pending
    let depense = get_depense_by_id_internal(&conn, depense_id)?;
    if depense.etat != "EN_ATTENTE" {
        return Err(AppError::ValidationError("Cette dépense n'est pas en attente de validation".to_string()));
    }
    
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let commentaire = motif_rejet.or(depense.commentaire);
    
    conn.execute(
        "UPDATE depenses SET etat = 'REJETE', valide_par = ?, date_validation = ?, commentaire = ? WHERE id = ?",
        params![admin_id, now, commentaire, depense_id]
    )?;
    
    // Log action
    let _ = audit_service::log_action(
        admin_id,
        "REJET",
        "DEPENSE",
        Some(depense_id),
        None
    );
    
    get_depense_by_id_internal(&conn, depense_id)
}

pub fn delete_depense(depense_id: &str, user_id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    // Only allow deleting draft or rejected expenses
    let depense = get_depense_by_id_internal(&conn, depense_id)?;
    if depense.etat == "VALIDE" {
        return Err(AppError::ValidationError("Impossible de supprimer une dépense validée".to_string()));
    }
    
    conn.execute("DELETE FROM depenses WHERE id = ?", params![depense_id])?;

    // Log action
    let _ = audit_service::log_action(
        user_id,
        "SUPPRESSION",
        "DEPENSE",
        Some(depense_id),
        None
    );

    Ok(())
}

pub fn upload_piece_jointe(depense_id: &str, file_base64: &str) -> Result<String, AppError> {
    use std::fs;
    use std::path::PathBuf;
    use base64::{Engine as _, engine::general_purpose};
    
    println!("[UPLOAD] Starting upload for depense_id: {}", depense_id);
    println!("[UPLOAD] Base64 length: {} chars", file_base64.len());
    
    // Decode base64
    let parts: Vec<&str> = file_base64.split(",").collect();
    let clean_base64 = if parts.len() > 1 { parts[1] } else { parts[0] };
    println!("[UPLOAD] Clean base64 length: {} chars", clean_base64.len());
    
    let bytes = general_purpose::STANDARD
        .decode(clean_base64)
        .map_err(|e| {
            println!("[UPLOAD ERROR] Failed to decode base64: {}", e);
            AppError::InternalError(format!("Failed to decode base64: {}", e))
        })?;
    
    println!("[UPLOAD] Decoded {} bytes", bytes.len());
    
    // Determine extension
    let extension = if file_base64.contains("image/png") { "png" } 
                   else if file_base64.contains("application/pdf") { "pdf" }
                   else { "jpg" };
    
    println!("[UPLOAD] Extension: {}", extension);
    
    // Use current_dir as base (same as database.rs for consistency)
    let base_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let uploads_dir = base_dir.join("uploads").join("preuves");
    
    println!("[UPLOAD] Base dir: {:?}", base_dir);
    println!("[UPLOAD] Uploads dir: {:?}", uploads_dir);
    
    if !uploads_dir.exists() {
        println!("[UPLOAD] Creating uploads directory...");
        fs::create_dir_all(&uploads_dir)
            .map_err(|e| {
                println!("[UPLOAD ERROR] Failed to create dir: {}", e);
                AppError::InternalError(format!("Failed to create uploads dir: {}", e))
            })?;
    }
    
    // Generate filename
    let filename = format!("{}_{}.{}", depense_id, Uuid::new_v4(), extension);
    let file_path = uploads_dir.join(&filename);
    
    println!("[UPLOAD] Saving to: {:?}", file_path);
    
    // Save file
    fs::write(&file_path, &bytes)
        .map_err(|e| {
            println!("[UPLOAD ERROR] Failed to write file: {}", e);
            AppError::InternalError(format!("Failed to save file: {}", e))
        })?;
    
    println!("[UPLOAD] File saved successfully!");
    
    // Store ABSOLUTE path in database for reliable retrieval
    let stored_path = file_path.to_string_lossy().to_string();
    println!("[UPLOAD] Updating database with path: {}", stored_path);
    
    let conn = get_connection();
    conn.execute(
        "UPDATE depenses SET piece_jointe_path = ? WHERE id = ?",
        params![stored_path, depense_id]
    )?;
    
    println!("[UPLOAD] Database updated successfully!");
    
    Ok(stored_path)
}

/// Get expense statistics for dashboard
pub fn get_depenses_stats() -> Result<DepenseStats, AppError> {
    let conn = get_connection();
    
    // Total validated this month
    let total_mois: f64 = conn.query_row(
        "SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE etat = 'VALIDE' AND strftime('%Y-%m', date_operation) = strftime('%Y-%m', 'now')",
        [],
        |row| row.get(0)
    ).unwrap_or(0.0);
    
    // Count pending
    let en_attente: i32 = conn.query_row(
        "SELECT COUNT(*) FROM depenses WHERE etat = 'EN_ATTENTE'",
        [],
        |row| row.get(0)
    ).unwrap_or(0);
    
    Ok(DepenseStats {
        total_mois,
        en_attente,
    })
}

#[derive(Debug, Serialize)]
pub struct DepenseStats {
    pub total_mois: f64,
    pub en_attente: i32,
}
