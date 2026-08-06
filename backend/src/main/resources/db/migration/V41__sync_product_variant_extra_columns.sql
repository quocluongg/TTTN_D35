-- Đồng bộ lại lịch sử Flyway với schema thật trên Supabase (các cột này đã được
-- ALTER trực tiếp trên Supabase từ trước, không qua Flyway). Toàn bộ câu lệnh dùng
-- IF NOT EXISTS / DO-block nên chạy trên DB hiện tại là NO-OP, không đụng data.
-- Mục đích: nếu sau này cần tạo DB mới từ đầu (dev/test/CI), chạy V1..V41 sẽ ra
-- đúng schema thật hiện tại.

-- ===== products =====
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sold_quantity integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS use_case character varying(100),
    ADD COLUMN IF NOT EXISTS discount_percent numeric(5, 2),
    ADD COLUMN IF NOT EXISTS source_url character varying(2000);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_sold_quantity_check'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_sold_quantity_check CHECK (sold_quantity >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_discount_percent_check'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_discount_percent_check
            CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_sold_quantity ON public.products USING btree (sold_quantity DESC);
CREATE INDEX IF NOT EXISTS idx_products_use_case ON public.products USING btree (use_case);

-- ===== product_variants =====
ALTER TABLE public.product_variants
    ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS discount_percent numeric(5, 2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_discount_percent_check'
    ) THEN
        ALTER TABLE public.product_variants
            ADD CONSTRAINT product_variants_discount_percent_check
            CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON public.product_variants USING btree (is_active);

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_attrs_uniq
    ON public.product_variants USING btree (product_id, attributes)
    WHERE (is_active = true AND attributes IS NOT NULL);
