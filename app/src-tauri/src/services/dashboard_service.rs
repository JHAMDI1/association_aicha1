use crate::database::get_connection;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};

// ============================================
// MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_recettes: f64,
    pub total_depenses: f64,
    pub total_dons: f64,
    pub solde: f64,
    pub total_eleves: i32,
    pub eleves_en_retard_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LatePaymentStudent {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub classe: String,
    pub mois_impayes: i32,
    pub montant_du: f64,
}

// ============================================
// SERVICES
// ============================================

/// Get dashboard statistics
pub fn get_dashboard_stats() -> Result<DashboardStats, AppError> {
    println!("[DASHBOARD] 📊 Calculating dashboard statistics");
    
    let conn = get_connection();
    
    // Total recettes (sum from lignes_paiement)
    let total_recettes: f64 = conn.query_row(
        r#"
        SELECT COALESCE(SUM(lp.montant), 0.0) 
        FROM lignes_paiement lp
        JOIN recus r ON lp.recu_id = r.id
        WHERE r.etat = 'VALIDE'
        "#,
        [],
        |row| row.get(0),
    ).unwrap_or(0.0);
    
    // Total dépenses (all valid expenses)
    let total_depenses: f64 = conn.query_row(
        "SELECT COALESCE(SUM(montant), 0.0) FROM depenses WHERE etat = 'VALIDE'",
        [],
        |row| row.get(0),
    ).unwrap_or(0.0);
    
    // Total dons (receipts with type DON)
    let total_dons: f64 = conn.query_row(
        "SELECT COALESCE(SUM(montant_total), 0.0) FROM recus WHERE etat = 'VALIDE' AND type_paiement = 'DON'",
        [],
        |row| row.get(0),
    ).unwrap_or(0.0);
    
    // Total élèves actifs
    let total_eleves: i32 = conn.query_row(
        "SELECT COUNT(*) FROM eleves WHERE deleted_at IS NULL",
        [],
        |row| row.get(0),
    ).unwrap_or(0);
    
    // Count students with late payments (missing months in current academic year)
    let eleves_en_retard_count: i32 = conn.query_row(
        r#"
        SELECT COUNT(DISTINCT e.id)
        FROM eleves e
        WHERE e.deleted_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM (
                SELECT 9 as mois UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
                UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
            ) m
            WHERE NOT EXISTS (
                SELECT 1 FROM lignes_paiement lp
                JOIN recus r ON lp.recu_id = r.id
                WHERE lp.eleve_id = e.id
                AND r.etat = 'VALIDE'
                AND r.type_paiement = 'MENSUALITE'
                AND lp.mois = m.mois
                AND lp.annee = CAST(strftime('%Y', 'now') as INTEGER)
            )
            AND m.mois <= CAST(strftime('%m', 'now') as INTEGER)
        )
        "#,
        [],
        |row| row.get(0),
    ).unwrap_or(0);
    
    let solde = total_recettes - total_depenses;
    
    println!("[DASHBOARD] ✅ Stats: Recettes={}, Dépenses={}, Solde={}, Élèves={}, Retards={}", 
        total_recettes, total_depenses, solde, total_eleves, eleves_en_retard_count);
    
    Ok(DashboardStats {
        total_recettes,
        total_depenses,
        total_dons,
        solde,
        total_eleves,
        eleves_en_retard_count,
    })
}

/// Get list of students with late payments
pub fn get_late_payment_students() -> Result<Vec<LatePaymentStudent>, AppError> {
    println!("[DASHBOARD] 📋 Getting late payment students");
    
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT 
            e.id,
            e.nom,
            e.prenom,
            COALESCE(c.nom, 'N/A') as classe,
            COUNT(DISTINCT m.mois) as mois_impayes,
            COUNT(DISTINCT m.mois) * 100.0 as montant_du
        FROM eleves e
        LEFT JOIN inscriptions i ON e.id = i.eleve_id AND i.active = 1
        LEFT JOIN classes c ON i.classe_id = c.id
        CROSS JOIN (
            SELECT 9 as mois UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
            UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
        ) m
        WHERE e.deleted_at IS NULL
        AND m.mois <= CAST(strftime('%m', 'now') as INTEGER)
        AND NOT EXISTS (
            SELECT 1 FROM lignes_paiement lp
            JOIN recus r ON lp.recu_id = r.id
            WHERE lp.eleve_id = e.id
            AND r.etat = 'VALIDE'
            AND r.type_paiement = 'MENSUALITE'
            AND lp.mois = m.mois
            AND lp.annee = CAST(strftime('%Y', 'now') as INTEGER)
        )
        GROUP BY e.id, e.nom, e.prenom, c.nom
        HAVING COUNT(DISTINCT m.mois) > 0
        ORDER BY mois_impayes DESC, e.nom, e.prenom
        LIMIT 20
        "#,
    )?;
    
    let students = stmt.query_map([], |row| {
        Ok(LatePaymentStudent {
            id: row.get(0)?,
            nom: row.get(1)?,
            prenom: row.get(2)?,
            classe: row.get(3)?,
            mois_impayes: row.get(4)?,
            montant_du: row.get(5)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[DASHBOARD] ✅ Found {} students with late payments", students.len());
    Ok(students)
}
