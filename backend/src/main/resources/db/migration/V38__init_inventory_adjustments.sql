DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_adjust_reason') THEN
        CREATE TYPE inventory_adjust_reason AS ENUM ('STOCK_IN', 'STOCK_OUT', 'DAMAGED', 'AUDIT', 'OTHER');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id      UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    delta           INTEGER NOT NULL DEFAULT 0,
    reason          inventory_adjust_reason NOT NULL DEFAULT 'OTHER',
    note            TEXT,
    adjusted_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS reason inventory_adjust_reason NOT NULL DEFAULT 'OTHER';
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS adjusted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_inv_adj_variant ON inventory_adjustments(variant_id, created_at DESC);
