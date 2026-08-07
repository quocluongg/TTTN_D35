-- V30__add_product_attribute_keys.sql
-- Tạo bảng lookup product_attribute_keys với 13 key chuẩn lấy từ dữ liệu thực tế,
-- thêm cột attribute_key_id vào product_specifications,
-- migrate toàn bộ spec_key cũ (kể cả các key rác/trùng) về đúng canonical key,
-- sau đó drop cột spec_key.

------------------------------------------------------------
-- 1. Tạo bảng product_attribute_keys
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_attribute_keys (
    id           serial       PRIMARY KEY,
    name         varchar(255) NOT NULL UNIQUE,
    display_name varchar(255),
    unit         varchar(50),
    sort_order   integer      NOT NULL DEFAULT 0
);

------------------------------------------------------------
-- 2. Seed 13 key chính (tên chính xác khớp với dữ liệu DB hiện có)
--    + 2 key phụ hợp lệ (ít data nhưng có nghĩa thực)
--    + 1 key fallback "Khác" cho các giá trị không rõ ràng
------------------------------------------------------------
INSERT INTO product_attribute_keys (name, display_name, unit, sort_order) VALUES
    ('Loại CPU',                    'Bộ vi xử lý',                   NULL,   1),
    ('Dung lượng RAM',              'Dung lượng RAM',                'GB',    2),
    ('Loại RAM',                    'Loại RAM',                      NULL,    3),
    ('Loại card đồ họa',            'Card đồ họa',                   NULL,    4),
    ('Ổ cứng',                      'Ổ cứng (SSD/HDD)',             'GB',    5),
    ('Kích thước màn hình',         'Kích thước màn hình',           'inch',  6),
    ('Độ phân giải màn hình',       'Độ phân giải màn hình',         NULL,    7),
    ('Công nghệ màn hình',          'Công nghệ màn hình',            NULL,    8),
    ('Pin',                         'Dung lượng pin',                'Wh',    9),
    ('Cổng giao tiếp',              'Cổng kết nối / Giao tiếp',     NULL,   10),
    ('Số khe ram',                  'Số khe RAM mở rộng',            NULL,   11),
    ('Hệ điều hành khi ra mắt',     'Hệ điều hành',                  NULL,   12),
    ('Chip AI',                     'Chip AI tích hợp',              NULL,   13),
    ('Chuẩn kết nối không dây',     'Kết nối không dây (Wi-Fi/BT)', NULL,   14),
    ('Trọng lượng',                 'Trọng lượng',                   'kg',   15),
    ('Khác',                        'Thông số khác',                 NULL,  999)
ON CONFLICT (name) DO NOTHING;

------------------------------------------------------------
-- 3. Thêm cột attribute_key_id (nullable trước để migrate)
------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_specifications'
          AND column_name = 'attribute_key_id'
    ) THEN
        ALTER TABLE product_specifications
            ADD COLUMN attribute_key_id integer;
    END IF;
END $$;

------------------------------------------------------------
-- 4. Migrate: map từng spec_key cũ về đúng canonical key
--    - key chính: map 1-1 theo tên
--    - key rác/trùng: merge về canonical tương đương
------------------------------------------------------------
DO $$
DECLARE
    v_key_id integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_specifications'
          AND column_name = 'spec_key'
    ) THEN
        RETURN; -- Đã chạy rồi, skip
    END IF;

    -- ---- 4a. 13 KEY CHÍNH: map 1-1 ----
    UPDATE product_specifications ps
    SET attribute_key_id = pak.id
    FROM product_attribute_keys pak
    WHERE ps.spec_key = pak.name
      AND ps.attribute_key_id IS NULL;

    -- ---- 4b. KEY RÁC / TRÙNG: merge về canonical ----

    -- "RAM" → "Dung lượng RAM"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Dung lượng RAM';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE spec_key = 'RAM' AND attribute_key_id IS NULL;

    -- "CPU" → "Loại CPU"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Loại CPU';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE spec_key = 'CPU' AND attribute_key_id IS NULL;

    -- "Card đồ họa" → "Loại card đồ họa"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Loại card đồ họa';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE spec_key IN ('Card đồ họa', 'Chip đồ hoạ') AND attribute_key_id IS NULL;

    -- "Chip xử lý" → "Loại CPU"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Loại CPU';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE spec_key = 'Chip xử lý' AND attribute_key_id IS NULL;

    -- "Màn hình" → "Kích thước màn hình"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Kích thước màn hình';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE spec_key = 'Màn hình' AND attribute_key_id IS NULL;

    -- "Hệ điều hành" → "Hệ điều hành khi ra mắt"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Hệ điều hành khi ra mắt';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE spec_key = 'Hệ điều hành' AND attribute_key_id IS NULL;

    -- Còn lại (Thông số, NULL, ...) → "Khác"
    SELECT id INTO v_key_id FROM product_attribute_keys WHERE name = 'Khác';
    UPDATE product_specifications
    SET attribute_key_id = v_key_id
    WHERE attribute_key_id IS NULL;

END $$;

------------------------------------------------------------
-- 5. Enforce NOT NULL + FK sau khi toàn bộ hàng đã có attribute_key_id
------------------------------------------------------------
ALTER TABLE product_specifications
    ALTER COLUMN attribute_key_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'product_specifications_attribute_key_id_fkey'
    ) THEN
        ALTER TABLE product_specifications
            ADD CONSTRAINT product_specifications_attribute_key_id_fkey
            FOREIGN KEY (attribute_key_id)
            REFERENCES product_attribute_keys (id)
            ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_specs_attr_key
    ON product_specifications (attribute_key_id);

------------------------------------------------------------
-- 6. Drop cột spec_key cũ (đã hoàn toàn thay thế bởi attribute_key_id)
------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_specifications'
          AND column_name = 'spec_key'
    ) THEN
        ALTER TABLE product_specifications DROP COLUMN spec_key;
    END IF;
END $$;
