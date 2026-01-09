#[cfg(test)]
use crate::services::auth_service;
#[cfg(test)]
use crate::models::UserRole;

#[test]
fn test_password_hashing() {
    let password = "mysecurepassword";
    let hash = auth_service::hash_password_sync(password).unwrap();
    
    assert_ne!(password, hash);
    assert!(auth_service::verify_password(password, &hash).unwrap());
    assert!(!auth_service::verify_password("wrongpassword", &hash).unwrap());
}
