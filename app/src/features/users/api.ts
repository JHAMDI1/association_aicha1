import { invoke } from "@tauri-apps/api/core";

export interface UserPermission {
    id: string;
    user_id: string;
    module: string;
    can_read: boolean;
    can_write: boolean;
    can_validate: boolean;
}

export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: "ADMIN" | "SECRETAIRE";
    actif: boolean;
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

export interface UpdatePermissionsRequest {
    permissions: ModulePermission[];
}

export interface ModulePermission {
    module: string;
    can_read: boolean;
    can_write: boolean;
    can_validate: boolean;
}

export const usersApi = {
    getAll: () => invoke<User[]>("get_users"),
    getOne: (id: string) => invoke<User>("get_user", { id }),
    create: (request: CreateUserRequest) => invoke<User>("create_user", { request }),
    update: (id: string, request: UpdateUserRequest) => invoke<User>("update_user", { id, request }),
    delete: (id: string) => invoke<void>("delete_user", { id }),

    getPermissions: (userId: string) => invoke<UserPermission[]>("get_user_permissions", { userId }),
    updatePermissions: (userId: string, permissions: ModulePermission[]) =>
        invoke<void>("update_user_permissions", { userId, request: { permissions } }),
};

export const MODULES = [
    { id: "eleves", label: "Élèves", icon: "🎓" },
    { id: "paiements", label: "Paiements", icon: "💳" },
    { id: "depenses", label: "Dépenses", icon: "💸" },
    { id: "donneurs", label: "Donneurs", icon: "🎁" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "classes", label: "Classes", icon: "🏫" },
    { id: "niveaux", label: "Niveaux", icon: "📚" },
    { id: "enseignants", label: "Enseignants", icon: "👨‍🏫" },
] as const;
