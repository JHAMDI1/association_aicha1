use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use once_cell::sync::Lazy;

pub static CONFIG: Lazy<Config> = Lazy::new(|| load_config());

/// Configuration de l'administrateur par défaut
#[derive(Debug, Deserialize, Clone)]
pub struct AdminConfig {
    pub email: String,
    pub password: String,
    pub nom: String,
    pub prenom: String,
}

/// Configuration de l'application
#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub nom_association: String,
    pub annee_scolaire: String,
    pub devise: String,
}

/// Configuration de la base de données
#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub filename: String,
}

/// Configuration des paiements
#[derive(Debug, Deserialize, Clone)]
pub struct PaiementsConfig {
    pub mensualite_default: f64,
    pub frais_inscription: f64,
    pub assurance: f64,
}

/// Configuration complète
#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub admin: AdminConfig,
    pub app: AppConfig,
    pub database: DatabaseConfig,
    pub paiements: PaiementsConfig,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            admin: AdminConfig {
                email: "admin@aicha.local".to_string(),
                password: "admin123".to_string(),
                nom: "Admin".to_string(),
                prenom: "Principal".to_string(),
            },
            app: AppConfig {
                nom_association: "Association Aicha".to_string(),
                annee_scolaire: "2025-2026".to_string(),
                devise: "DH".to_string(),
            },
            database: DatabaseConfig {
                filename: "aicha_asso.db".to_string(),
            },
            paiements: PaiementsConfig {
                mensualite_default: 100.0,
                frais_inscription: 200.0,
                assurance: 50.0,
            },
        }
    }
}

/// Load configuration from config.toml
pub fn load_config() -> Config {
    let config_path = get_config_path();
    
    if config_path.exists() {
        match fs::read_to_string(&config_path) {
            Ok(contents) => {
                match toml::from_str(&contents) {
                    Ok(config) => {
                        println!("Configuration loaded from: {:?}", config_path);
                        return config;
                    }
                    Err(e) => {
                        eprintln!("Error parsing config.toml: {}. Using defaults.", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("Error reading config.toml: {}. Using defaults.", e);
            }
        }
    } else {
        println!("No config.toml found, using default configuration.");
        // Create default config file
        create_default_config(&config_path);
    }
    
    Config::default()
}

/// Get the path to config.toml
fn get_config_path() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("config.toml");
    path
}

/// Create default config file if it doesn't exist
fn create_default_config(path: &PathBuf) {
    let default_content = r#"# =============================================
# Configuration de l'application Association Aicha
# =============================================
# Ce fichier contient les paramètres de configuration de l'application.
# Il est lu au premier lancement pour créer l'administrateur par défaut.
#
# ⚠️ IMPORTANT: Changez le mot de passe par défaut après la première connexion!

[admin]
# Identifiants de l'administrateur par défaut
# Ces données sont utilisées UNIQUEMENT si aucun admin n'existe dans la base
email = "admin@aicha.local"
password = "admin123"
nom = "Admin"
prenom = "Principal"

[app]
# Nom de l'association
nom_association = "Association Aicha"
# Année scolaire actuelle (format: YYYY-YYYY)
annee_scolaire = "2025-2026"
# Devise
devise = "DH"

[database]
# Nom du fichier de base de données SQLite
filename = "aicha_asso.db"

[paiements]
# Montant par défaut de la mensualité (en DH)
mensualite_default = 100
# Montant des frais d'inscription
frais_inscription = 200
# Montant de l'assurance
assurance = 50
"#;

    if let Err(e) = fs::write(path, default_content) {
        eprintln!("Could not create default config.toml: {}", e);
    } else {
        println!("Created default config.toml at: {:?}", path);
    }
}
