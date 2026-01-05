import { invoke } from "@tauri-apps/api/core";

// ==========================================
// TYPES
// ==========================================

export interface Niveau {
    id: string;
    nom: string;
    ordre: number;
    created_at: string;
}

export interface Enseignant {
    id: string;
    nom: string;
    prenom: string;
    tel?: string;
    email?: string;
    specialite?: string;
    actif: boolean;
    created_at: string;
}

export interface Classe {
    id: string;
    nom: string;
    niveau_id: string;
    enseignant_id?: string;
    annee_scolaire: string;
    created_at: string;
}

export interface ClasseListItem {
    id: string;
    nom: string;
    niveau_nom: string;
    enseignant_nom?: string;
    annee_scolaire: string;
    count_eleves: number; // Du backend
}

// REQUEST TYPES

export interface CreateNiveauRequest {
    nom: string;
    ordre?: number;
}

export interface UpdateNiveauRequest {
    nom?: string;
    ordre?: number;
}

export interface CreateEnseignantRequest {
    nom: string;
    prenom: string;
    tel?: string;
    email?: string;
    specialite?: string;
}

export interface UpdateEnseignantRequest {
    nom?: string;
    prenom?: string;
    tel?: string;
    email?: string;
    specialite?: string;
    actif?: boolean;
}

export interface CreateClasseRequest {
    nom: string;
    niveau_id: string;
    enseignant_id?: string;
    annee_scolaire?: string;
}

export interface UpdateClasseRequest {
    nom?: string;
    niveau_id?: string;
    enseignant_id?: string;
    annee_scolaire?: string;
}

// ==========================================
// API CLIENT
// ==========================================

export const api = {
    // NIVEAUX
    getNiveaux: () => invoke<Niveau[]>("get_niveaux"),
    getNiveau: (id: string) => invoke<Niveau>("get_niveau", { id }),
    createNiveau: (data: CreateNiveauRequest) => invoke<Niveau>("create_niveau", { request: data }),
    updateNiveau: (id: string, data: UpdateNiveauRequest) => invoke<Niveau>("update_niveau", { id, request: data }),
    deleteNiveau: (id: string) => invoke<string>("delete_niveau", { id }),

    // ENSEIGNANTS
    getEnseignants: (search?: string) => invoke<Enseignant[]>("get_enseignants", { search }),
    getEnseignant: (id: string) => invoke<Enseignant>("get_enseignant", { id }),
    createEnseignant: (data: CreateEnseignantRequest) => invoke<Enseignant>("create_enseignant", { request: data }),
    updateEnseignant: (id: string, data: UpdateEnseignantRequest) => invoke<Enseignant>("update_enseignant", { id, request: data }),
    deleteEnseignant: (id: string) => invoke<string>("delete_enseignant", { id }),

    // CLASSES
    getClasses: () => invoke<ClasseListItem[]>("get_classes"),
    getClasse: (id: string) => invoke<Classe>("get_classe", { id }),
    createClasse: (data: CreateClasseRequest) => invoke<Classe>("create_classe", { request: data }),
    updateClasse: (id: string, data: UpdateClasseRequest) => invoke<Classe>("update_classe", { id, request: data }),
    deleteClasse: (id: string) => invoke<string>("delete_classe", { id }),
};

// ==========================================
// INSCRIPTIONS TYPES
// ==========================================

export interface InscriptionDetail {
    id: string;
    eleve_id: string;
    eleve_nom: string;
    eleve_prenom: string;
    eleve_photo?: string;
    classe_id: string;
    classe_nom: string;
    niveau_nom: string;
    date_inscription: string;
    active: boolean;
}

export interface EleveInClasse {
    id: string;
    eleve_id: string;
    eleve_nom: string;
    eleve_prenom: string;
    eleve_photo?: string;
    date_inscription: string;
}

export interface ClasseForSelect {
    id: string;
    nom: string;
    niveau_nom: string;
}

// ==========================================
// INSCRIPTIONS API
// ==========================================

export const inscriptionsApi = {
    getByEleve: (eleveId: string) =>
        invoke<InscriptionDetail | null>("get_inscription_by_eleve", { eleveId }),

    getByClasse: (classeId: string) =>
        invoke<EleveInClasse[]>("get_inscriptions_by_classe", { classeId }),

    create: (eleveId: string, classeId: string) =>
        invoke<{ id: string }>("create_inscription", { eleveId, classeId }),

    delete: (id: string) =>
        invoke<void>("delete_inscription", { id }),

    updateClasse: (eleveId: string, classeId: string) =>
        invoke<{ id: string }>("update_inscription_classe", { eleveId, classeId }),

    getClassesForSelect: () =>
        invoke<[string, string, string][]>("get_classes_for_select"),
};
