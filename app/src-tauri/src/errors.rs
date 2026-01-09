use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Application error types
#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),

    #[error("Conflict: {0}")]
    Conflict(String),
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

impl From<argon2::password_hash::Error> for AppError {
    fn from(err: argon2::password_hash::Error) -> Self {
        AppError::InternalError(format!("Password hash error: {}", err))
    }
}

/// Convert AppError to a format Tauri can serialize
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
