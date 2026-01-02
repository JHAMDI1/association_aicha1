use crate::database::get_connection;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rusqlite::params;
use crate::config::CONFIG;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Classe {
    pub id: String,
    pub nom: String,
    pub niveau_id: String,
    pub enseignant_id: Option<String>,
    pub annee_scolaire: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClasseListItem {
    pub id: String,
    pub nom: String,
    pub niveau_nom: String,
    pub enseignant_nom: Option<String>,
    pub annee_scolaire: String,
    pub count_eleves: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateClasseRequest {
    pub nom: String,
    pub niveau_id: String,
    pub enseignant_id: Option<String>,
    pub annee_scolaire: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateClasseRequest {
    pub nom: Option<String>,
    pub niveau_id: Option<String>,
    pub enseignant_id: Option<String>,
    pub annee_scolaire: Option<String>,
}

pub fn get_all_classes() -> Result<Vec<ClasseListItem>, AppError> {
    let conn = get_connection();
    
    let query = r#"
        SELECT c.id, c.nom, n.nom as niveau_nom, 
               e.nom || ' ' || e.prenom as enseignant_nom,
               c.annee_scolaire,
               (SELECT COUNT(*) FROM inscriptions i WHERE i.classe_id = c.id AND i.active = 1) as count_eleves
        FROM classes c
        JOIN niveaux n ON c.niveau_id = n.id
        LEFT JOIN enseignants e ON c.enseignant_id = e.id
        ORDER BY n.ordre, c.nom
    "#;
    
    let mut stmt = conn.prepare(query)?;
    
    let classes = stmt.query_map([], |row| {
        Ok(ClasseListItem {
            id: row.get(0)?,
            nom: row.get(1)?,
            niveau_nom: row.get(2)?,
            enseignant_nom: row.get(3)?,
            annee_scolaire: row.get(4)?,
            count_eleves: row.get(5)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(classes)
}

// Helper function to avoid deadlock when connection is already held
fn get_classe_by_id_internal(conn: &rusqlite::Connection, id: &str) -> Result<Classe, AppError> {
    conn.query_row(
        "SELECT id, nom, niveau_id, enseignant_id, annee_scolaire, created_at FROM classes WHERE id = ?",
        [id],
        |row| {
            Ok(Classe {
                id: row.get(0)?,
                nom: row.get(1)?,
                niveau_id: row.get(2)?,
                enseignant_id: row.get(3)?,
                annee_scolaire: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )
    .map_err(|_| AppError::NotFound("Classe non trouvée".to_string()))
}

pub fn get_classe_by_id(id: &str) -> Result<Classe, AppError> {
    let conn = get_connection();
    get_classe_by_id_internal(&conn, id)
}

pub fn create_classe(req: CreateClasseRequest) -> Result<Classe, AppError> {
    let conn = get_connection();
    let id = Uuid::new_v4().to_string();
    let annee = req.annee_scolaire.unwrap_or_else(|| CONFIG.app.annee_scolaire.clone());
    
    conn.execute(
        "INSERT INTO classes (id, nom, niveau_id, enseignant_id, annee_scolaire) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, req.nom, req.niveau_id, req.enseignant_id, annee],
    )?;
    
    // Use internal function to reuse connection
    get_classe_by_id_internal(&conn, &id)
}

pub fn update_classe(id: &str, req: UpdateClasseRequest) -> Result<Classe, AppError> {
    let conn = get_connection();
    // Check existence using internal function
    get_classe_by_id_internal(&conn, id)?;
    
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(nom) = &req.nom {
        updates.push("nom = ?");
        params.push(Box::new(nom.clone()));
    }
    if let Some(niveau_id) = &req.niveau_id {
        updates.push("niveau_id = ?");
        params.push(Box::new(niveau_id.clone()));
    }
    if let Some(enseignant_id) = &req.enseignant_id {
        updates.push("enseignant_id = ?");
        params.push(Box::new(enseignant_id.clone()));
    }
    if let Some(annee) = &req.annee_scolaire {
        updates.push("annee_scolaire = ?");
        params.push(Box::new(annee.clone()));
    }
    
    if updates.is_empty() {
        return get_classe_by_id_internal(&conn, id);
    }
    
    let query = format!("UPDATE classes SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id.to_string()));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    conn.execute(&query, params_refs.as_slice())?;
    
    get_classe_by_id_internal(&conn, id)
}

pub fn delete_classe(id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM inscriptions WHERE classe_id = ?",
        [id],
        |row| row.get(0),
    ).unwrap_or(0);
    
    if count > 0 {
        return Err(AppError::ValidationError("Impossible de supprimer cette classe car elle contient des élèves.".to_string()));
    }
    
    let rows = conn.execute("DELETE FROM classes WHERE id = ?", [id])?;
    
    if rows == 0 {
        return Err(AppError::NotFound("Classe non trouvée".to_string()));
    }
    
    Ok(())
}
