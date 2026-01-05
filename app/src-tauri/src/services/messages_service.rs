use crate::database::get_connection;
use crate::errors::AppError;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ============================================
// MODELS
// ============================================

// Message model (full details) - Currently unused, listing view uses MessageListItem
// #[derive(Debug, Serialize, Deserialize)]
// pub struct Message {
//     pub id: String,
//     pub expediteur_id: String,
//     pub destinataire_id: String,
//     pub contenu: String,
//     pub lu: bool,
//     pub created_at: String,
// }

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageListItem {
    pub id: String,
    pub expediteur_id: String,
    pub expediteur_nom: String,
    pub expediteur_prenom: String,
    pub destinataire_id: String,
    pub destinataire_nom: String,
    pub destinataire_prenom: String,
    pub contenu: String,
    pub vu: bool,
    pub date_envoi: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMessageRequest {
    pub destinataire_id: String,
    pub contenu: String,
}

// ============================================
// SERVICES
// ============================================

/// Create a new message
pub fn create_message(request: CreateMessageRequest, expediteur_id: &str) -> Result<MessageListItem, AppError> {
    println!("[MESSAGES] 📨 Creating message from {} to {}", expediteur_id, request.destinataire_id);
    
    let conn = get_connection();
    let id = Uuid::new_v4().to_string();
    
    // Validate recipient exists
    let recipient_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM users WHERE id = ?",
        params![&request.destinataire_id],
        |row| row.get(0),
    )?;
    
    if !recipient_exists {
        return Err(AppError::NotFound("Destinataire introuvable".to_string()));
    }
    
    // Insert message
    conn.execute(
        r#"
        INSERT INTO messages (id, expediteur_id, destinataire_id, contenu, vu, date_envoi)
        VALUES (?, ?, ?, ?, 0, datetime('now'))
        "#,
        params![&id, expediteur_id, &request.destinataire_id, &request.contenu],
    )?;
    
    // Return full message details
    get_message_by_id(&id)
}

/// Get all messages received by a user
pub fn get_messages_received(user_id: &str) -> Result<Vec<MessageListItem>, AppError> {
    println!("[MESSAGES] 📬 Fetching messages for user {}", user_id);
    
    let conn = get_connection();
    
    let mut stmt = conn.prepare(
        r#"
        SELECT 
            m.id,
            m.expediteur_id,
            u_exp.nom as expediteur_nom,
            u_exp.prenom as expediteur_prenom,
            m.destinataire_id,
            u_dest.nom as destinataire_nom,
            u_dest.prenom as destinataire_prenom,
            m.contenu,
            m.vu,
            m.date_envoi
        FROM messages m
        INNER JOIN users u_exp ON m.expediteur_id = u_exp.id
        INNER JOIN users u_dest ON m.destinataire_id = u_dest.id
        WHERE m.destinataire_id = ?
        ORDER BY m.date_envoi DESC
        "#,
    )?;
    
    let messages = stmt.query_map(params![user_id], |row| {
        Ok(MessageListItem {
            id: row.get(0)?,
            expediteur_id: row.get(1)?,
            expediteur_nom: row.get(2)?,
            expediteur_prenom: row.get(3)?,
            destinataire_id: row.get(4)?,
            destinataire_nom: row.get(5)?,
            destinataire_prenom: row.get(6)?,
            contenu: row.get(7)?,
            vu: row.get::<_, i32>(8)? == 1,
            date_envoi: row.get(9)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    println!("[MESSAGES] ✅ Found {} messages", messages.len());
    Ok(messages)
}

/// Get count of unread messages for a user
pub fn get_unread_count(user_id: &str) -> Result<i32, AppError> {
    println!("[MESSAGES] 🔔 Counting unread messages for user {}", user_id);
    
    let conn = get_connection();
    
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM messages WHERE destinataire_id = ? AND vu = 0",
        params![user_id],
        |row| row.get(0),
    )?;
    
    println!("[MESSAGES] ✅ Unread count: {}", count);
    Ok(count)
}

/// Mark a message as read
pub fn mark_as_read(message_id: &str, user_id: &str) -> Result<(), AppError> {
    println!("[MESSAGES] 👁️ Marking message {} as read", message_id);
    
    let conn = get_connection();
    
    // Verify the message belongs to the user (security check)
    let is_recipient: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM messages WHERE id = ? AND destinataire_id = ?",
        params![message_id, user_id],
        |row| row.get(0),
    )?;
    
    if !is_recipient {
        return Err(AppError::Unauthorized("Vous ne pouvez pas modifier ce message".to_string()));
    }
    
    conn.execute(
        "UPDATE messages SET vu = 1 WHERE id = ?",
        params![message_id],
    )?;
    
    println!("[MESSAGES] ✅ Message marked as read");
    Ok(())
}

/// Delete a message (only recipient can delete)
pub fn delete_message(message_id: &str, user_id: &str) -> Result<(), AppError> {
    println!("[MESSAGES] 🗑️ Deleting message {}", message_id);
    
    let conn = get_connection();
    
    // Verify the message belongs to the user
    let is_recipient: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM messages WHERE id = ? AND destinataire_id = ?",
        params![message_id, user_id],
        |row| row.get(0),
    )?;
    
    if !is_recipient {
        return Err(AppError::Unauthorized("Vous ne pouvez pas supprimer ce message".to_string()));
    }
    
    conn.execute(
        "DELETE FROM messages WHERE id = ?",
        params![message_id],
    )?;
    
    println!("[MESSAGES] ✅ Message deleted");
    Ok(())
}

// ============================================
// HELPERS
// ============================================

fn get_message_by_id(id: &str) -> Result<MessageListItem, AppError> {
    let conn = get_connection();
    
    conn.query_row(
        r#"
        SELECT 
            m.id,
            m.expediteur_id,
            u_exp.nom as expediteur_nom,
            u_exp.prenom as expediteur_prenom,
            m.destinataire_id,
            u_dest.nom as destinataire_nom,
            u_dest.prenom as destinataire_prenom,
            m.contenu,
            m.vu,
            m.date_envoi
        FROM messages m
        INNER JOIN users u_exp ON m.expediteur_id = u_exp.id
        INNER JOIN users u_dest ON m.destinataire_id = u_dest.id
        WHERE m.id = ?
        "#,
        params![id],
        |row| {
            Ok(MessageListItem {
                id: row.get(0)?,
                expediteur_id: row.get(1)?,
                expediteur_nom: row.get(2)?,
                expediteur_prenom: row.get(3)?,
                destinataire_id: row.get(4)?,
                destinataire_nom: row.get(5)?,
                destinataire_prenom: row.get(6)?,
                contenu: row.get(7)?,
                vu: row.get::<_, i32>(8)? == 1,
                date_envoi: row.get(9)?,
            })
        },
    ).map_err(|_| AppError::NotFound("Message introuvable".to_string()))
}
