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
pub use eleves_service::get_paid_months;
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

pub mod donneurs_service;
pub use donneurs_service::{
    get_all_donneurs, get_donneur_by_id, create_donneur, update_donneur, delete_donneur, search_donneurs,
    Donneur, DonneurListItem, CreateDonneurRequest
};

pub mod messages_service;
pub use messages_service::{
    create_message, get_messages_received, get_unread_count, mark_as_read, delete_message,
    MessageListItem, CreateMessageRequest
};

pub mod permissions_service;
pub use permissions_service::{
    get_user_permissions, update_user_permissions,
    UserPermission, UpdatePermissionsRequest
};

pub mod dashboard_service;
pub use dashboard_service::{
    get_dashboard_stats, get_late_payment_students,
    DashboardStats, LatePaymentStudent
};

pub mod reports_service;
pub use reports_service::{
    generate_recettes_report, generate_depenses_report, generate_bilan_report, 
    generate_inscriptions_report,
    RecettesReport, DepensesReport, BilanReport, InscriptionItem
};

pub mod backup_service;
pub use backup_service::{backup_database, restore_database};

pub mod seed_service;
pub use seed_service::populate_test_data;

pub mod inscriptions_service;
pub use inscriptions_service::{
    get_inscription_by_eleve, get_inscriptions_by_classe, create_inscription, 
    delete_inscription, update_inscription_classe, get_all_classes_for_select,
    Inscription, InscriptionDetail, EleveInClasse
};
