DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warranty_status') THEN
        CREATE TYPE warranty_status AS ENUM ('ACTIVE', 'EXPIRED', 'VOID');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warranty_repair_status') THEN
        CREATE TYPE warranty_repair_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS warranty_cards (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_item_id     UUID REFERENCES order_items(id) ON DELETE SET NULL,
    customer_name     VARCHAR(255) NOT NULL DEFAULT '',
    customer_phone    VARCHAR(20) NOT NULL DEFAULT '',
    customer_email    VARCHAR(255),
    product_name      VARCHAR(255) NOT NULL DEFAULT '',
    serial_number     VARCHAR(50) NOT NULL DEFAULT gen_random_uuid()::text,
    purchase_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    warranty_months   INTEGER NOT NULL DEFAULT 12,
    expiry_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    status            warranty_status NOT NULL DEFAULT 'ACTIVE',
    notes             TEXT,
    created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50);
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS purchase_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS warranty_months INTEGER NOT NULL DEFAULT 12;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS expiry_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS status warranty_status NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_warranty_phone ON warranty_cards(customer_phone);
CREATE INDEX IF NOT EXISTS idx_warranty_status ON warranty_cards(status);
CREATE INDEX IF NOT EXISTS idx_warranty_expiry ON warranty_cards(expiry_date);

CREATE TABLE IF NOT EXISTS warranty_histories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warranty_card_id    UUID NOT NULL REFERENCES warranty_cards(id) ON DELETE CASCADE,
    request_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issue_description   TEXT NOT NULL DEFAULT '',
    repair_action       TEXT,
    status              warranty_repair_status NOT NULL DEFAULT 'PENDING',
    handled_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS warranty_card_id UUID REFERENCES warranty_cards(id) ON DELETE CASCADE;
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS issue_description TEXT NOT NULL DEFAULT '';
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS repair_action TEXT;
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS status warranty_repair_status NOT NULL DEFAULT 'PENDING';
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE warranty_histories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_warranty_histories_card ON warranty_histories(warranty_card_id, request_date DESC);
