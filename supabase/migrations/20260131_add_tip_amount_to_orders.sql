-- Migration: Ajouter la colonne tip_amount à la table orders
-- Date: 2026-01-31

-- Ajouter la colonne tip_amount (pourboire) à la table orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;

-- Ajouter la colonne notes si elle n'existe pas
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN orders.tip_amount IS 'Montant du pourboire en FCFA';
COMMENT ON COLUMN orders.notes IS 'Notes/instructions spéciales du client';
