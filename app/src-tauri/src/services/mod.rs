mod auth_service;
mod eleves_service;

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
