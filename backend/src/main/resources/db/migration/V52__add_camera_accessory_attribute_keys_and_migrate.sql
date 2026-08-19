-- V50__add_camera_accessory_attribute_keys_and_migrate.sql
-- Bổ sung key thông số cho máy ảnh (may-anh) và linh kiện/phụ kiện (phu-kien-linh-kien).
-- V49 trước đây bỏ qua gần hết key riêng của 2 nhóm này vì chưa có key canonical.
-- Migration này:
--   * Thêm key canonical mới (idempotent ON CONFLICT DO NOTHING, giống V30/V48).
--   * Map spec_key nguồn -> key canonical (giống bảng mapping của V49).
--   * Chỉ migrate sản phẩm thuộc 2 category mới, và chỉ insert dòng (product_id,
--     attribute_key_id) CHƯA tồn tại -> bổ sung phần thiếu, không đụng dòng V49 đã làm.
--   * Dedup theo (product_id, attribute_key_id, spec_value).
--   * Key rác (tên sản phẩm, giá, tiêu chí so sánh...) được LOẠI BỎ (không map).

------------------------------------------------------------
-- 1. Thêm product_attribute_keys mới
------------------------------------------------------------
INSERT INTO product_attribute_keys (name, display_name, unit, sort_order) VALUES
    -- === Máy ảnh ===
    ('Loại máy ảnh',          'Loại máy ảnh',          NULL,  36),
    ('Loại cảm biến',         'Loại cảm biến',         NULL,  37),
    ('Màn trập',              'Màn trập / Tốc độ màn trập', NULL, 38),
    ('Chế độ lấy nét',        'Chế độ lấy nét',        NULL,  39),
    ('Loại kính ngắm',        'Loại kính ngắm',        NULL,  40),
    ('Loại ống kính',         'Loại ống kính',         NULL,  41),
    ('Khẩu độ',               'Khẩu độ',               NULL,  42),
    ('Tiêu cự',               'Tiêu cự',               'mm',  43),
    ('Zoom quang học',        'Zoom quang học',        'x',   44),
    ('Dải ISO',               'Dải ISO',               NULL,  45),
    ('Kích thước ảnh',        'Độ phân giải ảnh tối đa', 'MP', 46),
    ('Tốc độ chụp liên tục',  'Tốc độ chụp liên tục',  NULL,  47),
    ('Chống rung',            'Chống rung',            NULL,  48),
    ('Quay video',            'Quay video',            NULL,  49),
    ('Dòng camera',           'Dòng camera',           NULL,  50),
    ('Kết nối',               'Cổng & kết nối',        NULL,  51),
    -- === Linh kiện / Phụ kiện ===
    ('Loại tai nghe',         'Loại tai nghe',         NULL,  52),
    ('Công nghệ âm thanh',    'Công nghệ âm thanh',    NULL,  53),
    ('Micro',                 'Micro thu âm',          NULL,  54),
    ('Phương thức điều khiển','Phương thức điều khiển',NULL,  55),
    ('Thời lượng pin',        'Thời lượng pin',        NULL,  56),
    ('Kích thước',            'Kích thước',            NULL,  57),
    ('Chiều dài dây',         'Chiều dài dây',         NULL,  58),
    ('Đầu vào',               'Đầu vào',               NULL,  59),
    ('Đầu ra',                'Đầu ra',                NULL,  60),
    ('Công suất',             'Công suất',             'W',   61),
    ('Cổng kết nối',          'Cổng kết nối',          NULL,  62),
    ('Tiêu chuẩn',            'Tiêu chuẩn / Chứng nhận', NULL, 63),
    ('Chống ồn (ANC)',        'Chống ồn (ANC)',        NULL,  64),
    ('Tương thích',           'Tương thích',           NULL,  65),
    ('Màu sắc',               'Màu sắc',               NULL,  66),
    ('Chất liệu',             'Chất liệu',             NULL,  67)
ON CONFLICT (name) DO NOTHING;

------------------------------------------------------------
-- 2. Migrate dữ liệu từ product_specifications sang product_attribute_values
------------------------------------------------------------
WITH mapping(spec_key, key_name) AS (VALUES
    -- === Máy ảnh ===
    ('Loại máy ảnh',          'Loại máy ảnh'),
    ('Loại máy',              'Loại máy ảnh'),
    ('Loại cảm biến',         'Loại cảm biến'),
    ('Cảm Biến APS-C',        'Loại cảm biến'),
    ('Cảm biến / Ảnh tĩnh',   'Loại cảm biến'),
    ('Màn trập',              'Màn trập'),
    ('Tốc độ màn trập',       'Màn trập'),
    ('Chế độ lấy nét',        'Chế độ lấy nét'),
    ('Hệ thống lấy nét',      'Chế độ lấy nét'),
    ('Khả năng lấy nét',      'Chế độ lấy nét'),
    ('Tốc độ lấy nét',        'Chế độ lấy nét'),
    ('Lấy nét',               'Chế độ lấy nét'),
    ('Loại kính ngắm',        'Loại kính ngắm'),
    ('Loại ống kính',         'Loại ống kính'),
    ('Ống kính',              'Loại ống kính'),
    ('Ống kính Fujifilm XF 23mm F2.8 R WR', 'Loại ống kính'),
    ('Ống kính XC 15-45mm',   'Loại ống kính'),
    ('Lens góc rộng',         'Loại ống kính'),
    ('Ống kính Ultra Wide',   'Loại ống kính'),
    ('Khẩu độ',               'Khẩu độ'),
    ('Tiêu cự',               'Tiêu cự'),
    ('Zoom quang học',        'Zoom quang học'),
    ('Zoom quang',            'Zoom quang học'),
    ('Zoom',                  'Zoom quang học'),
    ('Khả năng Zoom',         'Zoom quang học'),
    ('Zoom tổng thể',         'Zoom quang học'),
    ('Dải ISO',               'Dải ISO'),
    ('Kích thước ảnh',        'Kích thước ảnh'),
    ('Độ phân giải',          'Kích thước ảnh'),
    ('Tốc độ chụp liên tục',  'Tốc độ chụp liên tục'),
    ('Chống rung',            'Chống rung'),
    ('Quay video',            'Quay video'),
    ('Quay Video',            'Quay video'),
    ('Quay phim',             'Quay video'),
    ('Quay phim ban đêm',     'Quay video'),
    ('Độ phân giải video',    'Quay video'),
    ('Video',                 'Quay video'),
    ('Video / FPS',           'Quay video'),
    ('Dòng camera',           'Dòng camera'),
    ('Kết nối',               'Kết nối'),
    ('Kết nối có dây',        'Kết nối'),
    ('USB',                   'Kết nối'),
    -- === Linh kiện / Phụ kiện ===
    ('Loại tai nghe',         'Loại tai nghe'),
    ('Dòng sản phẩm',         'Loại tai nghe'),
    ('Công nghệ âm thanh',    'Công nghệ âm thanh'),
    ('Công nghệ/Đạt chứng nhận', 'Công nghệ âm thanh'),
    ('Chất lượng âm thanh',   'Công nghệ âm thanh'),
    ('Âm thanh',              'Công nghệ âm thanh'),
    ('Màng loa',              'Công nghệ âm thanh'),
    ('Micro',                 'Micro'),
    ('Micro thu âm',          'Micro'),
    ('Phương thức điều khiển','Phương thức điều khiển'),
    ('Thời lượng sử dụng Pin','Thời lượng pin'),
    ('Thời lượng pin',        'Thời lượng pin'),
    ('Thời lượng pin (Tai nghe)', 'Thời lượng pin'),
    ('Thời lượng pin (Kèm hộp)', 'Thời lượng pin'),
    ('Thời gian sử dụng',     'Thời lượng pin'),
    ('Thời gian dùng',        'Thời lượng pin'),
    ('Sử dụng tối đa',        'Thời lượng pin'),
    ('Kích thước',            'Kích thước'),
    ('Kích thước trình điều khiển', 'Kích thước'),
    ('Chiều dài dây',         'Chiều dài dây'),
    ('Khoảng cách kết nối (Độ dài dây)', 'Chiều dài dây'),
    ('Phạm vi kết nối',       'Chiều dài dây'),
    ('Đầu vào',               'Đầu vào'),
    ('Cổng sạc vào',          'Đầu vào'),
    ('Đầu ra',                'Đầu ra'),
    ('Cổng sạc ra',           'Đầu ra'),
    ('Công suất',             'Công suất'),
    ('Công suất sạc',         'Công suất'),
    ('Cổng kết nối',          'Cổng kết nối'),
    ('Cổng tai nghe',         'Cổng kết nối'),
    ('Bluetooth',             'Kết nối'),
    ('Kết nối Bluetooth',     'Kết nối'),
    ('Kết nối đa loa',        'Kết nối'),
    ('Wifi',                  'Kết nối'),
    ('Tiêu chuẩn',            'Tiêu chuẩn'),
    ('Tiêu chuẩn chống nước', 'Tiêu chuẩn'),
    ('Chuẩn kháng nước',      'Tiêu chuẩn'),
    ('Chuẩn chống nước',      'Tiêu chuẩn'),
    ('Chống ồn (ANC)',        'Chống ồn (ANC)'),
    ('Tương thích',           'Tương thích'),
    ('Dùng được cho',         'Tương thích'),
    ('Phù hợp cho',           'Tương thích'),
    ('Màu sắc',               'Màu sắc'),
    ('Chất liệu',             'Chất liệu')
),
selected AS (
    SELECT ps.product_id, pak.id AS attribute_key_id, ps.spec_value, ps.spec_unit
    FROM product_specifications ps
    JOIN products p ON p.id = ps.product_id
    JOIN categories c ON c.id = p.category_id
    JOIN mapping m ON ps.spec_key = m.spec_key
    JOIN product_attribute_keys pak ON pak.name = m.key_name
    WHERE c.slug IN ('may-anh', 'phu-kien-linh-kien')
      AND NOT EXISTS (
          SELECT 1 FROM product_attribute_values v
          WHERE v.product_id = ps.product_id AND v.attribute_key_id = pak.id
      )
)
INSERT INTO product_attribute_values (product_id, spec_group, attribute_key_id, spec_value, spec_unit)
SELECT product_id, NULL AS spec_group, attribute_key_id, spec_value, MIN(spec_unit) AS spec_unit
FROM selected
GROUP BY product_id, attribute_key_id, spec_value;