import { invoke } from "@tauri-apps/api/core";

// Types
export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: "ADMIN" | "SECRETAIRE";
    actif: boolean;
}

export interface LoginResponse {
    user: User;
    message: string;
}

export interface CreateUserRequest {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: "ADMIN" | "SECRETAIRE";
}

export interface UpdateUserRequest {
    nom?: string;
    prenom?: string;
    email?: string;
    password?: string;
    role?: "ADMIN" | "SECRETAIRE";
    actif?: boolean;
}

// Auth API
export const authApi = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        return invoke("login", { email, password });
    },

    logout: async (): Promise<string> => {
        return invoke("logout");
    },

    getCurrentUser: async (): Promise<User | null> => {
        return invoke("get_current_user");
    },
};

// Users API
export const usersApi = {
    getAll: async (): Promise<User[]> => {
        return invoke("get_users");
    },

    getById: async (id: string): Promise<User> => {
        return invoke("get_user", { id });
    },

    create: async (request: CreateUserRequest): Promise<User> => {
        return invoke("create_user", { request });
    },

    update: async (id: string, request: UpdateUserRequest): Promise<User> => {
        return invoke("update_user", { id, request });
    },

    delete: async (id: string): Promise<string> => {
        return invoke("delete_user", { id });
    },
};
