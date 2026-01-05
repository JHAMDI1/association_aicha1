-- Migration 004: User Permissions System
-- Add granular permissions per user per module

CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    module TEXT NOT NULL CHECK(module IN ('eleves', 'paiements', 'depenses', 'donneurs', 'messages', 'classes', 'niveaux', 'enseignants')),
    can_read INTEGER DEFAULT 0,
    can_write INTEGER DEFAULT 0,
    can_validate INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, module)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON user_permissions(module);

-- Initialize permissions for existing admin users
-- Admin has all permissions by default
INSERT OR IGNORE INTO user_permissions (id, user_id, module, can_read, can_write, can_validate)
SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    m.module,
    1 as can_read,
    1 as can_write,
    CASE WHEN m.module = 'depenses' THEN 1 ELSE 0 END as can_validate
FROM users u
CROSS JOIN (
    SELECT 'eleves' as module
    UNION SELECT 'paiements'
    UNION SELECT 'depenses'
    UNION SELECT 'donneurs'
    UNION SELECT 'messages'
    UNION SELECT 'classes'
    UNION SELECT 'niveaux'
    UNION SELECT 'enseignants'
) m
WHERE u.role = 'Admin';
