import { invoke } from "@tauri-apps/api/core";

// Types
export interface Eleve {
    id: string;
    code_matricule: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    sexe?: string;
    photo_path?: string;
    tuteur_nom?: string;
    tuteur_tel?: string;
    tuteur_cin?: string;
    adresse?: string;
    created_at: string;
}

export interface EleveListItem {
    id: string;
    code_matricule: string;
    nom: string;
    prenom: string;
    photo_path?: string;
    classe_nom?: string;
    niveau_nom?: string;
}

export interface CreateEleveRequest {
    nom: string;
    prenom: string;
    date_naissance?: string;
    sexe?: string;
    tuteur_nom?: string;
    tuteur_tel?: string;
    tuteur_cin?: string;
    adresse?: string;
}

export interface UpdateEleveRequest {
    nom?: string;
    prenom?: string;
    date_naissance?: string;
    sexe?: string;
    photo_path?: string;
    tuteur_nom?: string;
    tuteur_tel?: string;
    tuteur_cin?: string;
    adresse?: string;
}

// Eleves API
export const elevesApi = {
    getAll: async (search?: string): Promise<EleveListItem[]> => {
        return invoke("get_eleves", { search });
    },

    getById: async (id: string): Promise<Eleve> => {
        return invoke("get_eleve", { id });
    },

    create: async (request: CreateEleveRequest): Promise<Eleve> => {
        return invoke("create_eleve", { request });
    },

    update: async (id: string, request: UpdateEleveRequest): Promise<Eleve> => {
        return invoke("update_eleve", { id, request });
    },

    delete: async (id: string): Promise<string> => {
        return invoke("delete_eleve", { id });
    },

    uploadPhoto: async (eleveId: string, photoBase64: string): Promise<string> => {
        return invoke("upload_photo", { eleveId, photoBase64 });
    },
};
