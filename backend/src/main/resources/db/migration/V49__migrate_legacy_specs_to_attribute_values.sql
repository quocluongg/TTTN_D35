-- V49__migrate_legacy_specs_to_attribute_values.sql
-- Chuyển dữ liệu từ bảng cũ product_specifications (spec_key varchar) sang
-- product_attribute_values (attribute_key_id) — map spec_key -> canonical key.
--
-- Quy tắc:
--   * Chỉ migrate các sản phẩm CHƯA có spec trong product_attribute_values
--     (tránh trùng với 222 sản phẩm đã migrate trước đó).
--   * Map các spec_key nhận diện được sang key canonical (laptop + thiết bị mới).
--   * Key rác/không nhận diện được (tên sản phẩm, "Thông số", "Giá"...) sẽ BỎ (không insert).
--   * Dedup theo (product_id, attribute_key_id, spec_value).
-- Idempotent & an toàn khi bảng product_specifications không tồn tại.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'product_specifications'
    ) THEN
        RETURN; -- Bảng cũ không còn -> skip hoàn toàn
    END IF;
END $$;

WITH mapping(spec_key, key_name) AS (VALUES
    -- === Laptop (canonical đã có) ===
    ('Loại CPU',                'Loại CPU'),
    ('CPU',                     'Loại CPU'),
    ('Chip xử lý',              'Loại CPU'),
    ('Bộ vi xử lý',             'Loại CPU'),
    ('Vi xử lý',                'Loại CPU'),
    ('Bộ xử lý',                'Loại CPU'),
    ('Dung lượng RAM',          'Dung lượng RAM'),
    ('RAM',                     'Dung lượng RAM'),
    ('Loại RAM',                'Loại RAM'),
    ('Loại card đồ họa',        'Loại card đồ họa'),
    ('Ổ cứng',                  'Ổ cứng'),
    ('Kích thước màn hình',     'Kích thước màn hình'),
    ('Màn hình',                'Kích thước màn hình'),
    ('Độ phân giải màn hình',   'Độ phân giải màn hình'),
    ('Độ phân giải',            'Độ phân giải màn hình'),
    ('Công nghệ màn hình',      'Công nghệ màn hình'),
    ('Cổng giao tiếp',          'Cổng giao tiếp'),
    ('Cổng kết nối',            'Cổng giao tiếp'),
    ('Số khe ram',              'Số khe ram'),
    ('Hệ điều hành khi ra mắt', 'Hệ điều hành khi ra mắt'),
    ('Hệ điều hành',            'Hệ điều hành khi ra mắt'),
    ('Chip AI',                 'Chip AI'),
    ('Chuẩn kết nối không dây', 'Chuẩn kết nối không dây'),
    ('Kết nối không dây',       'Chuẩn kết nối không dây'),
    ('Trọng lượng',             'Trọng lượng'),
    -- === Điện thoại / thiết bị mới ===
    ('Camera sau',              'Camera sau'),
    ('Camera chính',            'Camera sau'),
    ('Camera',                  'Camera sau'),
    ('Camera trước',            'Camera trước'),
    ('Camera trước',           'Camera trước'),
    ('Bộ nhớ trong',            'Bộ nhớ trong'),
    ('ROM',                     'Bộ nhớ trong'),
    ('Lưu trữ',                 'Bộ nhớ trong'),
    ('Bộ nhớ',                  'Bộ nhớ trong'),
    ('Chipset',                 'Chipset'),
    ('Chip',                    'Chipset'),
    ('Pin',                     'Pin (mAh)'),
    ('Dung lượng pin',          'Pin (mAh)'),
    ('Dung lượng Pin',          'Pin (mAh)'),
    ('Thẻ SIM',                 'Thẻ SIM'),
    ('SIM',                     'Thẻ SIM'),
    ('Hỗ trợ mạng',             'Hỗ trợ mạng'),
    ('Hỗ trợ 5G',               'Hỗ trợ mạng'),
    ('Kết nối mạng',            'Hỗ trợ mạng'),
    ('Công nghệ NFC',           'Công nghệ NFC'),
    ('NFC',                     'Công nghệ NFC'),
    ('Hãng sản xuất',           'Hãng sản xuất'),
    ('Thời điểm ra mắt',        'Thời điểm ra mắt'),
    ('Thời gian ra mắt',        'Thời điểm ra mắt'),
    ('Tần số quét',             'Tần số quét'),
    ('Sạc nhanh',               'Sạc nhanh'),
    ('Công suất sạc',           'Sạc nhanh'),
    ('Chống nước',              'Chống nước'),
    ('Kháng nước',              'Chống nước'),
    ('Cảm biến',                'Cảm biến'),
    ('Loại cảm biến',           'Cảm biến'),
    ('GPU',                     'GPU')
),
selected AS (
    SELECT ps.product_id, pak.id AS attribute_key_id, ps.spec_value, ps.spec_unit
    FROM product_specifications ps
    JOIN mapping m ON ps.spec_key = m.spec_key
    JOIN product_attribute_keys pak ON pak.name = m.key_name
    WHERE NOT EXISTS (
        SELECT 1 FROM product_attribute_values v WHERE v.product_id = ps.product_id
    )
)
INSERT INTO product_attribute_values (product_id, spec_group, attribute_key_id, spec_value, spec_unit)
SELECT product_id, NULL AS spec_group, attribute_key_id, spec_value, MIN(spec_unit) AS spec_unit
FROM selected
GROUP BY product_id, attribute_key_id, spec_value;
