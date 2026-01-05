use crate::database::get_connection;
use crate::errors::AppError;
use rusqlite::params;

/// Populate database with test data
pub fn populate_test_data() -> Result<(), AppError> {
    println!("[TEST_DATA] 📝 Populating test data...");
    
    let conn = get_connection();
    
    // Disable foreign keys temporarily
    conn.execute("PRAGMA foreign_keys = OFF", [])?;
    
    // Execute SQL file content
    let sql = include_str!("../../test_data.sql");
    conn.execute_batch(sql)
        .map_err(|e| AppError::DatabaseError(format!("Failed to insert test data: {}", e)))?;
    
    // Re-enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    println!("[TEST_DATA] ✅ Test data inserted successfully!");
    Ok(())
}
