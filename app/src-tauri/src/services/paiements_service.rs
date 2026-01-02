use crate::database::get_connection;
use crate::errors::AppError;
use crate::config::CONFIG;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

// ==========================================
// TYPES & STRUCTURES
// ==========================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaiementStatus {
    pub eleve_id: String,
    pub annee: String,
    pub mois: Vec<MoisStatus>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MoisStatus {
    pub numero: i32,        // 1-12
    pub nom: String,        // "Septembre", "Octobre"...
    pub paye: bool,
    pub montant_du: f64,
    pub recu_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRecuRequest {
    pub eleve_id: String,
    pub type_paiement: String,  // MENSUALITE, INSCRIPTION, ASSURANCE, DON
    pub mois_payes: Vec<i32>,   // [9, 10, 11] for Sept, Oct, Nov
    pub annee: i32,
    pub montant_total: f64,     // Manual amount from user
    pub mode_paiement: String,  // ESPECES, CHEQUE, VIREMENT
    pub commentaire: Option<String>,
    pub numero_carnet: Option<String>,
    pub numero_recu_physique: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Recu {
    pub id: String,
    pub numero: String,
    pub date_operation: String,
    pub type_paiement: String,
    pub montant_total: f64,
    pub mode_paiement: String,
    pub eleve_id: Option<String>,
    pub user_id: String,
    pub etat: String,
    pub commentaire: Option<String>,
    pub numero_carnet: Option<String>,
    pub numero_recu_physique: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecuDetail {
    pub recu: Recu,
    pub eleve: Option<EleveInfo>,
    pub lignes: Vec<LignePaiement>,
    pub user_nom: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EleveInfo {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub code_matricule: String,
    pub classe_nom: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LignePaiement {
    pub id: String,
    pub mois: i32,
    pub annee: i32,
    pub montant: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecuListItem {
    pub id: String,
    pub numero: String,
    pub date_operation: String,
    pub type_paiement: String,
    pub montant_total: f64,
    pub eleve_nom: Option<String>,
    pub etat: String,
    pub numero_carnet: Option<String>,
    pub numero_recu_physique: Option<String>,
}

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/// Get payment status for a student for a given school year
pub fn get_paiement_status(eleve_id: &str, annee_scolaire: &str) -> Result<PaiementStatus, AppError> {
    println!("[PAYMENT_STATUS] 🔵 Getting status for eleve_id: {}, year: {}", eleve_id, annee_scolaire);
    let conn = get_connection();
    
    // Parse school year (e.g., "2025-2026" -> 2025)
    let year: i32 = annee_scolaire.split('-')
        .next()
        .and_then(|y| y.parse().ok())
        .unwrap_or(2025);
    
    let mensualite = CONFIG.paiements.mensualite_default;
    
    // Month names in French (school year: Sept=1, Aug=12)
    let mois_noms = vec![
        "Septembre", "Octobre", "Novembre", "Décembre",
        "Janvier", "Février", "Mars", "Avril",
        "Mai", "Juin", "Juillet", "Août"
    ];
    
    let mut mois_status = Vec::new();
    
    // Check each month (9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8)
    let mois_ordre = vec![9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
    
    for (idx, &mois) in mois_ordre.iter().enumerate() {
        // Determine the calendar year for this month
        let calendar_year = if mois >= 9 { year } else { year + 1 };
        
        // Check if this month is already paid
        let paid_check: Option<String> = conn.query_row(
            "SELECT recu_id FROM lignes_paiement WHERE eleve_id = ? AND mois = ? AND annee = ?",
            params![eleve_id, mois, calendar_year],
            |row| row.get(0)
        ).ok();
        
        mois_status.push(MoisStatus {
            numero: mois,
            nom: mois_noms[idx].to_string(),
            paye: paid_check.is_some(),
            montant_du: mensualite,
            recu_id: paid_check,
        });
    }
    
    println!("[PAYMENT_STATUS] ✅ Returning status with {} months", mois_status.len());
    Ok(PaiementStatus {
        eleve_id: eleve_id.to_string(),
        annee: annee_scolaire.to_string(),
        mois: mois_status,
    })
}

/// Create a new receipt
pub fn create_recu(request: CreateRecuRequest, user_id: &str) -> Result<RecuDetail, AppError> {
    println!("[PAYMENT] 🔵 Starting create_recu for eleve_id: {}, type: {}, montant: {}", 
             request.eleve_id, request.type_paiement, request.montant_total);
    let conn = get_connection();
    println!("[PAYMENT] ✅ Database connection obtained");
    
    // Validate student exists
    let student_exists: bool = conn.query_row(
        "SELECT COUNT(*) FROM eleves WHERE id = ? AND deleted_at IS NULL",
        params![request.eleve_id],
        |row| row.get::<_, i32>(0).map(|c| c > 0)
    )?;
    
    println!("[PAYMENT] ✅ Student validation: exists = {}", student_exists);
    if !student_exists {
        println!("[PAYMENT] ❌ Student not found!");
        return Err(AppError::NotFound("Élève non trouvé".to_string()));
    }
    
    // Validate no duplicate months
    println!("[PAYMENT] 🔍 Checking {} months for duplicates", request.mois_payes.len());
    for &mois in &request.mois_payes {
        let calendar_year = if mois >= 9 { request.annee } else { request.annee + 1 };
        
        let already_paid: bool = conn.query_row(
            "SELECT COUNT(*) FROM lignes_paiement WHERE eleve_id = ? AND mois = ? AND annee = ?",
            params![request.eleve_id, mois, calendar_year],
            |row| row.get::<_, i32>(0).map(|c| c > 0)
        )?;
        
        if already_paid {
            let mois_nom = match mois {
                1 => "Janvier", 2 => "Février", 3 => "Mars", 4 => "Avril",
                5 => "Mai", 6 => "Juin", 7 => "Juillet", 8 => "Août",
                9 => "Septembre", 10 => "Octobre", 11 => "Novembre", 12 => "Décembre",
                _ => "Inconnu"
            };
            return Err(AppError::ValidationError(
                format!("Le mois {} {} est déjà payé", mois_nom, calendar_year)
            ));
        }
    }
    
    // Generate receipt number
    println!("[PAYMENT] 🔢 Generating receipt number");
    let numero = generate_receipt_number(&conn)?;
    println!("[PAYMENT] ✅ Receipt number: {}", numero);
    
    // Use the manual amount from request
    let montant_total = request.montant_total;
    
    // Calculate montant per line if MENSUALITE
    let montant_unitaire = if request.type_paiement == "MENSUALITE" && request.mois_payes.len() > 0 {
        montant_total / request.mois_payes.len() as f64
    } else {
        montant_total
    };
    
    // Create receipt
    let recu_id = Uuid::new_v4().to_string();
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    println!("[PAYMENT] 💾 Inserting receipt into database: id={}, numero={}", recu_id, numero);
    
    conn.execute(
        "INSERT INTO recus (id, numero, date_operation, type_paiement, montant_total, mode_paiement, eleve_id, user_id, etat, commentaire, created_at, numero_carnet, numero_recu_physique)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VALIDE', ?, ?, ?, ?)",
        params![
            recu_id,
            numero,
            now,
            request.type_paiement,
            montant_total,
            request.mode_paiement,
            request.eleve_id,
            user_id,
            request.commentaire,
            now,
            request.numero_carnet,
            request.numero_recu_physique
        ]
    )?;
    
    // Create payment lines
    println!("[PAYMENT] ✅ Receipt inserted successfully");
    println!("[PAYMENT] 📝 Creating {} payment lines", request.mois_payes.len());
    let mut lignes = Vec::new();
    for mois in request.mois_payes {
        let ligne_id = Uuid::new_v4().to_string();
        let calendar_year = if mois >= 9 { request.annee } else { request.annee + 1 };
        
        conn.execute(
            "INSERT INTO lignes_paiement (id, recu_id, eleve_id, mois, annee, montant)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![ligne_id, recu_id, request.eleve_id, mois, calendar_year, montant_unitaire]
        )?;
        
        lignes.push(LignePaiement {
            id: ligne_id,
            mois,
            annee: calendar_year,
            montant: montant_unitaire,
        });
    }
    
    // Fetch complete receipt details
    println!("[PAYMENT] ✅ All payment lines created");
    println!("[PAYMENT] 🔍 Fetching complete receipt details");
    // We cannot call get_recu_by_id(&recu_id) here because it calls get_connection() internally causing deadlock!
    // Instead we construct the result manually since we have all data or create a helper that takes connection.
    // For now, let's fix the deadlock first.
    // Actually, get_recu_by_id WILL deadlock too if called here since conn is still held!
    // We need to drop conn before calling get_recu_by_id OR make a version of get_recu that takes connection.
    
    // Dropping conn is safe here because we finished all inserts.
    drop(conn);
    
    let result = get_recu_by_id(&recu_id);
    println!("[PAYMENT] ✅ Create recu completed successfully");
    result
}

/// Generate unique receipt number (format: R2025000001)
fn generate_receipt_number(conn: &Connection) -> Result<String, AppError> {
    println!("[RECEIPT_NUM] 🔵 Starting receipt number generation");
    let year = Utc::now().format("%Y").to_string();
    println!("[RECEIPT_NUM] 📅 Current year: {}", year);
    
    let last_seq: Option<i32> = conn.query_row(
        "SELECT MAX(CAST(SUBSTR(numero, 6) AS INTEGER)) FROM recus WHERE numero LIKE ?",
        params![format!("R{}%", year)],
        |row: &rusqlite::Row| row.get(0)
    ).ok().flatten();
    
    println!("[RECEIPT_NUM] 🔍 Last sequence found: {:?}", last_seq);
    let next_seq = last_seq.unwrap_or(0) + 1;
    println!("[RECEIPT_NUM] ➕ Next sequence: {}", next_seq);
    
    let numero = format!("R{}{:06}", year, next_seq);
    println!("[RECEIPT_NUM] ✅ Generated number: {}", numero);
    Ok(numero)
}

/// Get receipt by ID with full details
pub fn get_recu_by_id(recu_id: &str) -> Result<RecuDetail, AppError> {
    let conn = get_connection();
    
    // Get receipt
    let recu: Recu = conn.query_row(
        r#"
        SELECT id, numero, date_operation, type_paiement, montant_total, mode_paiement, 
               eleve_id, user_id, etat, commentaire, created_at, numero_carnet, numero_recu_physique
        FROM recus WHERE id = ?
        "#,
        params![recu_id],
        |row| {
            Ok(Recu {
                id: row.get(0)?,
                numero: row.get(1)?,
                date_operation: row.get(2)?,
                type_paiement: row.get(3)?,
                montant_total: row.get(4)?,
                mode_paiement: row.get(5)?,
                eleve_id: row.get(6)?,
                user_id: row.get(7)?,
                etat: row.get(8)?,
                commentaire: row.get(9)?,
                created_at: row.get(10)?,
                numero_carnet: row.get(11)?,
                numero_recu_physique: row.get(12)?,
            })
        }
    ).map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    // Get student info if applicable
    let eleve = if let Some(ref eleve_id) = recu.eleve_id {
        conn.query_row(
            "SELECT e.id, e.nom, e.prenom, e.code_matricule, c.nom as classe_nom
             FROM eleves e
             LEFT JOIN inscriptions i ON e.id = i.eleve_id AND i.active = 1
             LEFT JOIN classes c ON i.classe_id = c.id
             WHERE e.id = ?",
            params![eleve_id],
            |row| Ok(EleveInfo {
                id: row.get(0)?,
                nom: row.get(1)?,
                prenom: row.get(2)?,
                code_matricule: row.get(3)?,
                classe_nom: row.get(4)?,
            })
        ).ok()
    } else {
        None
    };
    
    // Get payment lines
    let mut stmt = conn.prepare(
        "SELECT id, mois, annee, montant FROM lignes_paiement WHERE recu_id = ? ORDER BY annee, mois"
    )?;
    
    let lignes = stmt.query_map(params![recu_id], |row| {
        Ok(LignePaiement {
            id: row.get(0)?,
            mois: row.get(1)?,
            annee: row.get(2)?,
            montant: row.get(3)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    
    // Get user name
    let user_nom: String = conn.query_row(
        "SELECT nom || ' ' || prenom FROM users WHERE id = ?",
        params![recu.user_id],
        |row| row.get(0)
    ).unwrap_or_else(|_| "Inconnu".to_string());
    
    Ok(RecuDetail {
        recu,
        eleve,
        lignes,
        user_nom,
    })
}

/// Get all receipts for a student
pub fn get_recus_by_eleve(eleve_id: &str) -> Result<Vec<RecuListItem>, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT r.id, r.numero, r.date_operation, r.type_paiement, r.montant_total, r.etat,
                e.nom || ' ' || e.prenom as eleve_nom, r.numero_carnet, r.numero_recu_physique
         FROM recus r
         LEFT JOIN eleves e ON r.eleve_id = e.id
         WHERE r.eleve_id = ?
         ORDER BY r.date_operation DESC"
    )?;
    
    let recus = stmt.query_map(params![eleve_id], |row| {
        Ok(RecuListItem {
            id: row.get(0)?,
            numero: row.get(1)?,
            date_operation: row.get(2)?,
            type_paiement: row.get(3)?,
            montant_total: row.get(4)?,
            etat: row.get(5)?,
            eleve_nom: row.get(6)?,
            numero_carnet: row.get(7)?,
            numero_recu_physique: row.get(8)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    
    Ok(recus)
}

/// Get all receipts (for admin)
pub fn get_all_recus() -> Result<Vec<RecuListItem>, AppError> {
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        "SELECT r.id, r.numero, r.date_operation, r.type_paiement, r.montant_total, r.etat,
                e.nom || ' ' || e.prenom as eleve_nom, r.numero_carnet, r.numero_recu_physique
         FROM recus r
         LEFT JOIN eleves e ON r.eleve_id = e.id
         ORDER BY r.date_operation DESC
         LIMIT 100"
    )?;
    
    let recus = stmt.query_map([], |row| {
        Ok(RecuListItem {
            id: row.get(0)?,
            numero: row.get(1)?,
            date_operation: row.get(2)?,
            type_paiement: row.get(3)?,
            montant_total: row.get(4)?,
            etat: row.get(5)?,
            eleve_nom: row.get(6)?,
            numero_carnet: row.get(7)?,
            numero_recu_physique: row.get(8)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    
    Ok(recus)
}

/// Cancel a receipt (Admin only)
pub fn annuler_recu(recu_id: &str) -> Result<(), AppError> {
    let conn = get_connection();
    
    // Update receipt status
    let rows = conn.execute(
        "UPDATE recus SET etat = 'ANNULE' WHERE id = ? AND etat = 'VALIDE'",
        params![recu_id]
    )?;
    
    if rows == 0 {
        return Err(AppError::NotFound("Reçu non trouvé ou déjà annulé".to_string()));
    }
    
    // Delete payment lines (to free up months)
    conn.execute(
        "DELETE FROM lignes_paiement WHERE recu_id = ?",
        params![recu_id]
    )?;
    
    // TODO: Add audit log entry
    
    Ok(())
}
