use crate::database::get_connection;
use crate::errors::AppError;
use rusqlite::params;
use serde::{Deserialize, Serialize};

// ============================================
// MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize)]
pub struct RecetteItem {
    pub date: String,
    pub eleve_nom: String,
    pub eleve_prenom: String,
    pub mois: i32,
    pub montant: f64,
    pub mode_paiement: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecettesReport {
    pub total: f64,
    pub count: i32,
    pub details: Vec<RecetteItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DepenseItem {
    pub date: String,
    pub motif: String,
    pub montant: f64,
    pub beneficiaire: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DepensesReport {
    pub total: f64,
    pub count: i32,
    pub details: Vec<DepenseItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BilanReport {
    pub recettes: f64,
    pub depenses: f64,
    pub solde: f64,
    pub periode: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InscriptionItem {
    pub classe: String,
    pub nb_eleves: i32,
    pub eleves: Vec<String>, // "Nom Prénom"
}

// ============================================
// SERVICES
// ============================================

/// Generate Recettes report
pub fn generate_recettes_report(date_debut: &str, date_fin: &str) -> Result<RecettesReport, AppError> {
    println!("[REPORTS] 💰 Generating Recettes report: {} to {}", date_debut, date_fin);
    
    let conn = get_connection();
    
    // Join recus + lignes_paiement + eleves
    let mut stmt = conn.prepare(
        r#"
        SELECT 
            r.created_at,
            e.nom,
            e.prenom,
            lp.mois,
            lp.montant,
            r.mode_paiement
        FROM recus r
        JOIN lignes_paiement lp ON r.id = lp.recu_id
        JOIN eleves e ON lp.eleve_id = e.id
        WHERE r.etat = 'VALIDE'
        AND r.type_paiement IN ('MENSUALITE', 'INSCRIPTION')
        AND DATE(r.created_at) >= DATE(?)
        AND DATE(r.created_at) <= DATE(?)
        ORDER BY r.created_at DESC
        "#,
    )?;
    
    let details = stmt.query_map(params![date_debut, date_fin], |row| {
        Ok(RecetteItem {
            date: row.get(0)?,
            eleve_nom: row.get(1)?,
            eleve_prenom: row.get(2)?,
            mois: row.get(3)?,
            montant: row.get(4)?,
            mode_paiement: row.get(5)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    let total: f64 = details.iter().map(|d| d.montant).sum();
    let count = details.len() as i32;
    
    println!("[REPORTS] ✅ Recettes: {} items, total: {} DH", count, total);
    
    Ok(RecettesReport { total, count, details })
}

/// Generate Dépenses report
pub fn generate_depenses_report(date_debut: &str, date_fin: &str) -> Result<DepensesReport, AppError> {
    println!("[REPORTS] 💸 Generating Dépenses report: {} to {}", date_debut, date_fin);
    
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT 
            date_operation,
            motif,
            montant,
            beneficiaire
        FROM depenses
        WHERE etat = 'VALIDE'
        AND DATE(date_operation) >= DATE(?)
        AND DATE(date_operation) <= DATE(?)
        ORDER BY date_operation DESC
        "#,
    )?;
    
    let details = stmt.query_map(params![date_debut, date_fin], |row| {
        Ok(DepenseItem {
            date: row.get(0)?,
            motif: row.get(1)?,
            montant: row.get(2)?,
            beneficiaire: row.get(3)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    let total: f64 = details.iter().map(|d| d.montant).sum();
    let count = details.len() as i32;
    
    println!("[REPORTS] ✅ Dépenses: {} items, total: {} DH", count, total);
    
    Ok(DepensesReport { total, count, details })
}

/// Generate Bilan report
pub fn generate_bilan_report(date_debut: &str, date_fin: &str) -> Result<BilanReport, AppError> {
    println!("[REPORTS] 📊 Generating Bilan report: {} to {}", date_debut, date_fin);
    
    let recettes_report = generate_recettes_report(date_debut, date_fin)?;
    let depenses_report = generate_depenses_report(date_debut, date_fin)?;
    
    let solde = recettes_report.total - depenses_report.total;
    let periode = format!("{} au {}", date_debut, date_fin);
    
    println!("[REPORTS] ✅ Bilan: Recettes={}, Dépenses={}, Solde={}", 
        recettes_report.total, depenses_report.total, solde);
    
    Ok(BilanReport {
        recettes: recettes_report.total,
        depenses: depenses_report.total,
        solde,
        periode,
    })
}

/// Generate Inscriptions report (by class)
pub fn generate_inscriptions_report() -> Result<Vec<InscriptionItem>, AppError> {
    println!("[REPORTS] 📚 Generating Inscriptions report");
    
    let conn = get_connection();
    
    // Use inscriptions table to get class assignments
    let mut stmt = conn.prepare(
        r#"
        SELECT 
            COALESCE(c.nom, 'Non assigné') as classe,
            COUNT(DISTINCT i.eleve_id) as nb_eleves,
            GROUP_CONCAT(e.nom || ' ' || e.prenom, ', ') as eleves_list
        FROM inscriptions i
        JOIN eleves e ON i.eleve_id = e.id
        LEFT JOIN classes c ON i.classe_id = c.id
        WHERE i.active = 1 AND e.deleted_at IS NULL
        GROUP BY c.nom
        ORDER BY c.nom
        "#,
    )?;
    
    let report = stmt.query_map([], |row| {
        let eleves_str: String = row.get(2)?;
        let eleves: Vec<String> = eleves_str.split(", ").map(|s| s.to_string()).collect();
        
        Ok(InscriptionItem {
            classe: row.get(0)?,
            nb_eleves: row.get(1)?,
            eleves,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[REPORTS] ✅ Inscriptions: {} classes", report.len());
    
    Ok(report)
}
