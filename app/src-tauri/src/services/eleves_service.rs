use crate::database::get_connection;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::fs;
use std::path::PathBuf;
use base64::{Engine as _, engine::general_purpose};
use rusqlite::params;
use chrono::{Datelike, Local};

/// Élève entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Eleve {
    pub id: String,
    pub code_matricule: String,
    pub nom: String,
    pub prenom: String,
    pub date_naissance: Option<String>,
    pub sexe: Option<String>,
    pub photo_path: Option<String>,
    pub tuteur_nom: Option<String>,
    pub tuteur_tel: Option<String>,
    pub tuteur_cin: Option<String>,
    pub adresse: Option<String>,
    pub created_at: String,
}

/// Élève with class info (for list view)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EleveListItem {
    pub id: String,
    pub code_matricule: String,
    pub nom: String,
    pub prenom: String,
    pub photo_path: Option<String>,
    pub classe_nom: Option<String>,
    pub niveau_nom: Option<String>,
    pub has_late_payments: bool,
}

/// Create élève request
#[derive(Debug, Deserialize)]
pub struct CreateEleveRequest {
    pub nom: String,
    pub prenom: String,
    pub date_naissance: Option<String>,
    pub sexe: Option<String>,
    pub tuteur_nom: Option<String>,
    pub tuteur_tel: Option<String>,
    pub tuteur_cin: Option<String>,
    pub adresse: Option<String>,
}

/// Update élève request
#[derive(Debug, Deserialize)]
pub struct UpdateEleveRequest {
    pub nom: Option<String>,
    pub prenom: Option<String>,
    pub date_naissance: Option<String>,
    pub sexe: Option<String>,
    pub photo_path: Option<String>,
    pub tuteur_nom: Option<String>,
    pub tuteur_tel: Option<String>,
    pub tuteur_cin: Option<String>,
    pub adresse: Option<String>,
}

/// Generate a unique matricule code
fn generate_matricule() -> String {
    let year = chrono::Utc::now().format("%Y").to_string();
    let random: u32 = rand::random::<u32>() % 10000;
    format!("ELV-{}-{:04}", year, random)
}

/// Get all élèves with optional search
pub fn get_all_eleves(search: Option<String>) -> Result<Vec<EleveListItem>, AppError> {
    let conn = get_connection();
    
    let query = if search.is_some() {
        r#"
        SELECT e.id, e.code_matricule, e.nom, e.prenom, e.photo_path, 
               c.nom as classe_nom, n.nom as niveau_nom
        FROM eleves e
        LEFT JOIN inscriptions i ON e.id = i.eleve_id AND i.active = 1
        LEFT JOIN classes c ON i.classe_id = c.id
        LEFT JOIN niveaux n ON c.niveau_id = n.id
        WHERE e.deleted_at IS NULL 
          AND (e.nom LIKE ?1 OR e.prenom LIKE ?1 OR e.code_matricule LIKE ?1)
        ORDER BY e.nom, e.prenom
        "#
    } else {
        r#"
        SELECT e.id, e.code_matricule, e.nom, e.prenom, e.photo_path, 
               c.nom as classe_nom, n.nom as niveau_nom
        FROM eleves e
        LEFT JOIN inscriptions i ON e.id = i.eleve_id AND i.active = 1
        LEFT JOIN classes c ON i.classe_id = c.id
        LEFT JOIN niveaux n ON c.niveau_id = n.id
        WHERE e.deleted_at IS NULL
        ORDER BY e.nom, e.prenom
        "#
    };
    
    let mut stmt = conn.prepare(query)?;
    
    let eleves = if let Some(ref s) = search {
        let search_pattern = format!("%{}%", s);
        stmt.query_map([&search_pattern], |row| {
            let id: String = row.get(0)?;
            Ok(EleveListItem {
                id: id.clone(),
                code_matricule: row.get(1)?,
                nom: row.get(2)?,
                prenom: row.get(3)?,
                photo_path: row.get(4)?,
                classe_nom: row.get(5)?,
                niveau_nom: row.get(6)?,
                has_late_payments: false, // Will be set below
            })
        })?
        .collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            Ok(EleveListItem {
                id: id.clone(),
                code_matricule: row.get(1)?,
                nom: row.get(2)?,
                prenom: row.get(3)?,
                photo_path: row.get(4)?,
                classe_nom: row.get(5)?,
                niveau_nom: row.get(6)?,
                has_late_payments: false, // Will be set below
            })
        })?
        .collect::<Result<Vec<_>, _>>()?
    };
    
    // Optimize: Get all students with late payments in ONE query
    // Dynamic academic year calculation
    let now = Local::now();
    let current_month = now.month() as i32;
    let current_real_year = now.year();
    
    // Academic year: Sept 2025 to Aug 2026 = start_year 2025
    let start_year = if current_month >= 9 { current_real_year } else { current_real_year - 1 };
    let next_year = start_year + 1;
    
    // Determine which months SHOULD be paid by now
    // We only mark a month as "late" if it's in the PAST
    // Current month = Jan 2026 (month=1), academic months already passed = Sept(9), Oct(10), Nov(11), Dec(12)
    let months_should_be_paid: Vec<i32> = if current_month >= 9 {
        // Sept-Dec of current year (e.g., in Oct 2025: months 9, 10 are due)
        (9..=current_month).collect()
    } else {
        // Jan-Aug of next year (e.g., in Jan 2026: months 9,10,11,12 of 2025 + month 1 of 2026 is current, so only 9,10,11,12 are late)
        // But wait - current month itself is not late, only past months
        // If current_month=1, late months = 9,10,11,12 from start_year
        let past_first_half: Vec<i32> = vec![9, 10, 11, 12];
        let past_second_half: Vec<i32> = (1..current_month).collect();
        [past_first_half, past_second_half].concat()
    };
    
    println!("[ELEVES] 📊 Checking late payments. Year={}-{}, Months due: {:?}", start_year, next_year, months_should_be_paid);
    
    // If no months should be paid yet (e.g., it's September and we just started), no one is late
    if months_should_be_paid.is_empty() {
        return Ok(eleves);
    }
    
    // Build dynamic query for checking late payments
    // A student is late if ANY of the expected months is missing payment
    let mut late_stmt = conn.prepare(
        r#"
        SELECT DISTINCT e.id
        FROM eleves e
        WHERE e.deleted_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM (SELECT 9 as mois UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
                  UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                  UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) m
            WHERE 
                ((m.mois >= 9 AND m.mois <= 12 AND ? <= 12 AND m.mois <= ?) OR
                 (m.mois >= 9 AND m.mois <= 12 AND ? < 9) OR
                 (m.mois >= 1 AND m.mois < ? AND ? < 9))
                AND NOT EXISTS (
                    SELECT 1 FROM lignes_paiement lp
                    JOIN recus r ON lp.recu_id = r.id
                    WHERE lp.eleve_id = e.id
                    AND r.etat = 'VALIDE'
                    AND r.type_paiement = 'MENSUALITE'
                    AND lp.mois = m.mois
                    AND (
                        (lp.mois >= 9 AND lp.annee = ?) OR
                        (lp.mois < 9 AND lp.annee = ?)
                    )
                )
        )
        "#,
    )?;
    
    let late_student_ids: Vec<String> = late_stmt
        .query_map(params![current_month, current_month, current_month, current_month, current_month, start_year, next_year], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    // Update has_late_payments for matching students
    let eleves_with_status: Vec<EleveListItem> = eleves
        .into_iter()
        .map(|mut eleve| {
            eleve.has_late_payments = late_student_ids.contains(&eleve.id);
            eleve
        })
        .collect();
    
    Ok(eleves_with_status)
}

/// Get élève by ID
pub fn get_eleve_by_id(id: &str) -> Result<Eleve, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"SELECT id, code_matricule, nom, prenom, date_naissance, sexe, photo_path,
                  tuteur_nom, tuteur_tel, tuteur_cin, adresse, created_at
           FROM eleves WHERE id = ? AND deleted_at IS NULL"#
    )?;
    
    let eleve = stmt.query_row([id], |row| {
        Ok(Eleve {
            id: row.get(0)?,
            code_matricule: row.get(1)?,
            nom: row.get(2)?,
            prenom: row.get(3)?,
            date_naissance: row.get(4)?,
            sexe: row.get(5)?,
            photo_path: row.get(6)?,
            tuteur_nom: row.get(7)?,
            tuteur_tel: row.get(8)?,
            tuteur_cin: row.get(9)?,
            adresse: row.get(10)?,
            created_at: row.get(11)?,
        })
    }).map_err(|_| AppError::NotFound("Élève non trouvé".to_string()))?;
    
    Ok(eleve)
}

/// Create a new élève
pub fn create_eleve(req: CreateEleveRequest) -> Result<Eleve, AppError> {
    let conn = get_connection();
    
    let id = Uuid::new_v4().to_string();
    let matricule = generate_matricule();
    
    conn.execute(
        r#"INSERT INTO eleves (id, code_matricule, nom, prenom, date_naissance, sexe, 
                               tuteur_nom, tuteur_tel, tuteur_cin, adresse)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        rusqlite::params![
            id, matricule, req.nom, req.prenom, req.date_naissance, req.sexe,
            req.tuteur_nom, req.tuteur_tel, req.tuteur_cin, req.adresse
        ]
    )?;
    
    get_eleve_by_id(&id)
}

/// Update an existing élève
pub fn update_eleve(id: &str, req: UpdateEleveRequest) -> Result<Eleve, AppError> {
    let conn = get_connection();
    
    // Check if élève exists
    let _existing = get_eleve_by_id(id)?;
    
    // Build dynamic update query
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
    if let Some(date_naissance) = &req.date_naissance {
        updates.push("date_naissance = ?");
        params.push(Box::new(date_naissance.clone()));
    }
    if let Some(sexe) = &req.sexe {
        updates.push("sexe = ?");
        params.push(Box::new(sexe.clone()));
    }
    if let Some(photo_path) = &req.photo_path {
        updates.push("photo_path = ?");
        params.push(Box::new(photo_path.clone()));
    }
    if let Some(tuteur_nom) = &req.tuteur_nom {
        updates.push("tuteur_nom = ?");
        params.push(Box::new(tuteur_nom.clone()));
    }
    if let Some(tuteur_tel) = &req.tuteur_tel {
        updates.push("tuteur_tel = ?");
        params.push(Box::new(tuteur_tel.clone()));
    }
    if let Some(tuteur_cin) = &req.tuteur_cin {
        updates.push("tuteur_cin = ?");
        params.push(Box::new(tuteur_cin.clone()));
    }
    if let Some(adresse) = &req.adresse {
        updates.push("adresse = ?");
        params.push(Box::new(adresse.clone()));
    }
    
    if updates.is_empty() {
        return get_eleve_by_id(id);
    }
    
    updates.push("updated_at = datetime('now')");
    
    let query = format!("UPDATE eleves SET {} WHERE id = ?", updates.join(", "));
    params.push(Box::new(id.to_string()));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&query, params_refs.as_slice())?;
    
    get_eleve_by_id(id)
}

/// Soft delete an élève
pub fn delete_eleve(id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    let rows = conn.execute(
        "UPDATE eleves SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
        [id]
    )?;
    
    if rows == 0 {
        return Err(AppError::NotFound("Élève non trouvé".to_string()));
    }
    
    println!("[ELEVES] ✅ Élève deleted: {}", id);
    Ok(())
}

/// Get list of paid months for a student in current year
pub fn get_paid_months(eleve_id: &str) -> Result<Vec<i32>, AppError> {
    println!("[ELEVES] 📅 Getting paid months for eleve: {}", eleve_id);
    
    let conn = get_connection();
    
    // Determine current academic year based on today's date
    let now = Local::now();
    let month = now.month();
    let year = now.year();
    let start_year = if month >= 9 { year } else { year - 1 };
    let next_year = start_year + 1;
    let annee_scolaire = format!("{}-{}", start_year, next_year);
    
    println!("[ELEVES] 🔍 Checking payments for academic year: {} (Start Year: {})", annee_scolaire, start_year);
    
    let mut stmt = conn.prepare(
        r#"
        SELECT DISTINCT lp.mois
        FROM lignes_paiement lp
        JOIN recus r ON lp.recu_id = r.id
        WHERE lp.eleve_id = ?
        AND r.etat = 'VALIDE'
        AND r.type_paiement = 'MENSUALITE'
        AND (
            (lp.annee = ? AND lp.mois >= 9) OR
            (lp.annee = ? AND lp.mois <= 8)
        )
        ORDER BY lp.mois
        "#,
    )?;
    
    let months = stmt.query_map(params![eleve_id, start_year, next_year], |row| {
        row.get(0)
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[ELEVES] ✅ Found {} paid months for year {}", months.len(), annee_scolaire);
    Ok(months)
}

// has_late_payments function removed as it was unused and inefficient in loop context
// Late status is now calculated in bulk query in get_all_eleves

fn get_photos_dir() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("photos");
    path
}

pub fn upload_photo(eleve_id: &str, photo_base64: &str) -> Result<String, AppError> {
    // 1. Decode base64
    // Usually base64 string comes with "data:image/png;base64," prefix. We need to strip it.
    let parts: Vec<&str> = photo_base64.split(",").collect();
    let clean_base64 = if parts.len() > 1 { parts[1] } else { parts[0] };
    
    let bytes = general_purpose::STANDARD
        .decode(clean_base64)
        .map_err(|e| AppError::InternalError(format!("Failed to decode base64: {}", e)))?;

    // 2. Determine file extension (simple check)
    // In a real app, use the `image` crate or check magic bytes
    let extension = if photo_base64.contains("image/png") { "png" } else { "jpg" };
    
    // 3. Create photos directory if not exists
    let photos_dir = get_photos_dir();
    if !photos_dir.exists() {
        fs::create_dir_all(&photos_dir).map_err(|e| AppError::InternalError(format!("Failed to create photos dir: {}", e)))?;
    }

    // 4. Generate unique filename
    let filename = format!("{}_{}.{}", eleve_id, Uuid::new_v4(), extension);
    let file_path = photos_dir.join(&filename);

    // 5. Save file
    fs::write(&file_path, bytes).map_err(|e| AppError::InternalError(format!("Failed to save photo: {}", e)))?;

    // 6. Return relative path or file URL
    // For Tauri to read it, we might need a custom protocol or just return the absolute path to use with `convertFileSrc`
    // Let's store the filename
    let stored_path = format!("photos/{}", filename);
    
    // 7. Update database
    let conn = get_connection();
    conn.execute(
        "UPDATE eleves SET photo_path = ?, updated_at = datetime('now') WHERE id = ?",
        params![stored_path, eleve_id]
    )?;

    Ok(stored_path)
}
