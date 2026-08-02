-- V29__schema_audit_constraints_and_cleanup.sql
-- Idempotent Migration: Fix FKs, add CHECK constraints, enforce NOT NULL, and unique variant attributes.

------------------------------------------------------------
-- 1. Fix Orphaned Foreign Keys
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base') THEN
    ALTER TABLE knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_created_by_fkey;
    ALTER TABLE knowledge_base ADD CONSTRAINT knowledge_base_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

------------------------------------------------------------
-- 2. Add Missing CHECK Constraints
------------------------------------------------------------
DO $$
BEGIN
  -- product_variants constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_price_check') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_price_check CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_stock_check') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_stock_check CHECK (stock >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_discount_percent_check') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_discount_percent_check 
      CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
  END IF;

  -- products constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_discount_percent_check') THEN
    ALTER TABLE products ADD CONSTRAINT products_discount_percent_check 
      CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rating_avg_check') THEN
    ALTER TABLE products ADD CONSTRAINT products_rating_avg_check 
      CHECK (rating_avg >= 0 AND rating_avg <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_review_count_check') THEN
    ALTER TABLE products ADD CONSTRAINT products_review_count_check 
      CHECK (review_count >= 0);
  END IF;
END $$;

------------------------------------------------------------
-- 3. Enforce NOT NULL Constraints for Product Relations
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_specifications') THEN
    ALTER TABLE product_specifications ALTER COLUMN product_id SET NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_chunks') THEN
    ALTER TABLE product_chunks ALTER COLUMN product_id SET NOT NULL;
  END IF;
END $$;

------------------------------------------------------------
-- 4. Unique Constraint for Active Variant Attributes
------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_attrs_uniq
  ON product_variants (product_id, attributes)
  WHERE is_active = true AND attributes IS NOT NULL;
