-- V28__schema_audit_v2_drops_and_category_alignment.sql
-- Idempotent Migration: Drop legacy RAG chat tables and finalize single category model by dropping product_category_mapping.

------------------------------------------------------------
-- 1. Drop Legacy RAG Chat Tables (0 Rows verified)
------------------------------------------------------------
DROP TABLE IF EXISTS public.message_product CASCADE;
DROP TABLE IF EXISTS public.message CASCADE;
DROP TABLE IF EXISTS public.conversation CASCADE;

------------------------------------------------------------
-- 2. Finalize Single Category Model (Direction A)
------------------------------------------------------------
DROP TABLE IF EXISTS public.product_category_mapping CASCADE;
