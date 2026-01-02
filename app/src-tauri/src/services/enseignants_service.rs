use crate::database::get_connection;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rusqlite::params;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Enseignant {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub tel: Option<String>,
    pub email: Option<String>,
    pub specialite: Option<String>,
    pub actif: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEnseignantRequest {
    pub nom: String,
    pub prenom: String,
    pub tel: Option<String>,
    pub email: Option<String>,
    pub specialite: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEnseignantRequest {
    pub nom: Option<String>,
    pub prenom: Option<String>,
    pub tel: Option<String>,
    pub email: Option<String>,
    pub specialite: Option<String>,
    pub actif: Option<bool>,
}

pub fn get_all_enseignants(search: Option<String>) -> Result<Vec<Enseignant>, AppError> {
    let conn = get_connection();
    
    let query = if search.is_some() {
        "SELECT id, nom, prenom, tel, email, specialite, actif, created_at FROM enseignants 
         WHERE deleted_at IS NULL AND (nom LIKE ?1 OR prenom LIKE ?1 OR specialite LIKE ?1)
         ORDER BY nom, prenom"
    } else {
        "SELECT id, nom, prenom, tel, email, specialite, actif, created_at FROM enseignants 
         WHERE deleted_at IS NULL
         ORDER BY nom, prenom"
    };
    
    let mut stmt = conn.prepare(query)?;
    
    let enseignants = if let Some(ref s) = search {
        let pattern = format!("%{}%", s);
        stmt.query_map([&pattern], map_enseignant)?
    } else {
        stmt.query_map([], map_enseignant)?
    };
    
    enseignants.collect::<Result<Vec<_>, _>>().map_err(AppError::from)
}

fn map_enseignant(row: &rusqlite::Row) -> rusqlite::Result<Enseignant> {
    Ok(Enseignant {
        id: row.get(0)?,
        nom: row.get(1)?,
        prenom: row.get(2)?,
        tel: row.get(3)?,
        email: row.get(4)?,
        specialite: row.get(5)?,
        actif: row.get(6)?,
        created_at: row.get(7)?,
    })
}

pub fn get_enseignant_by_id(id: &str) -> Result<Enseignant, AppError> {
    let conn = get_connection();
    conn.query_row(
        "SELECT id, nom, prenom, tel, email, specialite, actif, created_at FROM enseignants WHERE id = ? AND deleted_at IS NULL",
        [id],
        map_enseignant,
    )
    .map_err(|_| AppError::NotFound("Enseignant non trouvé".to_string()))
}

pub fn create_enseignant(req: CreateEnseignantRequest) -> Result<Enseignant, AppError> {
    let conn = get_connection();
    let id = Uuid::new_v4().to_string();
    
    conn.execute(
        "INSERT INTO enseignants (id, nom, prenom, tel, email, specialite) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, req.nom, req.prenom, req.tel, req.email, req.specialite],
    )?;
    
    get_enseignant_by_id(&id)
}

pub fn update_enseignant(id: &str, req: UpdateEnseignantRequest) -> Result<Enseignant, AppError> {
    let conn = get_connection();
    
    // Check existence
    get_enseignant_by_id(id)?;
    
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
    if let Some(tel) = &req.tel {
        updates.push("tel = ?");
        params.push(Box::new(tel.clone()));
    }
    if let Some(email) = &req.email {
        updates.push("email = ?");
        params.push(Box::new(email.clone()));
    }
    if let Some(specialite) = &req.specialite {
        updates.push("specialite = ?");
        params.push(Box::new(specialite.clone()));
    }
    if let Some(actif) = &req.actif {
        updates.push("actif = ?");
        params.push(Box::new(*actif));
    }
    
    if updates.is_empty() {
        return get_enseignant_by_id(id);
    }
    
    updates.push("updated_at = datetime('now')");
    
    let query = format!("UPDATE enseignants SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id.to_string()));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    conn.execute(&query, params_refs.as_slice())?;
    
    get_enseignant_by_id(id)
}

pub fn delete_enseignant(id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    // Check if assigned to any class
    let _count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM classes WHERE enseignant_id = ?",
        [id],
        |row| row.get(0),
    ).unwrap_or(0);
    
    // Normally should block or warn, but let's just Soft Delete.
    // However, if we delete the teacher, the class loses its teacher.
    // In a real app we might want to set enseignant_id to NULL in classes.
    // But for a simple association app, keeping the link is fine, just allow soft delete.
    
    let rows = conn.execute(
        "UPDATE enseignants SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL", 
        [id]
    )?;
    
    if rows == 0 {
        return Err(AppError::NotFound("Enseignant non trouvé".to_string()));
    }
    
    Ok(())
}
