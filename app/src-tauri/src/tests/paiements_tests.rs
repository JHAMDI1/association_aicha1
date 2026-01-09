
use crate::services::paiements_service;
use crate::services::paiements_service::CreateRecuRequest;
use crate::services::eleves_service::{self, CreateEleveRequest};

#[test]
fn test_create_paiement() {
    // Need an eleve first
    let eleve_req = CreateEleveRequest {
        nom: "Payer".to_string(),
        prenom: "Student".to_string(),
        date_naissance: Some("2010-01-01".to_string()),
        sexe: Some("M".to_string()),
        tuteur_nom: None,
        tuteur_tel: None,
        tuteur_cin: None,
        adresse: None,
    };
    let eleve = eleves_service::create_eleve(eleve_req, "admin").expect("failed to create eleve");

    // Create Recu
    let recu_req = CreateRecuRequest {
        eleve_id: Some(eleve.id.clone()),
        type_paiement: "INSCRIPTION".to_string(),
        mois_payes: vec![], // Empty for non-mensualite
        annee: 2025,
        montant_total: 500.0,
        mode_paiement: "ESPECES".to_string(),
        commentaire: None,
        numero_carnet: None,
        numero_recu_physique: None,
        source_type: Some("ELEVE".to_string()),
        donneur_id: None,
        date_operation: Some("2025-01-01".to_string()),
    };

    let recu_detail = paiements_service::create_recu(recu_req, "admin").expect("Failed to create recu");
    assert_eq!(recu_detail.recu.montant_total, 500.0);
    assert_eq!(recu_detail.recu.eleve_id.unwrap(), eleve.id);
}
