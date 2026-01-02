use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// User roles in the system
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserRole {
    #[serde(rename = "ADMIN")]
    Admin,
    #[serde(rename = "SECRETAIRE")]
    Secretaire,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::Admin => "ADMIN",
            UserRole::Secretaire => "SECRETAIRE",
        }
    }
    
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "ADMIN" => Some(UserRole::Admin),
            "SECRETAIRE" => Some(UserRole::Secretaire),
            _ => None,
        }
    }
}

/// User entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub actif: bool,
    pub created_at: String,
}

/// User without sensitive data (for API responses)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPublic {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub email: String,
    pub role: UserRole,
    pub actif: bool,
}

impl From<User> for UserPublic {
    fn from(user: User) -> Self {
        UserPublic {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            actif: user.actif,
        }
    }
}

/// Login request
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: UserPublic,
    pub message: String,
}

/// Create user request
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub nom: String,
    pub prenom: String,
    pub email: String,
    pub password: String,
    pub role: UserRole,
}

/// Update user request
#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub nom: Option<String>,
    pub prenom: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<UserRole>,
    pub actif: Option<bool>,
}
