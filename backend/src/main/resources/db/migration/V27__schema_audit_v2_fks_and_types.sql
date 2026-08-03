-- V27__schema_audit_v2_fks_and_types.sql
-- Idempotent Migration: Restore lost FKs to profiles, fix home_featured_category types to UUID, and unique variant attributes.

------------------------------------------------------------
-- 1. Restore Lost FKs to profiles
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation') THEN
    ALTER TABLE public.conversation DROP CONSTRAINT IF EXISTS conversation_user_id_fkey;
    ALTER TABLE public.conversation ADD CONSTRAINT conversation_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_flag') THEN
    ALTER TABLE public.message_flag DROP CONSTRAINT IF EXISTS message_flag_flagged_by_fkey;
    ALTER TABLE public.message_flag ADD CONSTRAINT message_flag_flagged_by_fkey 
      FOREIGN KEY (flagged_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

------------------------------------------------------------
-- 2. Fix Data Types in home_featured_category Tables
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'home_featured_category') THEN
    ALTER TABLE public.home_featured_category DROP CONSTRAINT IF EXISTS home_featured_category_category_id_fkey;
    ALTER TABLE public.home_featured_category 
      ALTER COLUMN category_id TYPE uuid USING (CASE WHEN category_id IS NULL THEN NULL ELSE category_id::text::uuid END);
    ALTER TABLE public.home_featured_category ADD CONSTRAINT home_featured_category_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'home_featured_category_pinned_product') THEN
    ALTER TABLE public.home_featured_category_pinned_product DROP CONSTRAINT IF EXISTS home_featured_category_pinned_product_product_id_fkey;
    ALTER TABLE public.home_featured_category_pinned_product 
      ALTER COLUMN product_id TYPE uuid USING (CASE WHEN product_id IS NULL THEN NULL ELSE product_id::text::uuid END);
    ALTER TABLE public.home_featured_category_pinned_product ADD CONSTRAINT home_featured_category_pinned_product_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

------------------------------------------------------------
-- 3. Unique Constraint for Active Variant Attributes
------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_attrs_uniq
  ON public.product_variants (product_id, attributes)
  WHERE is_active = true AND attributes IS NOT NULL;
