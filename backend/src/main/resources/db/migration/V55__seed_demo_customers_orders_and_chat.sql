-- V55__seed_demo_customers_orders_and_chat.sql
-- Seed dữ liệu demo toàn diện: khách hàng, đơn hàng, chat, đánh giá, voucher.
-- KHÔNG xóa bất kỳ dữ liệu sản phẩm nào đã có.
-- Idempotent: dùng ON CONFLICT DO NOTHING và kiểm tra trước khi insert.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    v_customer_role_id   UUID;

    -- Khách hàng (10 accounts)
    v_cust1  UUID := '11111111-aaaa-4000-8000-000000000001';
    v_cust2  UUID := '11111111-aaaa-4000-8000-000000000002';
    v_cust3  UUID := '11111111-aaaa-4000-8000-000000000003';
    v_cust4  UUID := '11111111-aaaa-4000-8000-000000000004';
    v_cust5  UUID := '11111111-aaaa-4000-8000-000000000005';
    v_cust6  UUID := '11111111-aaaa-4000-8000-000000000006';
    v_cust7  UUID := '11111111-aaaa-4000-8000-000000000007';
    v_cust8  UUID := '11111111-aaaa-4000-8000-000000000008';
    v_cust9  UUID := '11111111-aaaa-4000-8000-000000000009';
    v_cust10 UUID := '11111111-aaaa-4000-8000-000000000010';

    -- Địa chỉ
    v_addr1  UUID := '22222222-bbbb-4000-8000-000000000001';
    v_addr2  UUID := '22222222-bbbb-4000-8000-000000000002';
    v_addr3  UUID := '22222222-bbbb-4000-8000-000000000003';
    v_addr4  UUID := '22222222-bbbb-4000-8000-000000000004';
    v_addr5  UUID := '22222222-bbbb-4000-8000-000000000005';

    -- Vouchers
    v_voucher1 UUID := '33333333-cccc-4000-8000-000000000001';
    v_voucher2 UUID := '33333333-cccc-4000-8000-000000000002';

    -- Orders
    v_ord1  UUID := '44444444-dddd-4000-8000-000000000001';
    v_ord2  UUID := '44444444-dddd-4000-8000-000000000002';
    v_ord3  UUID := '44444444-dddd-4000-8000-000000000003';
    v_ord4  UUID := '44444444-dddd-4000-8000-000000000004';
    v_ord5  UUID := '44444444-dddd-4000-8000-000000000005';
    v_ord6  UUID := '44444444-dddd-4000-8000-000000000006';
    v_ord7  UUID := '44444444-dddd-4000-8000-000000000007';
    v_ord8  UUID := '44444444-dddd-4000-8000-000000000008';
    v_ord9  UUID := '44444444-dddd-4000-8000-000000000009';
    v_ord10 UUID := '44444444-dddd-4000-8000-000000000010';
    v_ord11 UUID := '44444444-dddd-4000-8000-000000000011';
    v_ord12 UUID := '44444444-dddd-4000-8000-000000000012';
    v_ord13 UUID := '44444444-dddd-4000-8000-000000000013';
    v_ord14 UUID := '44444444-dddd-4000-8000-000000000014';
    v_ord15 UUID := '44444444-dddd-4000-8000-000000000015';
    v_ord16 UUID := '44444444-dddd-4000-8000-000000000016';
    v_ord17 UUID := '44444444-dddd-4000-8000-000000000017';
    v_ord18 UUID := '44444444-dddd-4000-8000-000000000018';
    v_ord19 UUID := '44444444-dddd-4000-8000-000000000019';
    v_ord20 UUID := '44444444-dddd-4000-8000-000000000020';

    -- Order Items
    v_oi1  UUID := '55555555-eeee-4000-8000-000000000001';
    v_oi2  UUID := '55555555-eeee-4000-8000-000000000002';
    v_oi3  UUID := '55555555-eeee-4000-8000-000000000003';
    v_oi4  UUID := '55555555-eeee-4000-8000-000000000004';
    v_oi5  UUID := '55555555-eeee-4000-8000-000000000005';
    v_oi6  UUID := '55555555-eeee-4000-8000-000000000006';
    v_oi7  UUID := '55555555-eeee-4000-8000-000000000007';
    v_oi8  UUID := '55555555-eeee-4000-8000-000000000008';
    v_oi9  UUID := '55555555-eeee-4000-8000-000000000009';
    v_oi10 UUID := '55555555-eeee-4000-8000-000000000010';
    v_oi11 UUID := '55555555-eeee-4000-8000-000000000011';
    v_oi12 UUID := '55555555-eeee-4000-8000-000000000012';
    v_oi13 UUID := '55555555-eeee-4000-8000-000000000013';
    v_oi14 UUID := '55555555-eeee-4000-8000-000000000014';
    v_oi15 UUID := '55555555-eeee-4000-8000-000000000015';
    v_oi16 UUID := '55555555-eeee-4000-8000-000000000016';
    v_oi17 UUID := '55555555-eeee-4000-8000-000000000017';
    v_oi18 UUID := '55555555-eeee-4000-8000-000000000018';
    v_oi19 UUID := '55555555-eeee-4000-8000-000000000019';
    v_oi20 UUID := '55555555-eeee-4000-8000-000000000020';
    v_oi21 UUID := '55555555-eeee-4000-8000-000000000021';
    v_oi22 UUID := '55555555-eeee-4000-8000-000000000022';
    v_oi23 UUID := '55555555-eeee-4000-8000-000000000023';
    v_oi24 UUID := '55555555-eeee-4000-8000-000000000024';
    v_oi25 UUID := '55555555-eeee-4000-8000-000000000025';

    -- Chat conversations
    v_conv1  UUID := '66666666-ffff-4000-8000-000000000001';
    v_conv2  UUID := '66666666-ffff-4000-8000-000000000002';
    v_conv3  UUID := '66666666-ffff-4000-8000-000000000003';
    v_conv4  UUID := '66666666-ffff-4000-8000-000000000004';
    v_conv5  UUID := '66666666-ffff-4000-8000-000000000005';
    v_conv6  UUID := '66666666-ffff-4000-8000-000000000006';
    v_conv7  UUID := '66666666-ffff-4000-8000-000000000007';
    v_conv8  UUID := '66666666-ffff-4000-8000-000000000008';
    v_conv9  UUID := '66666666-ffff-4000-8000-000000000009';
    v_conv10 UUID := '66666666-ffff-4000-8000-000000000010';
    v_conv11 UUID := '66666666-ffff-4000-8000-000000000011';
    v_conv12 UUID := '66666666-ffff-4000-8000-000000000012';
    v_conv13 UUID := '66666666-ffff-4000-8000-000000000013';
    v_conv14 UUID := '66666666-ffff-4000-8000-000000000014';
    v_conv15 UUID := '66666666-ffff-4000-8000-000000000015';
    v_conv16 UUID := '66666666-ffff-4000-8000-000000000016';
    v_conv17 UUID := '66666666-ffff-4000-8000-000000000017';
    v_conv18 UUID := '66666666-ffff-4000-8000-000000000018';
    v_conv19 UUID := '66666666-ffff-4000-8000-000000000019';
    v_conv20 UUID := '66666666-ffff-4000-8000-000000000020';

    -- KB versions
    v_kb_v1  UUID := '77777777-aaaa-4000-8000-000000000001';
    v_kb_v2  UUID := '77777777-aaaa-4000-8000-000000000002';

    -- Products (lấy động từ DB)
    v_prod_laptop  UUID;
    v_prod_phone   UUID;
    v_prod_samsung UUID;
    v_prod_cam     UUID;
    v_prod_akko    UUID;
    v_prod_airpods UUID;
    v_prod_msi     UUID;
    v_prod_dell    UUID;
    v_prod_asus    UUID;

    -- Variants
    v_var_laptop1  UUID;
    v_var_phone1   UUID;
    v_var_samsung1 UUID;
    v_var_cam1     UUID;
    v_var_akko1    UUID;
    v_var_airpods1 UUID;
    v_var_msi1     UUID;
    v_var_dell1    UUID;
    v_var_asus1    UUID;

    v_bcrypt_pass  TEXT := '$2b$10$bqNarYOEFz6VPWZeq5fIeuTjXJdSPIrycLzcIeoS06OQoYIKxKcoW';

BEGIN
    -- 0. Roles
    SELECT id INTO v_customer_role_id FROM roles WHERE name = 'CUSTOMER' LIMIT 1;
    IF v_customer_role_id IS NULL THEN
        RAISE NOTICE 'CUSTOMER role not found, skipping V55 seed';
        RETURN;
    END IF;

    -- 1. Lấy sản phẩm thực tế từ DB (tìm theo tên, fallback theo thứ tự)
    SELECT p.id INTO v_prod_laptop  FROM products p WHERE p.name ILIKE '%ASUS ZenBook%' ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_phone   FROM products p WHERE p.name ILIKE '%iPhone 15%'    ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_samsung FROM products p WHERE p.name ILIKE '%Galaxy S24%'   ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_cam     FROM products p WHERE p.name ILIKE '%Camera%'       ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_akko    FROM products p WHERE p.name ILIKE '%Akko%'         ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_airpods FROM products p WHERE p.name ILIKE '%AirPods%'      ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_msi     FROM products p WHERE p.name ILIKE '%MSI%'          ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_dell    FROM products p WHERE p.name ILIKE '%Dell%'         ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_asus    FROM products p WHERE p.name ILIKE '%ASUS%'         ORDER BY p.created_at LIMIT 1;

    -- Fallback
    IF v_prod_laptop  IS NULL THEN SELECT id INTO v_prod_laptop  FROM products ORDER BY created_at LIMIT 1;           END IF;
    IF v_prod_phone   IS NULL THEN SELECT id INTO v_prod_phone   FROM products ORDER BY created_at OFFSET 1 LIMIT 1;  END IF;
    IF v_prod_samsung IS NULL THEN SELECT id INTO v_prod_samsung FROM products ORDER BY created_at OFFSET 2 LIMIT 1;  END IF;
    IF v_prod_cam     IS NULL THEN v_prod_cam     := v_prod_laptop;  END IF;
    IF v_prod_akko    IS NULL THEN SELECT id INTO v_prod_akko    FROM products ORDER BY created_at OFFSET 3 LIMIT 1;  END IF;
    IF v_prod_airpods IS NULL THEN SELECT id INTO v_prod_airpods FROM products ORDER BY created_at OFFSET 4 LIMIT 1;  END IF;
    IF v_prod_msi     IS NULL THEN SELECT id INTO v_prod_msi     FROM products ORDER BY created_at OFFSET 5 LIMIT 1;  END IF;
    IF v_prod_dell    IS NULL THEN SELECT id INTO v_prod_dell    FROM products ORDER BY created_at OFFSET 6 LIMIT 1;  END IF;
    IF v_prod_asus    IS NULL THEN v_prod_asus    := v_prod_laptop;  END IF;

    -- Biến thể đầu tiên của mỗi sản phẩm
    SELECT id INTO v_var_laptop1  FROM product_variants WHERE product_id = v_prod_laptop  ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_phone1   FROM product_variants WHERE product_id = v_prod_phone   ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_samsung1 FROM product_variants WHERE product_id = v_prod_samsung ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_cam1     FROM product_variants WHERE product_id = v_prod_cam     ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_akko1    FROM product_variants WHERE product_id = v_prod_akko    ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_airpods1 FROM product_variants WHERE product_id = v_prod_airpods ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_msi1     FROM product_variants WHERE product_id = v_prod_msi     ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_dell1    FROM product_variants WHERE product_id = v_prod_dell    ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_asus1    FROM product_variants WHERE product_id = v_prod_asus    ORDER BY created_at LIMIT 1;

    -- 2. Khách hàng (10 profiles)
    INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, phone_number, email_verified, is_active, email_notif, push_notif, system_notif)
    VALUES
        (v_cust1,  'nguyen.thi.lan@gmail.com',  v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Nguyen Thi Lan',   '0901111001', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust2,  'tran.van.hung@gmail.com',   v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Tran Van Hung',    '0901111002', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust3,  'le.thi.mai@gmail.com',      v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Le Thi Mai',       '0901111003', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust4,  'pham.van.duc@gmail.com',    v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Pham Van Duc',     '0901111004', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust5,  'hoang.thi.hoa@gmail.com',   v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Hoang Thi Hoa',    '0901111005', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust6,  'nguyen.van.thanh@gmail.com',v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Nguyen Van Thanh', '0901111006', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust7,  'bui.thi.tuyet@gmail.com',   v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Bui Thi Tuyet',    '0901111007', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust8,  'do.van.khoa@gmail.com',     v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Do Van Khoa',      '0901111008', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust9,  'ngo.thi.bich@gmail.com',    v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Ngo Thi Bich',     '0901111009', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust10, 'vo.van.son@gmail.com',      v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Vo Van Son',       '0901111010', TRUE, TRUE, TRUE, TRUE, TRUE)
    ON CONFLICT (email) DO NOTHING;

    -- 3. Địa chỉ
    INSERT INTO addresses (id, profile_id, full_name, phone, address_line, is_default)
    VALUES
        (v_addr1, v_cust1, 'Nguyen Thi Lan',   '0901111001', '12 Nguyen Trai, Quan 1, TP.HCM',        TRUE),
        (v_addr2, v_cust2, 'Tran Van Hung',     '0901111002', '45 Le Van Luong, Cau Giay, Ha Noi',     TRUE),
        (v_addr3, v_cust3, 'Le Thi Mai',        '0901111003', '88 Hoang Dieu, Hai Chau, Da Nang',      TRUE),
        (v_addr4, v_cust4, 'Pham Van Duc',      '0901111004', '33 Tran Hung Dao, Quan 5, TP.HCM',      TRUE),
        (v_addr5, v_cust5, 'Hoang Thi Hoa',     '0901111005', '17 Dinh Tien Hoang, Binh Thanh, TP.HCM',TRUE)
    ON CONFLICT DO NOTHING;

    -- 4. Knowledge Base Versions
    INSERT INTO knowledge_base_version (id, name, description, chunking_strategy, embedding_model, is_active, created_at, updated_at)
    VALUES
        (v_kb_v1, 'v1.0', 'Knowledge base Q1/2026 - semantic BGE-M3',     'semantic-split',  'BGE-M3',        FALSE, NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'),
        (v_kb_v2, 'v2.0', 'Knowledge base Q2/2026 - paragraph PhoBERT+BGE','paragraph-split', 'PhoBERT+BGE',  TRUE,  NOW() - INTERVAL '30 days', NOW())
    ON CONFLICT DO NOTHING;

    -- 5. Vouchers
    INSERT INTO vouchers (id, code, description, discount_type, discount_value, max_discount_amount, min_order_value, max_usage, max_usage_per_user, used_count, start_time, end_time, is_active)
    VALUES
        (v_voucher1, 'TTSHOP10',   'Giam 10% don tu 5 trieu', 'PERCENT', 10.00,    1500000.00, 5000000.00,  200, 1, 12, NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', TRUE),
        (v_voucher2, 'TTSHOP200K', 'Giam 200k don tu 2 trieu','FIXED',   200000.00, NULL,       2000000.00,  100, 2, 5,  NOW() - INTERVAL '3 days', NOW() + INTERVAL '30 days', TRUE)
    ON CONFLICT (code) DO NOTHING;

    -- 6. Orders (20 đơn hàng)
    INSERT INTO orders (id, user_id, address_id, voucher_id, discount_amount, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, created_at, updated_at)
    VALUES
        (v_ord1,  v_cust1,  v_addr1, NULL,       0,       'Nguyen Thi Lan',    'nguyen.thi.lan@gmail.com',   '0901111001', '12 Nguyen Trai, Quan 1, TP.HCM',         32990000, 'COMPLETED',  'VNPAY',  'PAID',    NOW()-INTERVAL'30 days', NOW()-INTERVAL'25 days'),
        (v_ord2,  v_cust2,  v_addr2, NULL,       0,       'Tran Van Hung',     'tran.van.hung@gmail.com',    '0901111002', '45 Le Van Luong, Cau Giay, Ha Noi',       35990000, 'COMPLETED',  'VNPAY',  'PAID',    NOW()-INTERVAL'28 days', NOW()-INTERVAL'23 days'),
        (v_ord3,  v_cust3,  v_addr3, NULL,       0,       'Le Thi Mai',        'le.thi.mai@gmail.com',       '0901111003', '88 Hoang Dieu, Hai Chau, Da Nang',         23990000, 'COMPLETED',  'VNPAY',  'PAID',    NOW()-INTERVAL'25 days', NOW()-INTERVAL'20 days'),
        (v_ord4,  v_cust4,  v_addr4, NULL,       0,       'Pham Van Duc',      'pham.van.duc@gmail.com',     '0901111004', '33 Tran Hung Dao, Quan 5, TP.HCM',        5990000,  'COMPLETED',  'COD',    'PAID',    NOW()-INTERVAL'22 days', NOW()-INTERVAL'18 days'),
        (v_ord5,  v_cust5,  v_addr5, NULL,       0,       'Hoang Thi Hoa',     'hoang.thi.hoa@gmail.com',    '0901111005', '17 Dinh Tien Hoang, Binh Thanh, TP.HCM', 29990000, 'COMPLETED',  'STRIPE', 'PAID',    NOW()-INTERVAL'20 days', NOW()-INTERVAL'15 days'),
        (v_ord6,  v_cust6,  NULL,    NULL,       0,       'Nguyen Van Thanh',  'nguyen.van.thanh@gmail.com', '0901111006', '78 Cach Mang Thang 8, Quan 3, TP.HCM',   1890000,  'COMPLETED',  'COD',    'PAID',    NOW()-INTERVAL'18 days', NOW()-INTERVAL'13 days'),
        (v_ord7,  v_cust7,  NULL,    NULL,       0,       'Bui Thi Tuyet',     'bui.thi.tuyet@gmail.com',    '0901111007', '22 Pham Ngoc Thach, Quan 3, TP.HCM',      28990000, 'COMPLETED',  'VNPAY',  'PAID',    NOW()-INTERVAL'15 days', NOW()-INTERVAL'10 days'),
        (v_ord8,  v_cust8,  NULL,    NULL,       0,       'Do Van Khoa',       'do.van.khoa@gmail.com',      '0901111008', '99 Hoang Sa, Quan 1, TP.HCM',             34990000, 'COMPLETED',  'VNPAY',  'PAID',    NOW()-INTERVAL'12 days', NOW()-INTERVAL'8 days'),
        (v_ord9,  v_cust9,  NULL,    NULL,       0,       'Ngo Thi Bich',      'ngo.thi.bich@gmail.com',     '0901111009', '15 Dien Bien Phu, Binh Thanh, TP.HCM',   29990000, 'SHIPPED',    'COD',    'PENDING', NOW()-INTERVAL'5 days',  NOW()-INTERVAL'3 days'),
        (v_ord10, v_cust10, NULL,    NULL,       0,       'Vo Van Son',        'vo.van.son@gmail.com',       '0901111010', '60 Vo Thi Sau, Quan 3, TP.HCM',           23990000, 'SHIPPED',    'VNPAY',  'PAID',    NOW()-INTERVAL'4 days',  NOW()-INTERVAL'2 days'),
        (v_ord11, v_cust1,  v_addr1, v_voucher1, 3299000, 'Nguyen Thi Lan',   'nguyen.thi.lan@gmail.com',   '0901111001', '12 Nguyen Trai, Quan 1, TP.HCM',          29691000, 'SHIPPED',    'VNPAY',  'PAID',    NOW()-INTERVAL'3 days',  NOW()-INTERVAL'1 day'),
        (v_ord12, v_cust2,  v_addr2, NULL,       0,       'Tran Van Hung',     'tran.van.hung@gmail.com',    '0901111002', '45 Le Van Luong, Cau Giay, Ha Noi',       5990000,  'PROCESSING', 'COD',    'PENDING', NOW()-INTERVAL'2 days',  NOW()-INTERVAL'1 day'),
        (v_ord13, v_cust3,  v_addr3, NULL,       0,       'Le Thi Mai',        'le.thi.mai@gmail.com',       '0901111003', '88 Hoang Dieu, Hai Chau, Da Nang',         32990000, 'PROCESSING', 'VNPAY',  'PAID',    NOW()-INTERVAL'1 day',   NOW()),
        (v_ord14, v_cust4,  v_addr4, v_voucher2, 200000,  'Pham Van Duc',     'pham.van.duc@gmail.com',     '0901111004', '33 Tran Hung Dao, Quan 5, TP.HCM',        1690000,  'PROCESSING', 'COD',    'PENDING', NOW()-INTERVAL'12 hours',NOW()),
        (v_ord15, v_cust5,  v_addr5, NULL,       0,       'Hoang Thi Hoa',     'hoang.thi.hoa@gmail.com',    '0901111005', '17 Dinh Tien Hoang, Binh Thanh, TP.HCM', 23990000, 'PENDING',    'COD',    'PENDING', NOW()-INTERVAL'6 hours', NOW()),
        (v_ord16, v_cust6,  NULL,    NULL,       0,       'Nguyen Van Thanh',  'nguyen.van.thanh@gmail.com', '0901111006', '78 Cach Mang Thang 8, Quan 3, TP.HCM',   35990000, 'PENDING',    'VNPAY',  'PENDING', NOW()-INTERVAL'3 hours', NOW()),
        (v_ord17, v_cust7,  NULL,    NULL,       0,       'Bui Thi Tuyet',     'bui.thi.tuyet@gmail.com',    '0901111007', '22 Pham Ngoc Thach, Quan 3, TP.HCM',      29990000, 'PENDING',    'COD',    'PENDING', NOW()-INTERVAL'1 hour',  NOW()),
        (v_ord18, v_cust8,  NULL,    NULL,       0,       'Do Van Khoa',       'do.van.khoa@gmail.com',      '0901111008', '99 Hoang Sa, Quan 1, TP.HCM',             28990000, 'CANCELLED',  'COD',    'PENDING', NOW()-INTERVAL'10 days', NOW()-INTERVAL'9 days'),
        (v_ord19, v_cust9,  NULL,    NULL,       0,       'Ngo Thi Bich',      'ngo.thi.bich@gmail.com',     '0901111009', '15 Dien Bien Phu, Binh Thanh, TP.HCM',   32990000, 'CANCELLED',  'VNPAY',  'FAILED',  NOW()-INTERVAL'8 days',  NOW()-INTERVAL'7 days'),
        (v_ord20, v_cust10, NULL,    NULL,       0,       'Vo Van Son',        'vo.van.son@gmail.com',       '0901111010', '60 Vo Thi Sau, Quan 3, TP.HCM',           5990000,  'CANCELLED',  'COD',    'PENDING', NOW()-INTERVAL'6 days',  NOW()-INTERVAL'5 days')
    ON CONFLICT DO NOTHING;

    -- 7. Order Items
    INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, unit_price, quantity, subtotal, created_at)
    VALUES
        (v_oi1,  v_ord1,  v_prod_phone,   v_var_phone1,   'iPhone 15 Pro Max 256GB',  'Titan Tu Nhien 256GB', 32990000,1,32990000, NOW()-INTERVAL'30 days'),
        (v_oi2,  v_ord2,  v_prod_dell,    v_var_dell1,    'Laptop Dell Pro 13 Plus',  'Bac Ultra 7 16GB',     35990000,1,35990000, NOW()-INTERVAL'28 days'),
        (v_oi3,  v_ord3,  v_prod_msi,     v_var_msi1,     'Laptop MSI Cyborg 15',     'Den i5 16GB RTX3050',  23990000,1,23990000, NOW()-INTERVAL'25 days'),
        (v_oi4,  v_ord4,  v_prod_airpods, v_var_airpods1, 'Apple AirPods Pro 2',      'Trang USB-C',          5990000, 1,5990000,  NOW()-INTERVAL'22 days'),
        (v_oi5,  v_ord5,  v_prod_samsung, v_var_samsung1, 'Samsung Galaxy S24 Ultra', 'Titan Den 256GB',      29990000,1,29990000, NOW()-INTERVAL'20 days'),
        (v_oi6,  v_ord6,  v_prod_akko,    v_var_akko1,    'Ban phim co Akko 3098B+',  'Ocean Star Akko Blue', 1890000, 1,1890000,  NOW()-INTERVAL'18 days'),
        (v_oi7,  v_ord7,  v_prod_asus,    v_var_asus1,    'Laptop ASUS ZenBook 14',   'Xam Ryzen7 16GB',      28990000,1,28990000, NOW()-INTERVAL'15 days'),
        (v_oi8,  v_ord8,  v_prod_dell,    v_var_dell1,    'Laptop Dell Pro 13 Plus',  'Bac Ultra 7 16GB',     34990000,1,34990000, NOW()-INTERVAL'12 days'),
        (v_oi9,  v_ord9,  v_prod_samsung, v_var_samsung1, 'Samsung Galaxy S24 Ultra', 'Titan Den 256GB',      29990000,1,29990000, NOW()-INTERVAL'5 days'),
        (v_oi10, v_ord10, v_prod_msi,     v_var_msi1,     'Laptop MSI Cyborg 15',     'Den i5 16GB RTX3050',  23990000,1,23990000, NOW()-INTERVAL'4 days'),
        (v_oi11, v_ord11, v_prod_phone,   v_var_phone1,   'iPhone 15 Pro Max 256GB',  'Titan Tu Nhien 256GB', 32990000,1,32990000, NOW()-INTERVAL'3 days'),
        (v_oi12, v_ord12, v_prod_airpods, v_var_airpods1, 'Apple AirPods Pro 2',      'Trang USB-C',          5990000, 1,5990000,  NOW()-INTERVAL'2 days'),
        (v_oi13, v_ord13, v_prod_phone,   v_var_phone1,   'iPhone 15 Pro Max 256GB',  'Titan Tu Nhien 256GB', 32990000,1,32990000, NOW()-INTERVAL'1 day'),
        (v_oi14, v_ord14, v_prod_akko,    v_var_akko1,    'Ban phim co Akko 3098B+',  'Ocean Star Akko Blue', 1890000, 1,1890000,  NOW()-INTERVAL'12 hours'),
        (v_oi15, v_ord15, v_prod_msi,     v_var_msi1,     'Laptop MSI Cyborg 15',     'Den i5 16GB RTX3050',  23990000,1,23990000, NOW()-INTERVAL'6 hours'),
        (v_oi16, v_ord16, v_prod_dell,    v_var_dell1,    'Laptop Dell Pro 13 Plus',  'Bac Ultra 7 16GB',     35990000,1,35990000, NOW()-INTERVAL'3 hours'),
        (v_oi17, v_ord17, v_prod_samsung, v_var_samsung1, 'Samsung Galaxy S24 Ultra', 'Titan Den 256GB',      29990000,1,29990000, NOW()-INTERVAL'1 hour'),
        (v_oi18, v_ord18, v_prod_asus,    v_var_asus1,    'Laptop ASUS ZenBook 14',   'Xam Ryzen7 16GB',      28990000,1,28990000, NOW()-INTERVAL'10 days'),
        (v_oi19, v_ord19, v_prod_phone,   v_var_phone1,   'iPhone 15 Pro Max 256GB',  'Titan Tu Nhien 256GB', 32990000,1,32990000, NOW()-INTERVAL'8 days'),
        (v_oi20, v_ord20, v_prod_airpods, v_var_airpods1, 'Apple AirPods Pro 2',      'Trang USB-C',          5990000, 1,5990000,  NOW()-INTERVAL'6 days'),
        (v_oi21, v_ord1,  v_prod_akko,    v_var_akko1,    'Ban phim co Akko 3098B+',  'Ocean Star Akko Blue', 1890000, 1,1890000,  NOW()-INTERVAL'30 days'),
        (v_oi22, v_ord5,  v_prod_airpods, v_var_airpods1, 'Apple AirPods Pro 2',      'Trang USB-C',          5990000, 1,5990000,  NOW()-INTERVAL'20 days'),
        (v_oi23, v_ord7,  v_prod_cam,     v_var_cam1,     'Camera IP 360 do',          'Phien ban chuan',     1290000, 1,1290000,  NOW()-INTERVAL'15 days'),
        (v_oi24, v_ord8,  v_prod_akko,    v_var_akko1,    'Ban phim co Akko 3098B+',  'Ocean Star Akko Blue', 1890000, 2,3780000,  NOW()-INTERVAL'12 days'),
        (v_oi25, v_ord2,  v_prod_airpods, v_var_airpods1, 'Apple AirPods Pro 2',      'Trang USB-C',          5990000, 1,5990000,  NOW()-INTERVAL'28 days')
    ON CONFLICT DO NOTHING;

    -- 8. Reviews (15 đánh giá - chỉ cho COMPLETED orders)
    INSERT INTO product_reviews (id, product_id, order_item_id, profile_id, rating, comment, status, created_at)
    VALUES
        (gen_random_uuid(), v_prod_phone,   v_oi1,  v_cust1,  5, 'iPhone 15 Pro Max dung rat tot! Camera cuc dinh, pin trau. Rat hai long!', 'APPROVED', NOW()-INTERVAL'25 days'),
        (gen_random_uuid(), v_prod_dell,    v_oi2,  v_cust2,  4, 'Laptop Dell chat luong cao, hieu nang muot ma. Chi hoi nang mot chut.', 'APPROVED', NOW()-INTERVAL'22 days'),
        (gen_random_uuid(), v_prod_msi,     v_oi3,  v_cust3,  5, 'Laptop gaming MSI ngon lam! Choi game muot, tan nhiet tot.', 'APPROVED', NOW()-INTERVAL'18 days'),
        (gen_random_uuid(), v_prod_airpods, v_oi4,  v_cust4,  4, 'AirPods Pro 2 chong on tuyet voi. Gia hoi cao nhung xung dang.', 'APPROVED', NOW()-INTERVAL'17 days'),
        (gen_random_uuid(), v_prod_samsung, v_oi5,  v_cust5,  5, 'Samsung S24 Ultra dinh qua! Man hinh dep, but S-Pen xin.', 'APPROVED', NOW()-INTERVAL'14 days'),
        (gen_random_uuid(), v_prod_akko,    v_oi6,  v_cust6,  5, 'Ban phim Akko go suong, am thanh phim cuc hay. Mua them roi!', 'APPROVED', NOW()-INTERVAL'12 days'),
        (gen_random_uuid(), v_prod_asus,    v_oi7,  v_cust7,  4, 'ASUS ZenBook mong nhe, OLED dep. Dung cho cong viec rat phu hop.', 'APPROVED', NOW()-INTERVAL'9 days'),
        (gen_random_uuid(), v_prod_dell,    v_oi8,  v_cust8,  3, 'Laptop tot nhung giao hang hoi cham. Pin khoang 6h kha on.', 'APPROVED', NOW()-INTERVAL'7 days'),
        (gen_random_uuid(), v_prod_akko,    v_oi21, v_cust1,  5, 'Mua them cai nua cho vo. Chat luong rat on dinh!', 'APPROVED', NOW()-INTERVAL'24 days'),
        (gen_random_uuid(), v_prod_airpods, v_oi22, v_cust5,  4, 'AirPods Pro dung ket hop iPhone rat tot. Am thanh chuan xac.', 'APPROVED', NOW()-INTERVAL'13 days'),
        (gen_random_uuid(), v_prod_cam,     v_oi23, v_cust7,  4, 'Camera chat luong tot cho gia dinh. Lap dat de dang.', 'PENDING',  NOW()-INTERVAL'8 days'),
        (gen_random_uuid(), v_prod_akko,    v_oi24, v_cust8,  5, 'Mua 2 cai cho van phong. Moi nguoi deu thich go!', 'APPROVED', NOW()-INTERVAL'6 days'),
        (gen_random_uuid(), v_prod_airpods, v_oi25, v_cust2,  5, 'AirPods Pro 2 tot hon gen 1 rat nhieu. Rat dang mua!', 'APPROVED', NOW()-INTERVAL'22 days'),
        (gen_random_uuid(), v_prod_phone,   v_oi11, v_cust1,  5, 'Lan thu 2 mua iPhone. Shop uy tin, giao hang nhanh!', 'PENDING',  NOW()-INTERVAL'1 day'),
        (gen_random_uuid(), v_prod_samsung, v_oi9,  v_cust9,  4, 'Samsung S24 Ultra dung tot. Se mua them cho nguoi than.', 'PENDING',  NOW()-INTERVAL'2 days')
    ON CONFLICT DO NOTHING;

    -- 9. Payment Transactions
    INSERT INTO payment_transactions (id, order_id, gateway, transaction_id, amount, status, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_ord1,  'VNPAY',  'VNPAY-V55-ORD001', 32990000, 'SUCCESS', NOW()-INTERVAL'30 days', NOW()-INTERVAL'29 days'),
        (gen_random_uuid(), v_ord2,  'VNPAY',  'VNPAY-V55-ORD002', 35990000, 'SUCCESS', NOW()-INTERVAL'28 days', NOW()-INTERVAL'27 days'),
        (gen_random_uuid(), v_ord3,  'VNPAY',  'VNPAY-V55-ORD003', 23990000, 'SUCCESS', NOW()-INTERVAL'25 days', NOW()-INTERVAL'24 days'),
        (gen_random_uuid(), v_ord5,  'STRIPE', 'STRIPE-V55-ORD005',29990000, 'SUCCESS', NOW()-INTERVAL'20 days', NOW()-INTERVAL'19 days'),
        (gen_random_uuid(), v_ord7,  'VNPAY',  'VNPAY-V55-ORD007', 28990000, 'SUCCESS', NOW()-INTERVAL'15 days', NOW()-INTERVAL'14 days'),
        (gen_random_uuid(), v_ord8,  'VNPAY',  'VNPAY-V55-ORD008', 34990000, 'SUCCESS', NOW()-INTERVAL'12 days', NOW()-INTERVAL'11 days'),
        (gen_random_uuid(), v_ord10, 'VNPAY',  'VNPAY-V55-ORD010', 23990000, 'SUCCESS', NOW()-INTERVAL'4 days',  NOW()-INTERVAL'3 days'),
        (gen_random_uuid(), v_ord11, 'VNPAY',  'VNPAY-V55-ORD011', 29691000, 'SUCCESS', NOW()-INTERVAL'3 days',  NOW()-INTERVAL'2 days'),
        (gen_random_uuid(), v_ord13, 'VNPAY',  'VNPAY-V55-ORD013', 32990000, 'SUCCESS', NOW()-INTERVAL'1 day',   NOW()),
        (gen_random_uuid(), v_ord19, 'VNPAY',  'VNPAY-V55-ORD019', 32990000, 'FAILED',  NOW()-INTERVAL'8 days',  NOW()-INTERVAL'7 days')
    ON CONFLICT DO NOTHING;

    -- 10. Chat Conversations (20 phiên)
    INSERT INTO chat_conversations (id, session_id, user_id, status, source, kb_version_id, started_at, ended_at, created_at, updated_at)
    VALUES
        (v_conv1,  'sess-v55-001', v_cust1,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'30 days',            NOW()-INTERVAL'30 days'+INTERVAL'45 min', NOW()-INTERVAL'30 days', NOW()),
        (v_conv2,  'sess-v55-002', v_cust2,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'29 days',            NOW()-INTERVAL'29 days'+INTERVAL'30 min', NOW()-INTERVAL'29 days', NOW()),
        (v_conv3,  'sess-v55-003', v_cust3,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'28 days',            NOW()-INTERVAL'28 days'+INTERVAL'20 min', NOW()-INTERVAL'28 days', NOW()),
        (v_conv4,  'sess-v55-004', v_cust4,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'25 days',            NOW()-INTERVAL'25 days'+INTERVAL'15 min', NOW()-INTERVAL'25 days', NOW()),
        (v_conv5,  'sess-v55-005', v_cust5,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'22 days',            NOW()-INTERVAL'22 days'+INTERVAL'50 min', NOW()-INTERVAL'22 days', NOW()),
        (v_conv6,  'sess-v55-006', v_cust6,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'20 days',            NOW()-INTERVAL'20 days'+INTERVAL'25 min', NOW()-INTERVAL'20 days', NOW()),
        (v_conv7,  'sess-v55-007', v_cust7,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'18 days',            NOW()-INTERVAL'18 days'+INTERVAL'35 min', NOW()-INTERVAL'18 days', NOW()),
        (v_conv8,  'sess-v55-008', v_cust8,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'15 days',            NOW()-INTERVAL'15 days'+INTERVAL'40 min', NOW()-INTERVAL'15 days', NOW()),
        (v_conv9,  'sess-v55-009', v_cust9,  'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'12 days',            NOW()-INTERVAL'12 days'+INTERVAL'18 min', NOW()-INTERVAL'12 days', NOW()),
        (v_conv10, 'sess-v55-010', v_cust10, 'CLOSED',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'10 days',            NOW()-INTERVAL'10 days'+INTERVAL'22 min', NOW()-INTERVAL'10 days', NOW()),
        (v_conv11, 'sess-v55-011', v_cust1,  'CLOSED',  'CHATBOT', v_kb_v1, NOW()-INTERVAL'90 days',            NOW()-INTERVAL'90 days'+INTERVAL'30 min', NOW()-INTERVAL'90 days', NOW()),
        (v_conv12, 'sess-v55-012', v_cust2,  'CLOSED',  'CHATBOT', v_kb_v1, NOW()-INTERVAL'85 days',            NOW()-INTERVAL'85 days'+INTERVAL'20 min', NOW()-INTERVAL'85 days', NOW()),
        (v_conv13, 'sess-v55-013', v_cust3,  'CLOSED',  'CHATBOT', v_kb_v1, NOW()-INTERVAL'80 days',            NOW()-INTERVAL'80 days'+INTERVAL'15 min', NOW()-INTERVAL'80 days', NOW()),
        (v_conv14, 'sess-v55-014', v_cust4,  'CLOSED',  'CHATBOT', v_kb_v1, NOW()-INTERVAL'75 days',            NOW()-INTERVAL'75 days'+INTERVAL'25 min', NOW()-INTERVAL'75 days', NOW()),
        (v_conv15, 'sess-v55-015', v_cust5,  'ACTIVE',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'20 min',             NULL, NOW()-INTERVAL'20 min', NOW()),
        (v_conv16, 'sess-v55-016', v_cust6,  'ACTIVE',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'10 min',             NULL, NOW()-INTERVAL'10 min', NOW()),
        (v_conv17, 'sess-v55-017', v_cust7,  'ACTIVE',  'CHATBOT', v_kb_v2, NOW()-INTERVAL'5 min',              NULL, NOW()-INTERVAL'5 min',  NOW()),
        (v_conv18, 'sess-v55-018', v_cust8,  'HANDOFF', 'CHATBOT', v_kb_v2, NOW()-INTERVAL'45 min',             NULL, NOW()-INTERVAL'45 min', NOW()),
        (v_conv19, 'sess-v55-019', v_cust9,  'HANDOFF', 'CHATBOT', v_kb_v2, NOW()-INTERVAL'2 hours',            NULL, NOW()-INTERVAL'2 hours', NOW()),
        (v_conv20, 'sess-v55-020', NULL,      'HANDOFF', 'CHATBOT', v_kb_v2, NOW()-INTERVAL'3 hours',            NULL, NOW()-INTERVAL'3 hours', NOW())
    ON CONFLICT DO NOTHING;

    -- 11. Chat Messages (~60 messages)
    INSERT INTO chat_messages (id, conversation_id, role, content, intent, confidence, latency_ms, sources, product_ids, flag_status, created_at)
    VALUES
        -- Conv 1: iPhone inquiry -> order
        (gen_random_uuid(), v_conv1, 'USER',      'iPhone 15 Pro Max gia bao nhieu?', 'ask_price', 0.97, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'30 days'),
        (gen_random_uuid(), v_conv1, 'ASSISTANT', 'iPhone 15 Pro Max 256GB hien co gia 32.990.000d. Camera 48MP chinh, chip A17 Pro, man hinh 6.7 inch Super Retina XDR ProMotion.', 'ask_price', 0.96, 520, NULL, ARRAY[v_prod_phone], 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'5 sec'),
        (gen_random_uuid(), v_conv1, 'USER',      'So sanh iPhone voi Samsung S24 Ultra nhe.', 'compare_products', 0.95, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'2 min'),
        (gen_random_uuid(), v_conv1, 'ASSISTANT', 'iPhone 15 PM (32.990.000d) - chip A17 Pro, camera 48MP. Samsung S24U (29.990.000d) - but S-Pen, camera 200MP, pin 5000mAh. Phu hop tuc nang: iPhone cho he sinh thai Apple, Samsung cho Android cao cap.', 'compare_products', 0.94, 780, NULL, ARRAY[v_prod_phone, v_prod_samsung], 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'2 min'+INTERVAL'8 sec'),
        (gen_random_uuid(), v_conv1, 'USER',      'Chinh sach bao hanh iPhone nhu the nao?', 'ask_warranty', 0.92, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'5 min'),
        (gen_random_uuid(), v_conv1, 'ASSISTANT', 'iPhone 15 Pro Max co bao hanh chinh hang 12 thang tai Apple Service Provider. Ho tro 1 doi 1 trong 30 ngay neu loi nha san xuat.', 'ask_warranty', 0.95, 410, NULL, ARRAY[v_prod_phone], 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'5 min'+INTERVAL'4 sec'),
        (gen_random_uuid(), v_conv1, 'USER',      'Cho toi dat hang iPhone 15 Pro Max luon.', 'order_product', 0.98, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'10 min'),
        (gen_random_uuid(), v_conv1, 'ASSISTANT', 'Toi da them iPhone 15 Pro Max 256GB vao gio hang cho ban. Vui long vao trang thanh toan de hoan tat don hang!', 'order_product', 0.99, 230, NULL, ARRAY[v_prod_phone], 'NONE', NOW()-INTERVAL'30 days'+INTERVAL'10 min'+INTERVAL'2 sec'),

        -- Conv 2: Laptop van phong
        (gen_random_uuid(), v_conv2, 'USER',      'Toi can laptop cho van phong, ngan sach tam 35 trieu.', 'purchase_consultation', 0.95, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'29 days'),
        (gen_random_uuid(), v_conv2, 'ASSISTANT', 'Voi ngan sach 35 trieu, goi y Dell Pro 13 Plus (35.990.000d) hoac ASUS ZenBook 14 (28.990.000d) cho nhu cau van phong nhe nhang.', 'purchase_consultation', 0.93, 650, NULL, ARRAY[v_prod_dell, v_prod_laptop], 'NONE', NOW()-INTERVAL'29 days'+INTERVAL'6 sec'),
        (gen_random_uuid(), v_conv2, 'USER',      'Dell Pro pin duoc bao nhieu gio?', 'ask_specs', 0.91, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'29 days'+INTERVAL'3 min'),
        (gen_random_uuid(), v_conv2, 'ASSISTANT', 'Dell Pro 13 Plus co pin khoang 8-10 gio su dung van phong nho chip Intel Ultra 7 tiet kiem dien va pin 55Wh.', 'ask_specs', 0.90, 480, NULL, ARRAY[v_prod_dell], 'NONE', NOW()-INTERVAL'29 days'+INTERVAL'3 min'+INTERVAL'5 sec'),

        -- Conv 3: Gaming laptop
        (gen_random_uuid(), v_conv3, 'USER',      'Laptop gaming duoi 25 trieu cau hinh manh?', 'purchase_consultation', 0.96, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'28 days'),
        (gen_random_uuid(), v_conv3, 'ASSISTANT', 'MSI Cyborg 15 (23.990.000d) la lua chon tuyet voi! Cau hinh: Intel i5-13420H, RTX 3050 6GB, RAM 16GB DDR5, SSD 512GB. Du manh de choi hau het game hien tai.', 'purchase_consultation', 0.94, 590, NULL, ARRAY[v_prod_msi], 'NONE', NOW()-INTERVAL'28 days'+INTERVAL'7 sec'),
        (gen_random_uuid(), v_conv3, 'USER',      'MSI Cyborg co khuyen mai gi khong?', 'ask_promotion', 0.88, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'28 days'+INTERVAL'4 min'),
        (gen_random_uuid(), v_conv3, 'ASSISTANT', 'Hien tai MSI Cyborg 15 dang ap dung voucher TTSHOP10 giam 10% cho don tu 5 trieu. Ban co the nhap khi thanh toan.', 'ask_promotion', 0.87, 440, NULL, ARRAY[v_prod_msi], 'NONE', NOW()-INTERVAL'28 days'+INTERVAL'4 min'+INTERVAL'4 sec'),

        -- Conv 4: Tai nghe
        (gen_random_uuid(), v_conv4, 'USER',      'Tai nghe chong on nao tot nhat hien nay?', 'purchase_consultation', 0.93, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'25 days'),
        (gen_random_uuid(), v_conv4, 'ASSISTANT', 'Apple AirPods Pro 2 (5.990.000d) hien la tai nghe chong on chu dong tot nhat voi cong nghe ANC the he moi, chip H2, sac USB-C.', 'purchase_consultation', 0.92, 360, NULL, ARRAY[v_prod_airpods], 'NONE', NOW()-INTERVAL'25 days'+INTERVAL'5 sec'),
        (gen_random_uuid(), v_conv4, 'USER',      'Bao hanh may thang?', 'ask_warranty', 0.94, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'25 days'+INTERVAL'2 min'),
        (gen_random_uuid(), v_conv4, 'ASSISTANT', 'AirPods Pro 2 co bao hanh 12 thang chinh hang Apple. Doi moi trong 15 ngay neu loi tu nha san xuat.', 'ask_warranty', 0.96, 280, NULL, ARRAY[v_prod_airpods], 'NONE', NOW()-INTERVAL'25 days'+INTERVAL'2 min'+INTERVAL'3 sec'),

        -- Conv 5: Camera
        (gen_random_uuid(), v_conv5, 'USER',      'Camera an ninh nao phu hop cho gia dinh?', 'purchase_consultation', 0.89, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'22 days'),
        (gen_random_uuid(), v_conv5, 'ASSISTANT', 'Camera IP 360 do voi do phan giai 5MP phu hop cho gia dinh. Ho tro xem xa qua app dien thoai, luu tru dam may.', 'purchase_consultation', 0.87, 530, NULL, ARRAY[v_prod_cam], 'NONE', NOW()-INTERVAL'22 days'+INTERVAL'6 sec'),

        -- Conv 6: Keyboard
        (gen_random_uuid(), v_conv6, 'USER',      'Ban phim co Akko dung cho van phong co on khong?', 'ask_specs', 0.91, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'20 days'),
        (gen_random_uuid(), v_conv6, 'ASSISTANT', 'Akko 3098B Plus la lua chon xuat sac cho van phong. Switch Akko Blue nhe tay, bo cuc 100%, ket noi khong day 2.4G/Bluetooth/USB-C.', 'ask_specs', 0.92, 410, NULL, ARRAY[v_prod_akko], 'NONE', NOW()-INTERVAL'20 days'+INTERVAL'5 sec'),
        (gen_random_uuid(), v_conv6, 'USER',      'Gia bao nhieu va mua o dau?', 'ask_price', 0.97, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'20 days'+INTERVAL'3 min'),
        (gen_random_uuid(), v_conv6, 'ASSISTANT', 'Akko 3098B Plus gia 1.890.000d, co san tai shop. Toi co the them vao gio hang ngay cho ban!', 'ask_price', 0.95, 240, NULL, ARRAY[v_prod_akko], 'NONE', NOW()-INTERVAL'20 days'+INTERVAL'3 min'+INTERVAL'3 sec'),

        -- Conv 7: Samsung
        (gen_random_uuid(), v_conv7, 'USER',      'Samsung S24 Ultra co but S-Pen khong?', 'ask_specs', 0.96, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'18 days'),
        (gen_random_uuid(), v_conv7, 'ASSISTANT', 'Co! Samsung Galaxy S24 Ultra duoc tich hop S-Pen ngay trong may. Camera 200MP, man hinh QHD+ 120Hz, pin 5000mAh sac nhanh 45W.', 'ask_specs', 0.97, 460, NULL, ARRAY[v_prod_samsung], 'NONE', NOW()-INTERVAL'18 days'+INTERVAL'5 sec'),

        -- Conv 8: Khieu nai (needs review)
        (gen_random_uuid(), v_conv8, 'USER',      'Don hang toi dat 2 tuan van chua nhan duoc!', 'complain', 0.99, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'15 days'),
        (gen_random_uuid(), v_conv8, 'ASSISTANT', 'Toi rat tiec ve su bat tien nay. De ho tro tot nhat, toi can ket noi ban voi nhan vien cham soc khach hang.', 'complain', 0.95, 280, NULL, NULL, 'NEEDS_REVIEW', NOW()-INTERVAL'15 days'+INTERVAL'5 sec'),

        -- Conv 9: Sinh vien
        (gen_random_uuid(), v_conv9, 'USER',      'Laptop nao phu hop cho sinh vien?', 'purchase_consultation', 0.92, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'12 days'),
        (gen_random_uuid(), v_conv9, 'ASSISTANT', 'Cho sinh vien, goi y ASUS ZenBook 14 (28.990.000d) - mong nhe, man OLED dep, pin 70Wh, mang di hoc rat tien!', 'purchase_consultation', 0.91, 550, NULL, ARRAY[v_prod_laptop], 'NONE', NOW()-INTERVAL'12 days'+INTERVAL'6 sec'),

        -- Conv 10: Out of scope
        (gen_random_uuid(), v_conv10, 'USER',     'Cho toi hoi ve thoi tiet hom nay?', 'out_of_scope', 0.98, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'10 days'),
        (gen_random_uuid(), v_conv10, 'ASSISTANT','Toi chi co the tu van ve san pham dien tu tai TT Shop. Ban co muon toi goi y laptop, dien thoai hoac phu kien khong?', 'out_of_scope', 0.99, 180, NULL, NULL, 'NONE', NOW()-INTERVAL'10 days'+INTERVAL'2 sec'),

        -- Conv 15-17 ACTIVE
        (gen_random_uuid(), v_conv15, 'USER',     'Laptop duoi 30 trieu nao manh nhat?', 'purchase_consultation', 0.94, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'18 min'),
        (gen_random_uuid(), v_conv15, 'ASSISTANT','Trong tam gia nay, ASUS ZenBook 14 va MSI Cyborg 15 deu la lua chon tot. ZenBook phu hop van phong, MSI phu hop gaming.', 'purchase_consultation', 0.92, 600, NULL, ARRAY[v_prod_laptop, v_prod_msi], 'NONE', NOW()-INTERVAL'17 min'),
        (gen_random_uuid(), v_conv16, 'USER',     'Gia AirPods Pro 2 bay gio la bao nhieu?', 'ask_price', 0.99, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'8 min'),
        (gen_random_uuid(), v_conv16, 'ASSISTANT','Apple AirPods Pro 2 hien co gia 5.990.000d tai TT Shop. Day la gia tot nhat thi truong!', 'ask_price', 0.98, 250, NULL, ARRAY[v_prod_airpods], 'NONE', NOW()-INTERVAL'7 min'),
        (gen_random_uuid(), v_conv17, 'USER',     'Xin chao, toi muon mua dien thoai.', 'general_query', 0.85, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'4 min'),
        (gen_random_uuid(), v_conv17, 'ASSISTANT','Xin chao! Toi la chatbot tu van cua TT Shop. Ban dang tim dien thoai theo tieu chi nao? Ngan sach, thuong hieu, hay tinh nang dac biet?', 'general_query', 0.90, 200, NULL, NULL, 'NONE', NOW()-INTERVAL'3 min'+INTERVAL'30 sec'),

        -- Conv 18-20 HANDOFF
        (gen_random_uuid(), v_conv18, 'USER',     'Toi thanh toan VNPay bi loi, tien bi tru ma chua co don hang.', 'complain', 0.99, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'43 min'),
        (gen_random_uuid(), v_conv18, 'ASSISTANT','Toi hieu van de cua ban. Day la van de thanh toan can duoc xu ly boi nhan vien chuyen trach. Dang ket noi voi bo phan ho tro...', 'complain', 0.97, 310, NULL, NULL, 'NEEDS_REVIEW', NOW()-INTERVAL'42 min'),
        (gen_random_uuid(), v_conv19, 'USER',     'Toi muon mua so luong lon 50 cai ban phim de trang bi van phong, co giam gia khong?', 'purchase_consultation', 0.94, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'115 min'),
        (gen_random_uuid(), v_conv19, 'ASSISTANT','Day la yeu cau mua so luong lon can bao gia dac biet. Toi se ket noi ban voi nhan vien kinh doanh de duoc ho tro tot nhat.', 'purchase_consultation', 0.92, 420, NULL, ARRAY[v_prod_akko], 'NONE', NOW()-INTERVAL'114 min'),
        (gen_random_uuid(), v_conv20, 'USER',     'Mat khau tai khoan cua toi bi quen, lam sao lay lai?', 'out_of_scope', 0.96, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'178 min'),
        (gen_random_uuid(), v_conv20, 'ASSISTANT','Van de tai khoan can duoc xu ly boi nhan vien ho tro. Dang chuyen ket noi ngay bay gio.', 'out_of_scope', 0.98, 190, NULL, NULL, 'NONE', NOW()-INTERVAL'177 min')
    ON CONFLICT DO NOTHING;

    -- 12. Chat Conversion Events (15 su kien)
    INSERT INTO chat_conversion_events (id, conversation_id, user_id, product_id, variant_id, order_id, event_type, created_at)
    VALUES
        (gen_random_uuid(), v_conv1, v_cust1, v_prod_phone,   v_var_phone1,   NULL,   'ADD_TO_CART',  NOW()-INTERVAL'30 days'+INTERVAL'8 min'),
        (gen_random_uuid(), v_conv2, v_cust2, v_prod_dell,    v_var_dell1,    NULL,   'ADD_TO_CART',  NOW()-INTERVAL'29 days'+INTERVAL'5 min'),
        (gen_random_uuid(), v_conv3, v_cust3, v_prod_msi,     v_var_msi1,     NULL,   'ADD_TO_CART',  NOW()-INTERVAL'28 days'+INTERVAL'6 min'),
        (gen_random_uuid(), v_conv4, v_cust4, v_prod_airpods, v_var_airpods1, NULL,   'ADD_TO_CART',  NOW()-INTERVAL'25 days'+INTERVAL'4 min'),
        (gen_random_uuid(), v_conv5, v_cust5, v_prod_cam,     v_var_cam1,     NULL,   'ADD_TO_CART',  NOW()-INTERVAL'22 days'+INTERVAL'7 min'),
        (gen_random_uuid(), v_conv6, v_cust6, v_prod_akko,    v_var_akko1,    NULL,   'ADD_TO_CART',  NOW()-INTERVAL'20 days'+INTERVAL'5 min'),
        (gen_random_uuid(), v_conv7, v_cust7, v_prod_samsung, v_var_samsung1, NULL,   'ADD_TO_CART',  NOW()-INTERVAL'18 days'+INTERVAL'6 min'),
        (gen_random_uuid(), v_conv9, v_cust9, v_prod_laptop,  v_var_laptop1,  NULL,   'ADD_TO_CART',  NOW()-INTERVAL'12 days'+INTERVAL'8 min'),
        (gen_random_uuid(), v_conv1, v_cust1, v_prod_phone,   v_var_phone1,   v_ord1, 'ORDER_PLACED', NOW()-INTERVAL'30 days'+INTERVAL'12 min'),
        (gen_random_uuid(), v_conv2, v_cust2, v_prod_dell,    v_var_dell1,    v_ord2, 'ORDER_PLACED', NOW()-INTERVAL'29 days'+INTERVAL'10 min'),
        (gen_random_uuid(), v_conv3, v_cust3, v_prod_msi,     v_var_msi1,     v_ord3, 'ORDER_PLACED', NOW()-INTERVAL'28 days'+INTERVAL'9 min'),
        (gen_random_uuid(), v_conv4, v_cust4, v_prod_airpods, v_var_airpods1, v_ord4, 'ORDER_PLACED', NOW()-INTERVAL'25 days'+INTERVAL'8 min'),
        (gen_random_uuid(), v_conv5, v_cust5, v_prod_cam,     v_var_cam1,     NULL,   'RECOMMENDED',  NOW()-INTERVAL'22 days'+INTERVAL'3 min'),
        (gen_random_uuid(), v_conv6, v_cust6, v_prod_akko,    v_var_akko1,    v_ord6, 'ORDER_PLACED', NOW()-INTERVAL'20 days'+INTERVAL'7 min'),
        (gen_random_uuid(), v_conv7, v_cust7, v_prod_samsung, v_var_samsung1, v_ord5, 'ORDER_PLACED', NOW()-INTERVAL'18 days'+INTERVAL'10 min')
    ON CONFLICT DO NOTHING;

END $$;
