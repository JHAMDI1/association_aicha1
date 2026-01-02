import { invoke } from "@tauri-apps/api/core";

// ==========================================
// TYPES
// ==========================================

export interface Donneur {
    id: string;
    nom: string;
    prenom: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    commentaire?: string;
    created_at: string;
}

export interface DonneurListItem {
    id: string;
    nom: string;
    prenom: string;
    telephone?: string;
    email?: string;
    total_dons: number;
    nombre_dons: number;
}

export interface CreateDonneurRequest {
    nom: string;
    prenom: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    commentaire?: string;
}

export interface UpdateDonneurRequest {
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    commentaire?: string;
}

// ==========================================
// API
// ==========================================

export const donneursApi = {
    /**
     * Get all donors
     */
    getAll: () =>
        invoke<DonneurListItem[]>("get_donneurs"),

    /**
     * Get donor by ID
     */
    getById: (id: string) =>
        invoke<Donneur>("get_donneur", { id }),

    /**
     * Create a new donor
     */
    create: (request: CreateDonneurRequest) =>
        invoke<Donneur>("create_donneur", { request }),

    /**
     * Update an existing donor
     */
    update: (id: string, request: UpdateDonneurRequest) =>
        invoke<Donneur>("update_donneur", { id, request }),

    /**
     * Delete a donor
     */
    delete: (id: string) =>
        invoke<string>("delete_donneur", { id }),

    /**
     * Search donors by name
     */
    search: (query: string) =>
        invoke<DonneurListItem[]>("search_donneurs", { query }),
};
