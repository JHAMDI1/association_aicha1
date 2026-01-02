-- Migration 003: Add donneurs table and donation support
-- Donneurs (External Donors)
CREATE TABLE IF NOT EXISTS donneurs (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    commentaire TEXT,
    created_at TEXT NOT NULL
);

-- Add donation support to recus (if columns don't exist)
-- source_type: ELEVE (default), DONNEUR, ANONYME
-- donneur_id: links to donneurs table when source_type is DONNEUR
