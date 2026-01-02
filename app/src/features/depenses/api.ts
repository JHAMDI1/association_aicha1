import { invoke } from "@tauri-apps/api/core";

// ==========================================
// TYPES
// ==========================================

export interface Depense {
    id: string;
    numero: string;
    date_operation: string;
    beneficiaire: string;
    motif?: string;
    montant: number;
    type_depense: string;
    piece_jointe_path?: string;
    etat: string;
    cree_par: string;
    valide_par?: string;
    date_validation?: string;
    commentaire?: string;
    created_at: string;
}

export interface DepenseListItem {
    id: string;
    numero: string;
    date_operation: string;
    beneficiaire: string;
    motif?: string;
    montant: number;
    type_depense: string;
    etat: string;
    cree_par_nom: string;
    has_piece_jointe: boolean;
}

export interface CreateDepenseRequest {
    beneficiaire: string;
    motif?: string;
    montant: number;
    type_depense: "FACTURE" | "AUTRE";
    commentaire?: string;
}

export interface DepenseStats {
    total_mois: number;
    en_attente: number;
}

// ==========================================
// API
// ==========================================

export const depensesApi = {
    /**
     * Get all expenses with optional status filter
     */
    getAll: (etatFilter?: string) =>
        invoke<DepenseListItem[]>("get_depenses", { etat_filter: etatFilter }),

    /**
     * Get expense by ID
     */
    getById: (id: string) =>
        invoke<Depense>("get_depense", { id }),

    /**
     * Create a new expense
     */
    create: (request: CreateDepenseRequest) =>
        invoke<Depense>("create_depense", { request }),

    /**
     * Validate an expense (Admin only)
     */
    valider: (depenseId: string) =>
        invoke<Depense>("valider_depense", { depense_id: depenseId }),

    /**
     * Reject an expense (Admin only)
     */
    rejeter: (depenseId: string, motif?: string) =>
        invoke<Depense>("rejeter_depense", { depense_id: depenseId, motif }),

    /**
     * Delete an expense
     */
    delete: (id: string) =>
        invoke<string>("delete_depense", { id }),

    /**
     * Upload proof image/PDF
     */
    uploadPreuve: (depenseId: string, fileBase64: string) =>
        invoke<string>("upload_piece_jointe", { depenseId, fileBase64 }),

    /**
     * Get expense stats for dashboard
     */
    getStats: () =>
        invoke<DepenseStats>("get_depenses_stats"),
};
