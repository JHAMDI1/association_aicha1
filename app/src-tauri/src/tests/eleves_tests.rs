
use crate::services::eleves_service;
use crate::services::eleves_service::{CreateEleveRequest, UpdateEleveRequest};
// use crate::models::UserRole; // Unused for now

// Since we use a global static DB, these tests perform actual DB operations on the in-memory DB.
// Note: Tests run in parallel by default, but our DB is behind a Mutex. 
// However, the "in-memory" DB is created ONCE per process execution if initialized via Lazy static.
// But wait, `init_database` is called by `Lazy`. 
// If tests run in the same process, they share the DB.
// Since we want isolation, we might have issues if tests depend on empty state.
// Ideally, we should wrap each test in a transaction that rolls back, OR run tests sequentially.
// Or, for simplicity in this setup, we assume we just create data and check it exists.

#[test]
fn test_create_read_eleve() {
    // 1. Create
    let req = CreateEleveRequest {
        nom: "TestNom".to_string(),
        prenom: "TestPrenom".to_string(),
        date_naissance: Some("2015-01-01".to_string()),
        sexe: Some("M".to_string()),
        tuteur_nom: Some("Pere Test".to_string()),
        tuteur_tel: Some("0600000000".to_string()),
        tuteur_cin: Some("AB123456".to_string()),
        adresse: Some("Casa".to_string()),
    };

    let created = eleves_service::create_eleve(req, "admin-test-id").expect("Failed to create eleve");
    assert_eq!(created.nom, "TestNom");
    
    // 2. Read
    let fetched = eleves_service::get_eleve_by_id(&created.id).expect("Failed to fetch eleve");
    assert_eq!(fetched.id, created.id);
    assert_eq!(fetched.nom, "TestNom");
}

#[test]
fn test_search_eleve() {
    // Create another student
    let req = CreateEleveRequest {
        nom: "SearchMe".to_string(),
        prenom: "FindMe".to_string(),
        date_naissance: Some("2016-01-01".to_string()),
        sexe: Some("F".to_string()),
        tuteur_nom: None,
        tuteur_tel: None,
        tuteur_cin: None,
        adresse: None,
    };
    eleves_service::create_eleve(req, "admin-test-id").expect("Failed to create search student");

    // Search
    let results = eleves_service::get_all_eleves(Some("SearchMe".to_string())).expect("search failed");
    assert!(results.iter().any(|e| e.nom == "SearchMe"));
    
    let results_fail = eleves_service::get_all_eleves(Some("NonExistent".to_string())).expect("search failed");
    assert!(results_fail.is_empty());
}
