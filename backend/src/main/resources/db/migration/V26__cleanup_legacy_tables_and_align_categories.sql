-- V26__cleanup_legacy_tables_and_align_categories.sql
-- Idempotent Migration: Drop legacy 0-row tables and align category mapping model with primary flag.

------------------------------------------------------------
-- 1. Drop Unused Legacy Tables (Safe: 0 Rows verified)
------------------------------------------------------------
DROP TABLE IF EXISTS public.profile CASCADE;
DROP TABLE IF EXISTS public."order" CASCADE;
DROP TABLE IF EXISTS public.order_item CASCADE;
DROP TABLE IF EXISTS public.campaign CASCADE;
DROP TABLE IF EXISTS public.campaign_item CASCADE;
DROP TABLE IF EXISTS public.product_chunk CASCADE;
DROP TABLE IF EXISTS public.warranty_card CASCADE;
DROP TABLE IF EXISTS public.warranty_history CASCADE;
DROP TABLE IF EXISTS public.payment_transaction CASCADE;

------------------------------------------------------------
-- 2. Align Category Mapping Model
------------------------------------------------------------
DO $$
BEGIN
  -- Ensure product_category_mapping table exists with UUID types
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_category_mapping') THEN
    CREATE TABLE product_category_mapping (
      product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );
  END IF;

  -- Add is_primary column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_category_mapping' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE product_category_mapping ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Migrate existing products.category_id mapping to product_category_mapping marked as is_primary = true
INSERT INTO product_category_mapping (product_id, category_id, is_primary)
SELECT p.id, p.category_id, true
FROM products p
WHERE p.category_id IS NOT NULL
ON CONFLICT (product_id, category_id) 
DO UPDATE SET is_primary = true;

-- Index for primary category lookup performance
CREATE INDEX IF NOT EXISTS idx_pcm_primary ON product_category_mapping(product_id, is_primary);
