use crate::database::get_connection;
use crate::errors::AppError;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==========================================
// TYPES & STRUCTURES
// ==========================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Inscription {
    pub id: String,
    pub eleve_id: String,
    pub classe_id: String,
    pub date_inscription: String,
    pub active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InscriptionDetail {
    pub id: String,
    pub eleve_id: String,
    pub eleve_nom: String,
    pub eleve_prenom: String,
    pub eleve_photo: Option<String>,
    pub classe_id: String,
    pub classe_nom: String,
    pub niveau_nom: String,
    pub date_inscription: String,
    pub active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EleveInClasse {
    pub id: String,
    pub eleve_id: String,
    pub eleve_nom: String,
    pub eleve_prenom: String,
    pub eleve_photo: Option<String>,
    pub date_inscription: String,
}

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/// Get active inscription for a student
pub fn get_inscription_by_eleve(eleve_id: &str) -> Result<Option<InscriptionDetail>, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT i.id, i.eleve_id, e.nom, e.prenom, e.photo_path,
               i.classe_id, c.nom, n.nom, i.date_inscription, i.active
        FROM inscriptions i
        JOIN eleves e ON i.eleve_id = e.id
        JOIN classes c ON i.classe_id = c.id
        JOIN niveaux n ON c.niveau_id = n.id
        WHERE i.eleve_id = ? AND i.active = 1
        "#
    )?;
    
    let result = stmt.query_row(params![eleve_id], |row| {
        Ok(InscriptionDetail {
            id: row.get(0)?,
            eleve_id: row.get(1)?,
            eleve_nom: row.get(2)?,
            eleve_prenom: row.get(3)?,
            eleve_photo: row.get(4)?,
            classe_id: row.get(5)?,
            classe_nom: row.get(6)?,
            niveau_nom: row.get(7)?,
            date_inscription: row.get(8)?,
            active: row.get::<_, i32>(9)? == 1,
        })
    });
    
    match result {
        Ok(inscription) => Ok(Some(inscription)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::DatabaseError(e.to_string())),
    }
}

/// Get all students inscribed in a class
pub fn get_inscriptions_by_classe(classe_id: &str) -> Result<Vec<EleveInClasse>, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT i.id, i.eleve_id, e.nom, e.prenom, e.photo_path, i.date_inscription
        FROM inscriptions i
        JOIN eleves e ON i.eleve_id = e.id
        WHERE i.classe_id = ? AND i.active = 1 AND e.deleted_at IS NULL
        ORDER BY e.nom, e.prenom
        "#
    )?;
    
    let eleves = stmt.query_map(params![classe_id], |row| {
        Ok(EleveInClasse {
            id: row.get(0)?,
            eleve_id: row.get(1)?,
            eleve_nom: row.get(2)?,
            eleve_prenom: row.get(3)?,
            eleve_photo: row.get(4)?,
            date_inscription: row.get(5)?,
        })
    })?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(eleves)
}

/// Create a new inscription (student -> class)
pub fn create_inscription(eleve_id: &str, classe_id: &str) -> Result<Inscription, AppError> {
    let conn = get_connection();
    
    // Deactivate any existing active inscription for this student
    conn.execute(
        "UPDATE inscriptions SET active = 0 WHERE eleve_id = ? AND active = 1",
        params![eleve_id]
    )?;
    
    // Create new inscription
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        r#"
        INSERT INTO inscriptions (id, eleve_id, classe_id, date_inscription, active)
        VALUES (?, ?, ?, ?, 1)
        "#,
        params![id, eleve_id, classe_id, now]
    )?;
    
    Ok(Inscription {
        id,
        eleve_id: eleve_id.to_string(),
        classe_id: classe_id.to_string(),
        date_inscription: now,
        active: true,
    })
}

/// Delete an inscription
pub fn delete_inscription(id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    let affected = conn.execute(
        "DELETE FROM inscriptions WHERE id = ?",
        params![id]
    )?;
    
    if affected == 0 {
        return Err(AppError::NotFound("Inscription non trouvée".to_string()));
    }
    
    Ok(())
}

/// Update student's class (change class)
pub fn update_inscription_classe(eleve_id: &str, new_classe_id: &str) -> Result<Inscription, AppError> {
    // Simply create a new inscription which will deactivate the old one
    create_inscription(eleve_id, new_classe_id)
}

/// Get all classes for dropdown
pub fn get_all_classes_for_select() -> Result<Vec<(String, String, String)>, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT c.id, c.nom, n.nom
        FROM classes c
        JOIN niveaux n ON c.niveau_id = n.id
        ORDER BY n.ordre, c.nom
        "#
    )?;
    
    let classes = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
    })?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(classes)
}
