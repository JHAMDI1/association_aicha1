import { invoke } from "@tauri-apps/api/core";

// ==========================================
// TYPES
// ==========================================

export interface PaiementStatus {
    eleve_id: string;
    annee: string;
    mois: MoisStatus[];
}

export interface MoisStatus {
    numero: number;       // 1-12
    nom: string;         // "Septembre", "Octobre"...
    paye: boolean;
    montant_du: number;
    recu_id?: string;
}

export interface CreatePaiementRequest {
    eleve_id?: string;
    type_paiement: "MENSUALITE" | "INSCRIPTION" | "ASSURANCE" | "DON";
    mois_payes: number[];  // [9, 10, 11]
    annee: number;
    montant_total: number;  // Manual amount
    mode_paiement: "ESPECES" | "CHEQUE" | "VIREMENT";
    commentaire?: string;
    numero_carnet?: string;
    numero_recu_physique?: string;
    source_type?: "ELEVE" | "DONNEUR" | "ANONYME";
    donneur_id?: string;
}

export interface Recu {
    id: string;
    numero: string;
    date_operation: string;
    type_paiement: string;
    montant_total: number;
    mode_paiement: string;
    eleve_id?: string;
    user_id: string;
    etat: string;
    commentaire?: string;
    numero_carnet?: string;
    numero_recu_physique?: string;
    created_at: string;
}

export interface RecuDetail {
    recu: Recu;
    eleve?: EleveInfo;
    lignes: LignePaiement[];
    user_nom: string;
}

export interface EleveInfo {
    id: string;
    nom: string;
    prenom: string;
    code_matricule: string;
    classe_nom?: string;
}

export interface LignePaiement {
    id: string;
    mois: number;
    annee: number;
    montant: number;
}

export interface RecuListItem {
    id: string;
    numero: string;
    date_operation: string;
    type_paiement: string;
    montant_total: number;
    eleve_nom?: string;
    etat: string;
    numero_carnet?: string;
    numero_recu_physique?: string;
}

// ==========================================
// API
// ==========================================

export const paiementsApi = {
    /**
     * Get payment status for a student
     */
    getPaiementStatus: (eleveId: string, anneeScolaire: string) =>
        invoke<PaiementStatus>("get_paiement_status", {
            eleve_id: eleveId,
            annee_scolaire: anneeScolaire,
        }),

    /**
     * Create a new payment receipt
     */
    createPaiement: (request: CreatePaiementRequest) =>
        invoke<RecuDetail>("create_paiement", { request }),

    /**
     * Get receipt details by ID
     */
    getRecu: (recuId: string) =>
        invoke<RecuDetail>("get_recu", { recu_id: recuId }),

    /**
     * Get all receipts for a student
     */
    getRecusEleve: (eleveId: string) =>
        invoke<RecuListItem[]>("get_recus_eleve", { eleve_id: eleveId }),

    /**
     * Get all receipts (admin)
     */
    getAllRecus: () =>
        invoke<RecuListItem[]>("get_all_recus_list"),

    /**
     * Cancel a receipt (admin only)
     */
    annulerPaiement: (recuId: string) =>
        invoke<string>("annuler_paiement", { recu_id: recuId }),
};
