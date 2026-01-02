// Donneurs Service - CRUD for external donors
// Sprint 6: Dons & Donneurs

use crate::database::get_connection;
use crate::errors::AppError;
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==========================================
// TYPES
// ==========================================

#[derive(Debug, Serialize, Clone)]
pub struct Donneur {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub telephone: Option<String>,
    pub email: Option<String>,
    pub adresse: Option<String>,
    pub commentaire: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct DonneurListItem {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub telephone: Option<String>,
    pub email: Option<String>,
    pub total_dons: f64,
    pub nombre_dons: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateDonneurRequest {
    pub nom: String,
    pub prenom: String,
    pub telephone: Option<String>,
    pub email: Option<String>,
    pub adresse: Option<String>,
    pub commentaire: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct UpdateDonneurRequest {
    pub nom: Option<String>,
    pub prenom: Option<String>,
    pub telephone: Option<String>,
    pub email: Option<String>,
    pub adresse: Option<String>,
    pub commentaire: Option<String>,
}

// ==========================================
// INTERNAL HELPERS
// ==========================================

fn get_donneur_by_id_internal(conn: &rusqlite::Connection, id: &str) -> Result<Donneur, AppError> {
    conn.query_row(
        r#"
        SELECT id, nom, prenom, telephone, email, adresse, commentaire, created_at
        FROM donneurs
        WHERE id = ?
        "#,
        params![id],
        |row| {
            Ok(Donneur {
                id: row.get(0)?,
                nom: row.get(1)?,
                prenom: row.get(2)?,
                telephone: row.get(3)?,
                email: row.get(4)?,
                adresse: row.get(5)?,
                commentaire: row.get(6)?,
                created_at: row.get(7)?,
            })
        }
    ).map_err(|_| AppError::NotFound("Donneur non trouvé".to_string()))
}

// ==========================================
// PUBLIC API
// ==========================================

/// Get all donors with total donations info
pub fn get_all_donneurs() -> Result<Vec<DonneurListItem>, AppError> {
    println!("[DONNEURS] 🔵 Fetching all donneurs");
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT d.id, d.nom, d.prenom, d.telephone, d.email,
               COALESCE(SUM(r.montant_total), 0) as total_dons,
               COUNT(r.id) as nombre_dons
        FROM donneurs d
        LEFT JOIN recus r ON r.donneur_id = d.id AND r.etat = 'VALIDE'
        GROUP BY d.id
        ORDER BY d.nom, d.prenom
        "#
    )?;
    
    let donneurs = stmt.query_map([], |row| {
        Ok(DonneurListItem {
            id: row.get(0)?,
            nom: row.get(1)?,
            prenom: row.get(2)?,
            telephone: row.get(3)?,
            email: row.get(4)?,
            total_dons: row.get(5)?,
            nombre_dons: row.get(6)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[DONNEURS] ✅ Found {} donneurs", donneurs.len());
    Ok(donneurs)
}

/// Get a single donor by ID
pub fn get_donneur_by_id(id: &str) -> Result<Donneur, AppError> {
    println!("[DONNEURS] 🔍 Getting donneur: {}", id);
    let conn = get_connection();
    get_donneur_by_id_internal(&conn, id)
}

/// Create a new donor
pub fn create_donneur(req: CreateDonneurRequest) -> Result<Donneur, AppError> {
    println!("[DONNEURS] 🔵 Creating donneur: {} {}", req.prenom, req.nom);
    
    let conn = get_connection();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        r#"
        INSERT INTO donneurs (id, nom, prenom, telephone, email, adresse, commentaire, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        params![id, req.nom, req.prenom, req.telephone, req.email, req.adresse, req.commentaire, now]
    )?;
    
    println!("[DONNEURS] ✅ Donneur created: {}", id);
    get_donneur_by_id_internal(&conn, &id)
}

/// Update an existing donor
pub fn update_donneur(id: &str, req: UpdateDonneurRequest) -> Result<Donneur, AppError> {
    println!("[DONNEURS] 📝 Updating donneur: {}", id);
    
    let conn = get_connection();
    
    // Verify exists
    let _ = get_donneur_by_id_internal(&conn, id)?;
    
    // Build dynamic update
    let mut updates = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(nom) = req.nom {
        updates.push("nom = ?");
        values.push(Box::new(nom));
    }
    if let Some(prenom) = req.prenom {
        updates.push("prenom = ?");
        values.push(Box::new(prenom));
    }
    if let Some(telephone) = req.telephone {
        updates.push("telephone = ?");
        values.push(Box::new(telephone));
    }
    if let Some(email) = req.email {
        updates.push("email = ?");
        values.push(Box::new(email));
    }
    if let Some(adresse) = req.adresse {
        updates.push("adresse = ?");
        values.push(Box::new(adresse));
    }
    if let Some(commentaire) = req.commentaire {
        updates.push("commentaire = ?");
        values.push(Box::new(commentaire));
    }
    
    if !updates.is_empty() {
        let sql = format!("UPDATE donneurs SET {} WHERE id = ?", updates.join(", "));
        values.push(Box::new(id.to_string()));
        
        let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v.as_ref()).collect();
        conn.execute(&sql, params.as_slice())?;
    }
    
    println!("[DONNEURS] ✅ Donneur updated: {}", id);
    get_donneur_by_id_internal(&conn, id)
}

/// Delete a donor
pub fn delete_donneur(id: &str) -> Result<String, AppError> {
    println!("[DONNEURS] 🗑️ Deleting donneur: {}", id);
    
    let conn = get_connection();
    
    // Verify exists
    let _ = get_donneur_by_id_internal(&conn, id)?;
    
    // Check if has donations - prevent deletion if so
    let has_dons: i32 = conn.query_row(
        "SELECT COUNT(*) FROM recus WHERE donneur_id = ?",
        params![id],
        |row| row.get(0)
    )?;
    
    if has_dons > 0 {
        return Err(AppError::ValidationError(
            "Impossible de supprimer un donneur ayant des dons enregistrés".to_string()
        ));
    }
    
    conn.execute("DELETE FROM donneurs WHERE id = ?", params![id])?;
    
    println!("[DONNEURS] ✅ Donneur deleted: {}", id);
    Ok(id.to_string())
}

/// Search donors by name (for autocomplete)
pub fn search_donneurs(query: &str) -> Result<Vec<DonneurListItem>, AppError> {
    println!("[DONNEURS] 🔍 Searching: {}", query);
    let conn = get_connection();
    
    let search_pattern = format!("%{}%", query);
    
    let mut stmt = conn.prepare(
        r#"
        SELECT d.id, d.nom, d.prenom, d.telephone, d.email,
               COALESCE(SUM(r.montant_total), 0) as total_dons,
               COUNT(r.id) as nombre_dons
        FROM donneurs d
        LEFT JOIN recus r ON r.donneur_id = d.id AND r.etat = 'VALIDE'
        WHERE d.nom LIKE ? OR d.prenom LIKE ?
        GROUP BY d.id
        ORDER BY d.nom, d.prenom
        LIMIT 10
        "#
    )?;
    
    let donneurs = stmt.query_map(params![&search_pattern, &search_pattern], |row| {
        Ok(DonneurListItem {
            id: row.get(0)?,
            nom: row.get(1)?,
            prenom: row.get(2)?,
            telephone: row.get(3)?,
            email: row.get(4)?,
            total_dons: row.get(5)?,
            nombre_dons: row.get(6)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[DONNEURS] ✅ Found {} results", donneurs.len());
    Ok(donneurs)
}
