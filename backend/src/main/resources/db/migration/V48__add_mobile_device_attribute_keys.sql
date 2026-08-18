-- V48__add_mobile_device_attribute_keys.sql
-- Thêm các key thông số chuẩn cho điện thoại / tablet / máy ảnh / phụ kiện.
-- Bổ sung sau V30 (16 key hiện tại chủ yếu dành cho laptop).
-- Idempotent: ON CONFLICT (name) DO NOTHING.

INSERT INTO product_attribute_keys (name, display_name, unit, sort_order) VALUES
    ('Camera sau',          'Camera sau (chính/phụ)',  'MP',  21),
    ('Camera trước',        'Camera trước',            'MP',  22),
    ('Bộ nhớ trong',        'Bộ nhớ trong',            'GB',  23),
    ('Chipset',             'Chip / Vi xử lý (SoC)',   NULL,  24),
    ('Pin (mAh)',           'Dung lượng pin',          'mAh', 25),
    ('Thẻ SIM',             'Thẻ SIM',                 NULL,  26),
    ('Hỗ trợ mạng',         'Mạng & kết nối',          NULL,  27),
    ('Công nghệ NFC',       'NFC',                     NULL,  28),
    ('Hãng sản xuất',       'Hãng sản xuất',           NULL,  29),
    ('Thời điểm ra mắt',    'Thời điểm ra mắt',        NULL,  30),
    ('Tần số quét',         'Tần số quét màn hình',    'Hz',  31),
    ('Sạc nhanh',           'Sạc nhanh',               'W',   32),
    ('Chống nước',          'Chống nước / Kháng bụi',  NULL,  33),
    ('Cảm biến',            'Cảm biến',                NULL,  34),
    ('GPU',                 'Card đồ họa (GPU)',       NULL,  35)
ON CONFLICT (name) DO NOTHING;
