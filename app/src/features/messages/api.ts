import { invoke } from "@tauri-apps/api/core";

export interface Message {
    id: string;
    expediteur_id: string;
    expediteur_nom: string;
    expediteur_prenom: string;
    destinataire_id: string;
    destinataire_nom: string;
    destinataire_prenom: string;
    contenu: string;
    vu: boolean;
    date_envoi: string;
}

export interface CreateMessageRequest {
    destinataire_id: string;
    contenu: string;
}

export const messagesApi = {
    getMyMessages: () => invoke<Message[]>("get_my_messages"),
    getUnreadCount: () => invoke<number>("get_unread_count"),
    send: (request: CreateMessageRequest) => invoke<Message>("send_message", { request }),
    markRead: (messageId: string) => invoke<void>("mark_message_read", { messageId }),
    delete: (messageId: string) => invoke<void>("delete_message", { messageId }),
};
