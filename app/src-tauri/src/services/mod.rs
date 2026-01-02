mod auth_service;
mod eleves_service;
pub mod niveaux_service;
pub mod enseignants_service;
pub mod classes_service;
pub mod paiements_service;

pub use auth_service::authenticate;
pub use auth_service::get_all_users;
pub use auth_service::get_user_by_id;
pub use auth_service::create_user;
pub use auth_service::update_user;
pub use auth_service::delete_user;
pub use auth_service::hash_password_sync;

pub use eleves_service::get_all_eleves;
pub use eleves_service::get_eleve_by_id;
pub use eleves_service::create_eleve;
pub use eleves_service::update_eleve;
pub use eleves_service::delete_eleve;
pub use eleves_service::upload_photo;
pub use eleves_service::{Eleve, EleveListItem, CreateEleveRequest, UpdateEleveRequest};

pub use niveaux_service::{get_all_niveaux, get_niveau_by_id, create_niveau, update_niveau, delete_niveau};
pub use enseignants_service::{get_all_enseignants, get_enseignant_by_id, create_enseignant, update_enseignant, delete_enseignant};
pub use classes_service::{get_all_classes, get_classe_by_id, create_classe, update_classe, delete_classe};

pub use paiements_service::{
    get_paiement_status, create_recu, get_recu_by_id, get_recus_by_eleve, get_all_recus, annuler_recu,
    PaiementStatus, CreateRecuRequest, RecuDetail, RecuListItem
};

pub mod depenses_service;
pub use depenses_service::{
    get_depense_by_id, get_all_depenses, create_depense, valider_depense, rejeter_depense,
    delete_depense, upload_piece_jointe, get_depenses_stats,
    Depense, DepenseListItem, CreateDepenseRequest, DepenseStats
};
