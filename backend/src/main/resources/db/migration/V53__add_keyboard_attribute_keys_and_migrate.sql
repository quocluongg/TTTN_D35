-- V51__add_keyboard_attribute_keys_and_migrate.sql
-- Bổ sung key thông số cho bàn phím (phu-kien-linh-kien) còn thiếu sau V50.
--   * Thêm key canonical (idempotent ON CONFLICT DO NOTHING).
--   * Migrate từ product_specifications sang product_attribute_values
--     chỉ cho category phu-kien-linh-kien, dòng (product_id, attribute_key_id)
--     chưa tồn tại, dedup theo (product_id, attribute_key_id, spec_value).

------------------------------------------------------------
-- 1. Thêm product_attribute_keys mới
------------------------------------------------------------
INSERT INTO product_attribute_keys (name, display_name, unit, sort_order) VALUES
    ('Loại bàn phím', 'Loại bàn phím', NULL, 68),
    ('Số phím',       'Số phím',       NULL, 69)
ON CONFLICT (name) DO NOTHING;

------------------------------------------------------------
-- 2. Migrate dữ liệu
------------------------------------------------------------
WITH mapping(spec_key, key_name) AS (VALUES
    ('Loại bàn phím', 'Loại bàn phím'),
    ('Số phím',       'Số phím')
),
selected AS (
    SELECT ps.product_id, pak.id AS attribute_key_id, ps.spec_value, ps.spec_unit
    FROM product_specifications ps
    JOIN products p ON p.id = ps.product_id
    JOIN categories c ON c.id = p.category_id
    JOIN mapping m ON ps.spec_key = m.spec_key
    JOIN product_attribute_keys pak ON pak.name = m.key_name
    WHERE c.slug = 'phu-kien-linh-kien'
      AND NOT EXISTS (
          SELECT 1 FROM product_attribute_values v
          WHERE v.product_id = ps.product_id AND v.attribute_key_id = pak.id
      )
)
INSERT INTO product_attribute_values (product_id, spec_group, attribute_key_id, spec_value, spec_unit)
SELECT product_id, NULL AS spec_group, attribute_key_id, spec_value, MIN(spec_unit) AS spec_unit
FROM selected
GROUP BY product_id, attribute_key_id, spec_value;