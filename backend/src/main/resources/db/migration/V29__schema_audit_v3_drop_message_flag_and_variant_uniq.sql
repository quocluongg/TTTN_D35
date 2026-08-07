-- V29__schema_audit_v3_drop_message_flag_and_variant_uniq.sql
-- Idempotent Migration: Drop legacy 0-row message_flag table (replaced by rag_feedbacks) and create unique variant attributes index.

------------------------------------------------------------
-- 1. Drop Legacy message_flag Table (Direction A confirmed)
------------------------------------------------------------
DROP TABLE IF EXISTS public.message_flag CASCADE;

------------------------------------------------------------
-- 2. Unique Constraint for Active Variant Attributes
------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_attrs_uniq
  ON public.product_variants (product_id, attributes)
  WHERE is_active = true AND attributes IS NOT NULL;
