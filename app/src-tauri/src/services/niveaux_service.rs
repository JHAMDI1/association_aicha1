use crate::database::get_connection;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rusqlite::params;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Niveau {
    pub id: String,
    pub nom: String,
    pub ordre: i32,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateNiveauRequest {
    pub nom: String,
    pub ordre: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNiveauRequest {
    pub nom: Option<String>,
    pub ordre: Option<i32>,
}

pub fn get_all_niveaux() -> Result<Vec<Niveau>, AppError> {
    let conn = get_connection();
    let mut stmt = conn.prepare("SELECT id, nom, ordre, created_at FROM niveaux ORDER BY ordre ASC, nom ASC")?;
    
    let niveaux = stmt.query_map([], |row| {
        Ok(Niveau {
            id: row.get(0)?,
            nom: row.get(1)?,
            ordre: row.get(2)?,
            created_at: row.get(3)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(niveaux)
}

pub fn get_niveau_by_id(id: &str) -> Result<Niveau, AppError> {
    let conn = get_connection();
    conn.query_row(
        "SELECT id, nom, ordre, created_at FROM niveaux WHERE id = ?",
        [id],
        |row| {
            Ok(Niveau {
                id: row.get(0)?,
                nom: row.get(1)?,
                ordre: row.get(2)?,
                created_at: row.get(3)?,
            })
        },
    )
    .map_err(|_| AppError::NotFound("Niveau non trouvé".to_string()))
}

pub fn create_niveau(req: CreateNiveauRequest) -> Result<Niveau, AppError> {
    let conn = get_connection();
    let id = Uuid::new_v4().to_string();
    let ordre = req.ordre.unwrap_or(0);
    
    conn.execute(
        "INSERT INTO niveaux (id, nom, ordre) VALUES (?1, ?2, ?3)",
        params![id, req.nom, ordre],
    ).map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            AppError::ValidationError("Un niveau avec ce nom existe déjà".to_string())
        } else {
            AppError::DatabaseError(e.to_string())
        }
    })?;
    
    get_niveau_by_id(&id)
}

pub fn update_niveau(id: &str, req: UpdateNiveauRequest) -> Result<Niveau, AppError> {
    let conn = get_connection();
    
    // Check existence
    get_niveau_by_id(id)?;
    
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(nom) = &req.nom {
        updates.push("nom = ?");
        params.push(Box::new(nom.clone()));
    }
    
    if let Some(ordre) = &req.ordre {
        updates.push("ordre = ?");
        params.push(Box::new(*ordre));
    }
    
    if updates.is_empty() {
        return get_niveau_by_id(id);
    }
    
    let query = format!("UPDATE niveaux SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id.to_string()));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    conn.execute(&query, params_refs.as_slice()).map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            AppError::ValidationError("Un niveau avec ce nom existe déjà".to_string())
        } else {
            AppError::DatabaseError(e.to_string())
        }
    })?;
    
    get_niveau_by_id(id)
}

pub fn delete_niveau(id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    // Check if used in classes
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM classes WHERE niveau_id = ?",
        [id],
        |row| row.get(0),
    ).unwrap_or(0);
    
    if count > 0 {
        return Err(AppError::ValidationError("Impossible de supprimer ce niveau car il contient des classes.".to_string()));
    }
    
    let rows = conn.execute("DELETE FROM niveaux WHERE id = ?", [id])?;
    
    if rows == 0 {
        return Err(AppError::NotFound("Niveau non trouvé".to_string()));
    }
    
    Ok(())
}
