CREATE TABLE IF NOT EXISTS home_banners (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255),
    image_url   TEXT NOT NULL,
    link_url    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    start_at    TIMESTAMP,
    end_at      TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brand_logos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    logo_url    TEXT NOT NULL,
    website_url TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS home_featured_categories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title        VARCHAR(255),
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'featured_item_type') THEN
        CREATE TYPE featured_item_type AS ENUM ('PRODUCT', 'BRAND');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS home_featured_category_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    featured_category_id    UUID NOT NULL REFERENCES home_featured_categories(id) ON DELETE CASCADE,
    item_type               featured_item_type NOT NULL,
    product_id              UUID REFERENCES products(id) ON DELETE CASCADE,
    brand_logo_id           UUID REFERENCES brand_logos(id) ON DELETE CASCADE,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_item_xor CHECK (
        (item_type = 'PRODUCT' AND product_id IS NOT NULL AND brand_logo_id IS NULL) OR
        (item_type = 'BRAND' AND brand_logo_id IS NOT NULL AND product_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_featured_items_fc ON home_featured_category_items(featured_category_id, sort_order);
