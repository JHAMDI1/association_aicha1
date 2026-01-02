-- Add manual receipt tracking columns
-- Note: SQLite does not support IF NOT EXISTS for columns, so these are handled in Rust code with error suppression
ALTER TABLE recus ADD COLUMN numero_carnet TEXT;
ALTER TABLE recus ADD COLUMN numero_recu_physique TEXT;
