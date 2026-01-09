use crate::database::get_connection;
use crate::errors::AppError;
use rusqlite::params;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub user_id: String,
    pub user_name: Option<String>,
    pub action: String,
    pub entite: String,
    pub entite_id: Option<String>,
    pub details: Option<String>,
    pub timestamp: String,
}

/// Log an action to the audit_logs table
pub fn log_action(
    user_id: &str,
    action: &str,
    entity: &str,
    entity_id: Option<&str>,
    details: Option<Value>,
) -> Result<(), AppError> {
    let conn = get_connection();
    
    let id = Uuid::new_v4().to_string();
    let details_json = details.map(|v| v.to_string());
    
    conn.execute(
        r#"
        INSERT INTO audit_logs (id, user_id, action, entite, entite_id, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        "#,
        params![
            id,
            user_id,
            action,
            entity,
            entity_id,
            details_json
        ],
    ).map_err(|e| AppError::DatabaseError(format!("Failed to write audit log: {}", e)))?;
    
    println!("[AUDIT] 📝 {} - {} on {} ({:?})", action, user_id, entity, entity_id);
    
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLogFilters {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
    pub actions: Option<Vec<String>>,
    pub user_id: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

/// Get audit logs with filters
pub fn get_logs(filters: AuditLogFilters) -> Result<(Vec<AuditLog>, i64), AppError> {
    let conn = get_connection();
    let limit = filters.limit.unwrap_or(50);
    let offset = filters.offset.unwrap_or(0);
    
    // Build query dynamically
    let mut query = String::from("
        SELECT 
            a.id, a.user_id, u.nom || ' ' || u.prenom as user_name,
            a.action, a.entite, a.entite_id, a.details, a.timestamp
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
    ");
    
    let mut count_query = String::from("SELECT COUNT(*) FROM audit_logs a WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(actions) = &filters.actions {
        if !actions.is_empty() {
             let placeholders = actions.iter().map(|_| "?").collect::<Vec<_>>().join(",");
             let clause = format!(" AND a.action IN ({})", placeholders);
             query.push_str(&clause);
             count_query.push_str(&clause);
             for action in actions {
                 params.push(Box::new(action.clone()));
             }
        }
    }
    
    if let Some(uid) = &filters.user_id {
        query.push_str(" AND a.user_id = ?");
        count_query.push_str(" AND a.user_id = ?");
        params.push(Box::new(uid.clone()));
    }
    
    if let Some(start) = &filters.start_date {
        query.push_str(" AND a.timestamp >= ?");
        count_query.push_str(" AND a.timestamp >= ?");
        params.push(Box::new(start.clone()));
    }
    
    if let Some(end) = &filters.end_date {
        // Add time to end date to include the whole day
        let end_ts = format!("{} 23:59:59", end);
        query.push_str(" AND a.timestamp <= ?");
        count_query.push_str(" AND a.timestamp <= ?");
        params.push(Box::new(end_ts));
    }
    
    // Get total count first
    // We need to re-borrow params for count query, which is tricky with Box<dyn ToSql>
    // So we just execute count query with same params logic or just fetch all and paginate in memory (inefficient)
    // Or just run count query separately recreating params.
    // Simpler approach for now:
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let total: i64 = conn.query_row(&count_query, params_refs.as_slice(), |row| row.get(0)).unwrap_or(0);
    
    // Add sorting and pagination
    query.push_str(" ORDER BY a.timestamp DESC LIMIT ? OFFSET ?");
    params.push(Box::new(limit));
    params.push(Box::new(offset));
    
    let params_refs_final: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    let mut stmt = conn.prepare(&query).map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    let logs = stmt.query_map(params_refs_final.as_slice(), |row| {
        Ok(AuditLog {
            id: row.get(0)?,
            user_id: row.get(1)?,
            user_name: row.get(2)?,
            action: row.get(3)?,
            entite: row.get(4)?,
            entite_id: row.get(5)?,
            details: row.get(6)?, // usage of details column that we just added
            timestamp: row.get(7)?,
        })
    }).map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    let result: Vec<AuditLog> = logs.filter_map(|r| r.ok()).collect();
    Ok((result, total))
}

