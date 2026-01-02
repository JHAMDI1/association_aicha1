-- Migration 001: Initial Schema
-- Association Aicha - Gestion des Élèves et Paiements

-- =============================================
-- USERS (Employés avec accès au système)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('ADMIN', 'SECRETAIRE')) NOT NULL DEFAULT 'SECRETAIRE',
    fonction TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- =============================================
-- NIVEAUX (Année 1, Massar, Chatibia, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS niveaux (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    ordre INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- ENSEIGNANTS
-- =============================================
CREATE TABLE IF NOT EXISTS enseignants (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    tel TEXT,
    email TEXT,
    specialite TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- =============================================
-- CLASSES
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    niveau_id TEXT NOT NULL,
    enseignant_id TEXT,
    annee_scolaire TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (niveau_id) REFERENCES niveaux(id),
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id)
);

-- =============================================
-- ELEVES
-- =============================================
CREATE TABLE IF NOT EXISTS eleves (
    id TEXT PRIMARY KEY,
    code_matricule TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    date_naissance TEXT,
    sexe TEXT CHECK(sexe IN ('M', 'F')),
    photo_path TEXT,
    tuteur_nom TEXT,
    tuteur_tel TEXT,
    tuteur_cin TEXT,
    adresse TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_eleves_nom ON eleves(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(code_matricule);

-- =============================================
-- INSCRIPTIONS (Lien Élève <-> Classe)
-- =============================================
CREATE TABLE IF NOT EXISTS inscriptions (
    id TEXT PRIMARY KEY,
    eleve_id TEXT NOT NULL,
    classe_id TEXT NOT NULL,
    date_inscription TEXT DEFAULT (datetime('now')),
    active INTEGER DEFAULT 1,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    FOREIGN KEY (classe_id) REFERENCES classes(id),
    UNIQUE(eleve_id, classe_id)
);

-- =============================================
-- RECUS (Paiements reçus)
-- =============================================
CREATE TABLE IF NOT EXISTS recus (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    date_operation TEXT DEFAULT (datetime('now')),
    type_paiement TEXT CHECK(type_paiement IN ('MENSUALITE', 'INSCRIPTION', 'ASSURANCE', 'DON', 'AUTRE')) NOT NULL,
    montant_total REAL NOT NULL,
    mode_paiement TEXT CHECK(mode_paiement IN ('ESPECES', 'CHEQUE', 'VIREMENT')) DEFAULT 'ESPECES',
    eleve_id TEXT,
    donneur_externe TEXT,
    user_id TEXT NOT NULL,
    etat TEXT CHECK(etat IN ('EN_ATTENTE', 'VALIDE', 'ANNULE')) DEFAULT 'VALIDE',
    commentaire TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_recus_date ON recus(date_operation);
CREATE INDEX IF NOT EXISTS idx_recus_eleve ON recus(eleve_id);

-- =============================================
-- LIGNES DE PAIEMENT (Détail des mois payés)
-- =============================================
CREATE TABLE IF NOT EXISTS lignes_paiement (
    id TEXT PRIMARY KEY,
    recu_id TEXT NOT NULL,
    eleve_id TEXT NOT NULL,
    mois INTEGER CHECK(mois BETWEEN 1 AND 12),
    annee INTEGER NOT NULL,
    montant REAL NOT NULL,
    FOREIGN KEY (recu_id) REFERENCES recus(id),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    UNIQUE(eleve_id, mois, annee)
);

-- =============================================
-- DEPENSES (Ordres de paiement / Sorties)
-- =============================================
CREATE TABLE IF NOT EXISTS depenses (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    date_operation TEXT DEFAULT (datetime('now')),
    beneficiaire TEXT NOT NULL,
    motif TEXT,
    montant REAL NOT NULL,
    type_depense TEXT CHECK(type_depense IN ('FACTURE', 'AUTRE')) DEFAULT 'AUTRE',
    piece_jointe_path TEXT,
    etat TEXT CHECK(etat IN ('BROUILLON', 'EN_ATTENTE', 'VALIDE', 'REJETE')) DEFAULT 'EN_ATTENTE',
    cree_par TEXT NOT NULL,
    valide_par TEXT,
    date_validation TEXT,
    commentaire TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (cree_par) REFERENCES users(id),
    FOREIGN KEY (valide_par) REFERENCES users(id)
);

-- =============================================
-- DONNEURS (Personnes externes faisant des dons)
-- =============================================
CREATE TABLE IF NOT EXISTS donneurs (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT,
    tel TEXT,
    cin TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- MESSAGES (Communication interne)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    expediteur_id TEXT NOT NULL,
    destinataire_id TEXT NOT NULL,
    contenu TEXT NOT NULL,
    vu INTEGER DEFAULT 0,
    date_envoi TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (expediteur_id) REFERENCES users(id),
    FOREIGN KEY (destinataire_id) REFERENCES users(id)
);

-- =============================================
-- AUDIT LOGS (Traçabilité)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entite TEXT NOT NULL,
    entite_id TEXT,
    ancien_valeur TEXT,
    nouveau_valeur TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- =============================================
-- SEED DATA (Données initiales)
-- =============================================

-- Note: Admin user is created by Rust code with proper password hash at startup

-- Niveaux par défaut
INSERT OR IGNORE INTO niveaux (id, nom, ordre) VALUES 
    ('niv-001', 'Année 1', 1),
    ('niv-002', 'Année 2', 2),
    ('niv-003', 'Année 3', 3),
    ('niv-004', 'Année 4', 4),
    ('niv-005', 'Année 5', 5),
    ('niv-006', 'Massar 1', 10),
    ('niv-007', 'Massar 2', 11),
    ('niv-008', 'Massar 3', 12),
    ('niv-009', 'Massar 4', 13),
    ('niv-010', 'Massar 5', 14),
    ('niv-011', 'Chatibia', 20);
