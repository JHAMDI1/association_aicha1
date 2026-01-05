import { invoke } from "@tauri-apps/api/core";

export interface RecetteItem {
    date: string;
    eleve_nom: string;
    eleve_prenom: string;
    mois: number;
    montant: number;
    mode_paiement: string;
}

export interface RecettesReport {
    total: number;
    count: number;
    details: RecetteItem[];
}

export interface DepenseItem {
    date: string;
    motif: string;
    montant: number;
    beneficiaire: string;
}

export interface DepensesReport {
    total: number;
    count: number;
    details: DepenseItem[];
}

export interface BilanReport {
    recettes: number;
    depenses: number;
    solde: number;
    periode: string;
}

export interface InscriptionItem {
    classe: string;
    nb_eleves: number;
    eleves: string[];
}

export interface LatePaymentStudent {
    id: string;
    nom: string;
    prenom: string;
    classe: string;
    mois_impayes: number;
    montant_du: number;
}

export const reportsApi = {
    generateRecettes: (dateDebut: string, dateFin: string) =>
        invoke<RecettesReport>("generate_recettes_report", { dateDebut, dateFin }),

    generateDepenses: (dateDebut: string, dateFin: string) =>
        invoke<DepensesReport>("generate_depenses_report", { dateDebut, dateFin }),

    generateBilan: (dateDebut: string, dateFin: string) =>
        invoke<BilanReport>("generate_bilan_report", { dateDebut, dateFin }),

    generateRetards: () =>
        invoke<LatePaymentStudent[]>("generate_retards_report"),

    generateInscriptions: () =>
        invoke<InscriptionItem[]>("generate_inscriptions_report"),
};
