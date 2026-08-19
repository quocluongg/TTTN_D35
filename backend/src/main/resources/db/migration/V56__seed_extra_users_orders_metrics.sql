-- V56__seed_extra_users_orders_metrics.sql
-- Seed bổ sung (ADDITIVE) để hệ thống có đầy đủ số liệu người dùng, đơn hàng, chỉ số
-- chatbot cho báo cáo:
--   * Thêm 5 khách hàng + địa chỉ + giỏ hàng.
--   * Thêm 12 đơn hàng + order items + payment transactions (chỉ trỏ tới product/variant ĐÃ CÓ).
--   * Thêm hội thoại CHATBOT có ORDER_PLACED -> phục vụ báo cáo DOANH THU TỪ CHATBOT (G4).
--   * Thêm hội thoại nguồn SEARCH -> phục vụ SO SÁNH CHUYỂN ĐỔI chatbot vs. tìm kiếm (G3).
--   * Thêm đánh giá, voucher usage, điều chỉnh tồn kho.
-- KHÔNG xóa / không tạo mới bất kỳ products nào. Idempotent: ON CONFLICT DO NOTHING.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    v_customer_role_id UUID;

    -- Khách hàng bổ sung (11-15)
    v_cust11 UUID := '11111111-aaaa-4000-8000-000000000011';
    v_cust12 UUID := '11111111-aaaa-4000-8000-000000000012';
    v_cust13 UUID := '11111111-aaaa-4000-8000-000000000013';
    v_cust14 UUID := '11111111-aaaa-4000-8000-000000000014';
    v_cust15 UUID := '11111111-aaaa-4000-8000-000000000015';

    -- Địa chỉ bổ sung
    v_addr6  UUID := '22222222-bbbb-4000-8000-000000000006';
    v_addr7  UUID := '22222222-bbbb-4000-8000-000000000007';
    v_addr8  UUID := '22222222-bbbb-4000-8000-000000000008';

    -- Vouchers bổ sung
    v_voucher3 UUID := '33333333-cccc-4000-8000-000000000003';
    v_voucher4 UUID := '33333333-cccc-4000-8000-000000000004';

    -- Đơn hàng bổ sung (21-32)
    v_ord21 UUID := '44444444-dddd-4000-8000-000000000021';
    v_ord22 UUID := '44444444-dddd-4000-8000-000000000022';
    v_ord23 UUID := '44444444-dddd-4000-8000-000000000023';
    v_ord24 UUID := '44444444-dddd-4000-8000-000000000024';
    v_ord25 UUID := '44444444-dddd-4000-8000-000000000025';
    v_ord26 UUID := '44444444-dddd-4000-8000-000000000026';
    v_ord27 UUID := '44444444-dddd-4000-8000-000000000027';
    v_ord28 UUID := '44444444-dddd-4000-8000-000000000028';
    v_ord29 UUID := '44444444-dddd-4000-8000-000000000029';
    v_ord30 UUID := '44444444-dddd-4000-8000-000000000030';
    v_ord31 UUID := '44444444-dddd-4000-8000-000000000031';
    v_ord32 UUID := '44444444-dddd-4000-8000-000000000032';

    -- Order items bổ sung
    v_oi26 UUID := '55555555-eeee-4000-8000-000000000026';
    v_oi27 UUID := '55555555-eeee-4000-8000-000000000027';
    v_oi28 UUID := '55555555-eeee-4000-8000-000000000028';
    v_oi29 UUID := '55555555-eeee-4000-8000-000000000029';
    v_oi30 UUID := '55555555-eeee-4000-8000-000000000030';
    v_oi31 UUID := '55555555-eeee-4000-8000-000000000031';
    v_oi32 UUID := '55555555-eeee-4000-8000-000000000032';
    v_oi33 UUID := '55555555-eeee-4000-8000-000000000033';
    v_oi34 UUID := '55555555-eeee-4000-8000-000000000034';
    v_oi35 UUID := '55555555-eeee-4000-8000-000000000035';
    v_oi36 UUID := '55555555-eeee-4000-8000-000000000036';
    v_oi37 UUID := '55555555-eeee-4000-8000-000000000037';
    v_oi38 UUID := '55555555-eeee-4000-8000-000000000038';

    -- Hội thoại bổ sung (21-30: 5 CHATBOT có đơn + 5 SEARCH)
    v_conv21 UUID := '66666666-ffff-4000-8000-000000000021';
    v_conv22 UUID := '66666666-ffff-4000-8000-000000000022';
    v_conv23 UUID := '66666666-ffff-4000-8000-000000000023';
    v_conv24 UUID := '66666666-ffff-4000-8000-000000000024';
    v_conv25 UUID := '66666666-ffff-4000-8000-000000000025';
    v_conv26 UUID := '66666666-ffff-4000-8000-000000000026';
    v_conv27 UUID := '66666666-ffff-4000-8000-000000000027';
    v_conv28 UUID := '66666666-ffff-4000-8000-000000000028';
    v_conv29 UUID := '66666666-ffff-4000-8000-000000000029';
    v_conv30 UUID := '66666666-ffff-4000-8000-000000000030';

    -- KB version v3 (theo quý để đánh giá hiệu quả RAG)
    v_kb_v3 UUID := '77777777-aaaa-4000-8000-000000000003';

    -- Sản phẩm tham chiếu (lấy động từ DB, KHÔNG tạo mới)
    v_prod_laptop  UUID;
    v_prod_phone   UUID;
    v_prod_samsung UUID;
    v_prod_akko    UUID;
    v_prod_airpods UUID;
    v_prod_msi     UUID;
    v_prod_dell    UUID;

    -- Variant
    v_var_laptop1  UUID;
    v_var_phone1   UUID;
    v_var_samsung1 UUID;
    v_var_akko1    UUID;
    v_var_airpods1 UUID;
    v_var_msi1     UUID;
    v_var_dell1    UUID;

    -- Giá thực tế của từng variant
    v_price_laptop  NUMERIC := 0;
    v_price_phone   NUMERIC := 0;
    v_price_samsung NUMERIC := 0;
    v_price_akko    NUMERIC := 0;
    v_price_airpods NUMERIC := 0;
    v_price_msi     NUMERIC := 0;
    v_price_dell    NUMERIC := 0;

    v_bcrypt_pass TEXT := '$2b$10$bqNarYOEFz6VPWZeq5fIeuTjXJdSPIrycLzcIeoS06OQoYIKxKcoW';
    v_admin_id   UUID;
BEGIN
    -- 0. Role + admin tham chiếu
    SELECT id INTO v_customer_role_id FROM roles WHERE name = 'CUSTOMER' LIMIT 1;
    IF v_customer_role_id IS NULL THEN
        RAISE NOTICE 'CUSTOMER role not found, skipping V56 seed';
        RETURN;
    END IF;
    SELECT id INTO v_admin_id FROM profiles WHERE email = 'admin@shopwise.com' OR full_name = 'Super Admin' LIMIT 1;

    -- 1. Tham chiếu sản phẩm THẬT (giống V55, có fallback)
    SELECT p.id INTO v_prod_laptop  FROM products p WHERE p.name ILIKE '%ASUS ZenBook%' ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_phone   FROM products p WHERE p.name ILIKE '%iPhone 15%'    ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_samsung FROM products p WHERE p.name ILIKE '%Galaxy S24%'   ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_akko    FROM products p WHERE p.name ILIKE '%Akko%'         ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_airpods FROM products p WHERE p.name ILIKE '%AirPods%'      ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_msi     FROM products p WHERE p.name ILIKE '%MSI%'          ORDER BY p.created_at LIMIT 1;
    SELECT p.id INTO v_prod_dell    FROM products p WHERE p.name ILIKE '%Dell%'         ORDER BY p.created_at LIMIT 1;

    IF v_prod_laptop  IS NULL THEN SELECT id INTO v_prod_laptop  FROM products ORDER BY created_at LIMIT 1;          END IF;
    IF v_prod_phone   IS NULL THEN SELECT id INTO v_prod_phone   FROM products ORDER BY created_at OFFSET 1 LIMIT 1; END IF;
    IF v_prod_samsung IS NULL THEN SELECT id INTO v_prod_samsung FROM products ORDER BY created_at OFFSET 2 LIMIT 1; END IF;
    IF v_prod_akko    IS NULL THEN SELECT id INTO v_prod_akko    FROM products ORDER BY created_at OFFSET 3 LIMIT 1; END IF;
    IF v_prod_airpods IS NULL THEN SELECT id INTO v_prod_airpods FROM products ORDER BY created_at OFFSET 4 LIMIT 1; END IF;
    IF v_prod_msi     IS NULL THEN SELECT id INTO v_prod_msi     FROM products ORDER BY created_at OFFSET 5 LIMIT 1; END IF;
    IF v_prod_dell    IS NULL THEN v_prod_dell := v_prod_laptop; END IF;

    SELECT id INTO v_var_laptop1  FROM product_variants WHERE product_id = v_prod_laptop  ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_phone1   FROM product_variants WHERE product_id = v_prod_phone   ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_samsung1 FROM product_variants WHERE product_id = v_prod_samsung ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_akko1    FROM product_variants WHERE product_id = v_prod_akko    ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_airpods1 FROM product_variants WHERE product_id = v_prod_airpods ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_msi1     FROM product_variants WHERE product_id = v_prod_msi     ORDER BY created_at LIMIT 1;
    SELECT id INTO v_var_dell1    FROM product_variants WHERE product_id = v_prod_dell    ORDER BY created_at LIMIT 1;

    SELECT COALESCE(price,0) INTO v_price_laptop  FROM product_variants WHERE id = v_var_laptop1;
    SELECT COALESCE(price,0) INTO v_price_phone   FROM product_variants WHERE id = v_var_phone1;
    SELECT COALESCE(price,0) INTO v_price_samsung FROM product_variants WHERE id = v_var_samsung1;
    SELECT COALESCE(price,0) INTO v_price_akko    FROM product_variants WHERE id = v_var_akko1;
    SELECT COALESCE(price,0) INTO v_price_airpods FROM product_variants WHERE id = v_var_airpods1;
    SELECT COALESCE(price,0) INTO v_price_msi     FROM product_variants WHERE id = v_var_msi1;
    SELECT COALESCE(price,0) INTO v_price_dell    FROM product_variants WHERE id = v_var_dell1;

    IF v_var_laptop1 IS NULL OR v_var_phone1 IS NULL THEN
        RAISE NOTICE 'Không có product_variant nào để tham chiếu, bỏ qua V56';
        RETURN;
    END IF;

    -- 2. Khách hàng bổ sung (5 accounts)
    INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, phone_number, email_verified, is_active, email_notif, push_notif, system_notif)
    VALUES
        (v_cust11, 'vu.thi.nhung@gmail.com',   v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Vu Thi Nhung',    '0901111011', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust12, 'dang.quoc.bao@gmail.com',   v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Dang Quoc Bao',   '0901111012', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust13, 'phung.anh.tu@gmail.com',    v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Phung Anh Tu',    '0901111013', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust14, 'do.thi.thao@gmail.com',     v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Do Thi Thao',     '0901111014', TRUE, TRUE, TRUE, TRUE, TRUE),
        (v_cust15, 'ly.van.minh@gmail.com',     v_bcrypt_pass, 'LOCAL', v_customer_role_id, 'Ly Van Minh',     '0901111015', TRUE, TRUE, TRUE, TRUE, TRUE)
    ON CONFLICT (email) DO NOTHING;

    -- 3. Địa chỉ bổ sung
    INSERT INTO addresses (id, profile_id, recipient_name, phone, province, district, ward, detail_address, is_default)
    VALUES
        (v_addr6, v_cust11, 'Vu Thi Nhung',  '0901111011', 'Can Tho', 'Ninh Kieu',   'Phuong An Hoa',   '55 Tran Quang Khai, Ninh Kieu, Can Tho', TRUE),
        (v_addr7, v_cust12, 'Dang Quoc Bao', '0901111012', 'Hai Phong','Le Chan',    'Phuong An Bien',  '90 Cat Co, Le Chan, Hai Phong',          TRUE),
        (v_addr8, v_cust13, 'Phung Anh Tu',  '0901111013', 'TP.HCM',   'Thu Duc',     'Phuong Linh Trung','200 Xa Lo Ha Noi, Thu Duc, TP.HCM',      TRUE)
    ON CONFLICT DO NOTHING;

    -- 4. Knowledge Base version v3 (theo quý hiện tại)
    INSERT INTO knowledge_base_version (id, name, description, chunking_strategy, embedding_model, is_active, created_at, updated_at)
    VALUES
        (v_kb_v3, 'v3.0', 'Knowledge base Q3/2026 - tich hop FAQ & chinh sach', 'semantic-split', 'BGE-M3', TRUE, NOW() - INTERVAL '14 days', NOW())
    ON CONFLICT DO NOTHING;

    -- 5. Vouchers bổ sung
    INSERT INTO vouchers (id, code, description, discount_type, discount_value, max_discount_amount, min_order_value, max_usage, max_usage_per_user, used_count, start_time, end_time, is_active)
    VALUES
        (v_voucher3, 'TTSHOP15',   'Giam 15% don tu 10 trieu', 'PERCENT', 15.00, 3000000.00, 10000000.00, 150, 1, 8,  NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', TRUE),
        (v_voucher4, 'TTSHOP500K', 'Giam 500k don tu 15 trieu','FIXED',   500000.00, NULL,      15000000.00, 60,  1, 3,  NOW() - INTERVAL '5 days',  NOW() + INTERVAL '20 days', TRUE)
    ON CONFLICT (code) DO NOTHING;

    -- 6. Đơn hàng bổ sung
    --   o 21-25: CHATBOT -> có ORDER_PLACED (doanh thu chatbot G4)
    --   o 26-29: SEARCH  -> có ORDER_PLACED (so sánh G3)
    --   o 30-32: thêm đơn hỗ trợ báo cáo doanh thu theo tuần/tháng
    INSERT INTO orders (id, user_id, address_id, voucher_id, discount_amount, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, created_at, updated_at)
    VALUES
        (v_ord21, v_cust11, v_addr6, v_voucher3, 3000000, 'Vu Thi Nhung',  'vu.thi.nhung@gmail.com', '0901111011', '55 Tran Quang Khai, Ninh Kieu, Can Tho',        v_price_laptop  - 3000000, 'COMPLETED', 'VNPAY',  'PAID',    NOW()-INTERVAL'12 days', NOW()-INTERVAL'8 days'),
        (v_ord22, v_cust12, v_addr7, NULL,        0,       'Dang Quoc Bao', 'dang.quoc.bao@gmail.com','0901111012', '90 Cat Co, Le Chan, Hai Phong',                  v_price_phone,            'COMPLETED', 'VNPAY',  'PAID',    NOW()-INTERVAL'11 days', NOW()-INTERVAL'7 days'),
        (v_ord23, v_cust13, v_addr8, v_voucher4, 500000,  'Phung Anh Tu',  'phung.anh.tu@gmail.com', '0901111013', '200 Xa Lo Ha Noi, Thu Duc, TP.HCM',              v_price_samsung - 500000, 'COMPLETED', 'STRIPE', 'PAID',    NOW()-INTERVAL'9 days',  NOW()-INTERVAL'5 days'),
        (v_ord24, v_cust14, NULL,    NULL,        0,       'Do Thi Thao',   'do.thi.thao@gmail.com',  '0901111014', '12 Hai Ba Trung, Quan 1, TP.HCM',                v_price_msi,              'COMPLETED', 'VNPAY',  'PAID',    NOW()-INTERVAL'7 days',  NOW()-INTERVAL'3 days'),
        (v_ord25, v_cust15, NULL,    NULL,        0,       'Ly Van Minh',   'ly.van.minh@gmail.com',  '0901111015', '8 Le Duan, Quan 1, TP.HCM',                      v_price_airpods * 2,      'COMPLETED', 'COD',    'PAID',    NOW()-INTERVAL'6 days',  NOW()-INTERVAL'2 days'),
        (v_ord26, v_cust11, v_addr6, NULL,        0,       'Vu Thi Nhung',  'vu.thi.nhung@gmail.com', '0901111011', '55 Tran Quang Khai, Ninh Kieu, Can Tho',        v_price_dell,             'COMPLETED', 'VNPAY',  'PAID',    NOW()-INTERVAL'14 days', NOW()-INTERVAL'10 days'),
        (v_ord27, v_cust12, v_addr7, NULL,        0,       'Dang Quoc Bao', 'dang.quoc.bao@gmail.com','0901111012', '90 Cat Co, Le Chan, Hai Phong',                  v_price_samsung,          'COMPLETED', 'COD',    'PAID',    NOW()-INTERVAL'13 days', NOW()-INTERVAL'9 days'),
        (v_ord28, v_cust13, v_addr8, NULL,        0,       'Phung Anh Tu',  'phung.anh.tu@gmail.com', '0901111013', '200 Xa Lo Ha Noi, Thu Duc, TP.HCM',              v_price_laptop,           'COMPLETED', 'VNPAY',  'PAID',    NOW()-INTERVAL'10 days', NOW()-INTERVAL'6 days'),
        (v_ord29, v_cust14, NULL,    NULL,        0,       'Do Thi Thao',   'do.thi.thao@gmail.com',  '0901111014', '12 Hai Ba Trung, Quan 1, TP.HCM',                v_price_airpods,          'SHIPPED',   'COD',    'PENDING', NOW()-INTERVAL'4 days',  NOW()-INTERVAL'2 days'),
        (v_ord30, v_cust15, NULL,    NULL,        0,       'Ly Van Minh',   'ly.van.minh@gmail.com',  '0901111015', '8 Le Duan, Quan 1, TP.HCM',                      v_price_akko * 3,         'COMPLETED', 'VNPAY',  'PAID',    NOW()-INTERVAL'16 days', NOW()-INTERVAL'12 days'),
        (v_ord31, v_cust11, v_addr6, NULL,        0,       'Vu Thi Nhung',  'vu.thi.nhung@gmail.com', '0901111011', '55 Tran Quang Khai, Ninh Kieu, Can Tho',        v_price_phone,            'PROCESSING','VNPAY',  'PAID',    NOW()-INTERVAL'2 days',  NOW()),
        (v_ord32, v_cust12, v_addr7, NULL,        0,       'Dang Quoc Bao', 'dang.quoc.bao@gmail.com','0901111012', '90 Cat Co, Le Chan, Hai Phong',                  v_price_akko,             'PENDING',   'COD',    'PENDING', NOW()-INTERVAL'8 hours', NOW())
    ON CONFLICT DO NOTHING;

    -- 7. Order items bổ sung
    INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_purchase, attributes_snapshot)
    VALUES
        (v_oi26, v_ord21, v_prod_laptop,  v_var_laptop1,  1, v_price_laptop,  '{}'::jsonb),
        (v_oi27, v_ord22, v_prod_phone,   v_var_phone1,   1, v_price_phone,   '{}'::jsonb),
        (v_oi28, v_ord23, v_prod_samsung, v_var_samsung1, 1, v_price_samsung, '{}'::jsonb),
        (v_oi29, v_ord24, v_prod_msi,     v_var_msi1,     1, v_price_msi,     '{}'::jsonb),
        (v_oi30, v_ord25, v_prod_airpods, v_var_airpods1, 2, v_price_airpods, '{}'::jsonb),
        (v_oi31, v_ord26, v_prod_dell,    v_var_dell1,    1, v_price_dell,    '{}'::jsonb),
        (v_oi32, v_ord27, v_prod_samsung, v_var_samsung1, 1, v_price_samsung, '{}'::jsonb),
        (v_oi33, v_ord28, v_prod_laptop,  v_var_laptop1,  1, v_price_laptop,  '{}'::jsonb),
        (v_oi34, v_ord29, v_prod_airpods, v_var_airpods1, 1, v_price_airpods, '{}'::jsonb),
        (v_oi35, v_ord30, v_prod_akko,    v_var_akko1,    3, v_price_akko,    '{}'::jsonb),
        (v_oi36, v_ord31, v_prod_phone,   v_var_phone1,   1, v_price_phone,   '{}'::jsonb),
        (v_oi37, v_ord32, v_prod_akko,    v_var_akko1,    1, v_price_akko,    '{}'::jsonb),
        (v_oi38, v_ord24, v_prod_airpods, v_var_airpods1, 1, v_price_airpods, '{}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- 8. Payment transactions bổ sung
    INSERT INTO payment_transactions (id, order_id, provider, provider_transaction_id, amount, status, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_ord21, 'VNPAY',  'VNPAY-V56-ORD021', v_price_laptop  - 3000000, 'SUCCESS', NOW()-INTERVAL'12 days', NOW()-INTERVAL'11 days'),
        (gen_random_uuid(), v_ord22, 'VNPAY',  'VNPAY-V56-ORD022', v_price_phone,            'SUCCESS', NOW()-INTERVAL'11 days', NOW()-INTERVAL'10 days'),
        (gen_random_uuid(), v_ord23, 'STRIPE', 'STRIPE-V56-ORD023',v_price_samsung - 500000, 'SUCCESS', NOW()-INTERVAL'9 days',  NOW()-INTERVAL'8 days'),
        (gen_random_uuid(), v_ord24, 'VNPAY',  'VNPAY-V56-ORD024', v_price_msi,              'SUCCESS', NOW()-INTERVAL'7 days',  NOW()-INTERVAL'6 days'),
        (gen_random_uuid(), v_ord25, 'COD',    'COD-V56-ORD025',   v_price_airpods * 2,      'SUCCESS', NOW()-INTERVAL'6 days',  NOW()-INTERVAL'5 days'),
        (gen_random_uuid(), v_ord26, 'VNPAY',  'VNPAY-V56-ORD026', v_price_dell,             'SUCCESS', NOW()-INTERVAL'14 days', NOW()-INTERVAL'13 days'),
        (gen_random_uuid(), v_ord27, 'COD',    'COD-V56-ORD027',   v_price_samsung,          'SUCCESS', NOW()-INTERVAL'13 days', NOW()-INTERVAL'12 days'),
        (gen_random_uuid(), v_ord28, 'VNPAY',  'VNPAY-V56-ORD028', v_price_laptop,           'SUCCESS', NOW()-INTERVAL'10 days', NOW()-INTERVAL'9 days'),
        (gen_random_uuid(), v_ord30, 'VNPAY',  'VNPAY-V56-ORD030', v_price_akko * 3,         'SUCCESS', NOW()-INTERVAL'16 days', NOW()-INTERVAL'15 days'),
        (gen_random_uuid(), v_ord31, 'VNPAY',  'VNPAY-V56-ORD031', v_price_phone,            'SUCCESS', NOW()-INTERVAL'2 days',  NOW())
    ON CONFLICT DO NOTHING;

    -- 9. Voucher usage bổ sung
    INSERT INTO voucher_usages (id, voucher_id, order_id, profile_id, discount_amount, used_at)
    VALUES
        (gen_random_uuid(), v_voucher3, v_ord21, v_cust11, 3000000, NOW()-INTERVAL'12 days'),
        (gen_random_uuid(), v_voucher4, v_ord23, v_cust13, 500000,  NOW()-INTERVAL'9 days')
    ON CONFLICT DO NOTHING;

    -- 10. Giỏ hàng bổ sung
    INSERT INTO cart_items (id, profile_id, variant_id, quantity)
    VALUES
        (gen_random_uuid(), v_cust14, v_var_phone1,   1),
        (gen_random_uuid(), v_cust15, v_var_airpods1, 1),
        (gen_random_uuid(), v_cust11, v_var_akko1,    1)
    ON CONFLICT (profile_id, variant_id) DO NOTHING;

    -- 11. Đánh giá bổ sung (chỉ cho đơn đã hoàn thành)
    INSERT INTO product_reviews (id, product_id, order_item_id, profile_id, rating, comment, status, created_at)
    VALUES
        (gen_random_uuid(), v_prod_laptop,  v_oi26, v_cust11, 5, 'Laptop ASUS ZenBook rat xin, OLED dep tuyet. Duoc chatbot tu van nhiet tinh!', 'APPROVED', NOW()-INTERVAL'8 days'),
        (gen_random_uuid(), v_prod_phone,   v_oi27, v_cust12, 4, 'iPhone dung tot, giao nhanh. Chi thieu phu kien tang kem.', 'APPROVED', NOW()-INTERVAL'7 days'),
        (gen_random_uuid(), v_prod_samsung, v_oi28, v_cust13, 5, 'Samsung S24U qua dinh, camera 200MP xuat sac.', 'APPROVED', NOW()-INTERVAL'5 days'),
        (gen_random_uuid(), v_prod_msi,     v_oi29, v_cust14, 5, 'MSI gaming muot, tan nhiet tot, gia hop ly.', 'APPROVED', NOW()-INTERVAL'3 days'),
        (gen_random_uuid(), v_prod_airpods, v_oi30, v_cust15, 4, 'AirPods Pro 2 chong on rat tot, dung voi gia tien.', 'APPROVED', NOW()-INTERVAL'2 days'),
        (gen_random_uuid(), v_prod_dell,    v_oi31, v_cust11, 4, 'Dell Pro binh thuong, phu hop van phong.', 'PENDING',  NOW()-INTERVAL'10 days'),
        (gen_random_uuid(), v_prod_akko,    v_oi35, v_cust15, 5, 'Mua 3 ban phim Akko cho phong game, rat de go!', 'APPROVED', NOW()-INTERVAL'12 days')
    ON CONFLICT DO NOTHING;

    -- 12. Hội thoại CHATBOT bổ sung (có ORDER_PLACED -> doanh thu chatbot G4)
    INSERT INTO chat_conversations (id, session_id, user_id, status, source, kb_version_id, started_at, ended_at, created_at, updated_at)
    VALUES
        (v_conv21, 'sess-v56-021', v_cust11, 'CLOSED', 'CHATBOT', v_kb_v3, NOW()-INTERVAL'12 days',  NOW()-INTERVAL'12 days'+INTERVAL'32 min', NOW()-INTERVAL'12 days', NOW()),
        (v_conv22, 'sess-v56-022', v_cust12, 'CLOSED', 'CHATBOT', v_kb_v3, NOW()-INTERVAL'11 days',  NOW()-INTERVAL'11 days'+INTERVAL'25 min', NOW()-INTERVAL'11 days', NOW()),
        (v_conv23, 'sess-v56-023', v_cust13, 'CLOSED', 'CHATBOT', v_kb_v3, NOW()-INTERVAL'9 days',   NOW()-INTERVAL'9 days'+INTERVAL'28 min',  NOW()-INTERVAL'9 days',  NOW()),
        (v_conv24, 'sess-v56-024', v_cust14, 'CLOSED', 'CHATBOT', v_kb_v3, NOW()-INTERVAL'7 days',   NOW()-INTERVAL'7 days'+INTERVAL'22 min',  NOW()-INTERVAL'7 days',  NOW()),
        (v_conv25, 'sess-v56-025', v_cust15, 'CLOSED', 'CHATBOT', v_kb_v3, NOW()-INTERVAL'6 days',   NOW()-INTERVAL'6 days'+INTERVAL'18 min',  NOW()-INTERVAL'6 days',  NOW()),
        (v_conv26, 'sess-v56-026', v_cust11, 'CLOSED', 'CHATBOT', v_kb_v3, NOW()-INTERVAL'3 days',   NOW()-INTERVAL'3 days'+INTERVAL'30 min',  NOW()-INTERVAL'3 days',  NOW())
    ON CONFLICT DO NOTHING;

    -- 13. Hội thoại SEARCH bổ sung (so sánh chuyển đổi G3)
    INSERT INTO chat_conversations (id, session_id, user_id, status, source, kb_version_id, started_at, ended_at, created_at, updated_at)
    VALUES
        (v_conv27, 'sess-v56-027', v_cust11, 'CLOSED', 'SEARCH', NULL, NOW()-INTERVAL'14 days', NOW()-INTERVAL'14 days'+INTERVAL'12 min', NOW()-INTERVAL'14 days', NOW()),
        (v_conv28, 'sess-v56-028', v_cust12, 'CLOSED', 'SEARCH', NULL, NOW()-INTERVAL'13 days', NOW()-INTERVAL'13 days'+INTERVAL'15 min', NOW()-INTERVAL'13 days', NOW()),
        (v_conv29, 'sess-v56-029', v_cust13, 'CLOSED', 'SEARCH', NULL, NOW()-INTERVAL'10 days', NOW()-INTERVAL'10 days'+INTERVAL'9 min',  NOW()-INTERVAL'10 days', NOW()),
        (v_conv30, 'sess-v56-030', v_cust14, 'CLOSED', 'SEARCH', NULL, NOW()-INTERVAL'4 days',  NOW()-INTERVAL'4 days'+INTERVAL'14 min',  NOW()-INTERVAL'4 days',  NOW())
    ON CONFLICT DO NOTHING;

    -- 14. Chat messages bổ sung
    INSERT INTO chat_messages (id, conversation_id, role, content, intent, confidence, latency_ms, sources, product_ids, flag_status, created_at)
    VALUES
        (gen_random_uuid(), v_conv21, 'USER',      'Laptop nao phu hop danh cho ke toan, nhe va pin lau?', 'purchase_consultation', 0.94, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'12 days'),
        (gen_random_uuid(), v_conv21, 'ASSISTANT', 'ASUS ZenBook 14 la lua chon tot nhat cho ke toan: OLED 14 inch, pin 70Wh, chi 1.2kg, dung cho Excel/phần mềm ke toan muot ma.', 'purchase_consultation', 0.93, 540, NULL, ARRAY[v_prod_laptop], 'NONE', NOW()-INTERVAL'12 days'+INTERVAL'6 sec'),
        (gen_random_uuid(), v_conv21, 'USER',      'Cho toi dat hang luon.', 'order_product', 0.98, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'12 days'+INTERVAL'4 min'),
        (gen_random_uuid(), v_conv21, 'ASSISTANT', 'Da them ASUS ZenBook 14 vao gio hang. Ban tien hanh thanh toan de hoan tat nhe!', 'order_product', 0.99, 210, NULL, ARRAY[v_prod_laptop], 'NONE', NOW()-INTERVAL'12 days'+INTERVAL'4 min'+INTERVAL'2 sec'),

        (gen_random_uuid(), v_conv22, 'USER',      'Dien thoai iPhone 15 Pro Max con hang khong?', 'ask_price', 0.97, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'11 days'),
        (gen_random_uuid(), v_conv22, 'ASSISTANT', 'iPhone 15 Pro Max 256GB con hang voi gia 32.990.000d. Camera 48MP, chip A17 Pro, sac nhanh MagSafe.', 'ask_price', 0.96, 480, NULL, ARRAY[v_prod_phone], 'NONE', NOW()-INTERVAL'11 days'+INTERVAL'5 sec'),
        (gen_random_uuid(), v_conv22, 'USER',      'Toi mua ngay!', 'order_product', 0.99, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'11 days'+INTERVAL'3 min'),
        (gen_random_uuid(), v_conv22, 'ASSISTANT', 'Da them vao gio hang. Vui long hoan tat thanh toan!', 'order_product', 0.99, 190, NULL, ARRAY[v_prod_phone], 'NONE', NOW()-INTERVAL'11 days'+INTERVAL'3 min'+INTERVAL'2 sec'),

        (gen_random_uuid(), v_conv23, 'USER',      'Samsung S24 Ultra khuyen mai gi khong?', 'ask_promotion', 0.9, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'9 days'),
        (gen_random_uuid(), v_conv23, 'ASSISTANT', 'S24 Ultra dang ap dung voucher TTSHOP500K giam 500k cho don tu 15 trieu. Ban co the nhap ma khi thanh toan.', 'ask_promotion', 0.91, 430, NULL, ARRAY[v_prod_samsung], 'NONE', NOW()-INTERVAL'9 days'+INTERVAL'5 sec'),
        (gen_random_uuid(), v_conv23, 'USER',      'OK, mua luon di.', 'order_product', 0.97, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'9 days'+INTERVAL'5 min'),
        (gen_random_uuid(), v_conv23, 'ASSISTANT', 'Da them Samsung S24 Ultra vao gio hang. Nho nhap ma TTSHOP500K khi thanh toan de duoc giam gia!', 'order_product', 0.98, 220, NULL, ARRAY[v_prod_samsung], 'NONE', NOW()-INTERVAL'9 days'+INTERVAL'5 min'+INTERVAL'3 sec'),

        (gen_random_uuid(), v_conv24, 'USER',      'Laptop gaming MSI Cyborg cau hinh the nao?', 'ask_specs', 0.95, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'7 days'),
        (gen_random_uuid(), v_conv24, 'ASSISTANT', 'MSI Cyborg 15: Intel i5-13420H, RTX 3050 6GB, RAM 16GB DDR5, SSD 512GB, man 15.6 FHD 144Hz. Cho game tuot.', 'ask_specs', 0.94, 500, NULL, ARRAY[v_prod_msi], 'NONE', NOW()-INTERVAL'7 days'+INTERVAL'6 sec'),
        (gen_random_uuid(), v_conv24, 'USER',      'Dat hang giup toi.', 'order_product', 0.98, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'7 days'+INTERVAL'4 min'),
        (gen_random_uuid(), v_conv24, 'ASSISTANT', 'Da them MSI Cyborg 15 vao gio hang cua ban!', 'order_product', 0.99, 200, NULL, ARRAY[v_prod_msi], 'NONE', NOW()-INTERVAL'7 days'+INTERVAL'4 min'+INTERVAL'2 sec'),

        (gen_random_uuid(), v_conv25, 'USER',      'Mua 2 AirPods Pro 2 co giam gi khong?', 'ask_promotion', 0.93, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'6 days'),
        (gen_random_uuid(), v_conv25, 'ASSISTANT', 'Mua 2 AirPods Pro 2 (5.990.000d/cai) tong 11.980.000d. Dang co chuong trinh giam 10% don tu 5 trieu voi ma TTSHOP10.', 'ask_promotion', 0.92, 460, NULL, ARRAY[v_prod_airpods], 'NONE', NOW()-INTERVAL'6 days'+INTERVAL'5 sec'),
        (gen_random_uuid(), v_conv25, 'USER',      'Lay luon 2 cai.', 'order_product', 0.97, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'6 days'+INTERVAL'3 min'),
        (gen_random_uuid(), v_conv25, 'ASSISTANT', 'Da them 2 AirPods Pro 2 vao gio hang!', 'order_product', 0.98, 230, NULL, ARRAY[v_prod_airpods], 'NONE', NOW()-INTERVAL'6 days'+INTERVAL'3 min'+INTERVAL'2 sec'),

        (gen_random_uuid(), v_conv26, 'USER',      'Tai nghe nao chong on tot trong tam 6 trieu?', 'purchase_consultation', 0.91, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'3 days'),
        (gen_random_uuid(), v_conv26, 'ASSISTANT', 'AirPods Pro 2 (5.990.000d) la lua chon chong on tot nhat trong tam gia nay, chip H2, ANC the he moi.', 'purchase_consultation', 0.93, 410, NULL, ARRAY[v_prod_airpods], 'NONE', NOW()-INTERVAL'3 days'+INTERVAL'5 sec'),

        -- SEARCH conversations (không có product suggestion, chỉ thao tác tìm kiếm/lọc)
        (gen_random_uuid(), v_conv27, 'USER', 'Tim laptop Dell qua o tim kiem trang chu.', 'search_query', 0.8, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'14 days'),
        (gen_random_uuid(), v_conv28, 'USER', 'Loc dien thoai Samsung theo bang gia.', 'search_query', 0.75, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'13 days'),
        (gen_random_uuid(), v_conv29, 'USER', 'Tim laptop ASUS trong danh muc Laptop.', 'search_query', 0.82, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'10 days'),
        (gen_random_uuid(), v_conv30, 'USER', 'Tim tai nghe AirPods gia tot nhat.', 'search_query', 0.77, NULL, NULL, NULL, 'NONE', NOW()-INTERVAL'4 days')
    ON CONFLICT DO NOTHING;

    -- 15. Chat conversion events bổ sung (ORDER_PLACED + ADD_TO_CART cho cả 2 nguồn)
    INSERT INTO chat_conversion_events (id, conversation_id, user_id, product_id, variant_id, order_id, event_type, created_at)
    VALUES
        (gen_random_uuid(), v_conv21, v_cust11, v_prod_laptop,  v_var_laptop1,  NULL,   'RECOMMENDED', NOW()-INTERVAL'12 days'+INTERVAL'1 min'),
        (gen_random_uuid(), v_conv21, v_cust11, v_prod_laptop,  v_var_laptop1,  v_ord21, 'ORDER_PLACED', NOW()-INTERVAL'12 days'+INTERVAL'6 min'),
        (gen_random_uuid(), v_conv22, v_cust12, v_prod_phone,   v_var_phone1,   NULL,   'RECOMMENDED', NOW()-INTERVAL'11 days'+INTERVAL'1 min'),
        (gen_random_uuid(), v_conv22, v_cust12, v_prod_phone,   v_var_phone1,   v_ord22, 'ORDER_PLACED', NOW()-INTERVAL'11 days'+INTERVAL'5 min'),
        (gen_random_uuid(), v_conv23, v_cust13, v_prod_samsung, v_var_samsung1, NULL,   'RECOMMENDED', NOW()-INTERVAL'9 days'+INTERVAL'1 min'),
        (gen_random_uuid(), v_conv23, v_cust13, v_prod_samsung, v_var_samsung1, v_ord23, 'ORDER_PLACED', NOW()-INTERVAL'9 days'+INTERVAL'7 min'),
        (gen_random_uuid(), v_conv24, v_cust14, v_prod_msi,     v_var_msi1,     NULL,   'RECOMMENDED', NOW()-INTERVAL'7 days'+INTERVAL'1 min'),
        (gen_random_uuid(), v_conv24, v_cust14, v_prod_msi,     v_var_msi1,     v_ord24, 'ORDER_PLACED', NOW()-INTERVAL'7 days'+INTERVAL'6 min'),
        (gen_random_uuid(), v_conv25, v_cust15, v_prod_airpods, v_var_airpods1, NULL,   'RECOMMENDED', NOW()-INTERVAL'6 days'+INTERVAL'1 min'),
        (gen_random_uuid(), v_conv25, v_cust15, v_prod_airpods, v_var_airpods1, v_ord25, 'ORDER_PLACED', NOW()-INTERVAL'6 days'+INTERVAL'5 min'),
        (gen_random_uuid(), v_conv26, v_cust11, v_prod_airpods, v_var_airpods1, NULL,   'ADD_TO_CART',  NOW()-INTERVAL'3 days'+INTERVAL'2 min'),
        (gen_random_uuid(), v_conv27, v_cust11, v_prod_dell,    v_var_dell1,    NULL,   'ADD_TO_CART',  NOW()-INTERVAL'14 days'+INTERVAL'3 min'),
        (gen_random_uuid(), v_conv27, v_cust11, v_prod_dell,    v_var_dell1,    v_ord26, 'ORDER_PLACED', NOW()-INTERVAL'14 days'+INTERVAL'8 min'),
        (gen_random_uuid(), v_conv28, v_cust12, v_prod_samsung, v_var_samsung1, v_ord27, 'ORDER_PLACED', NOW()-INTERVAL'13 days'+INTERVAL'7 min'),
        (gen_random_uuid(), v_conv29, v_cust13, v_prod_laptop,  v_var_laptop1,  v_ord28, 'ORDER_PLACED', NOW()-INTERVAL'10 days'+INTERVAL'6 min'),
        (gen_random_uuid(), v_conv30, v_cust14, v_prod_airpods, v_var_airpods1, v_ord29, 'ORDER_PLACED', NOW()-INTERVAL'4 days'+INTERVAL'5 min')
    ON CONFLICT DO NOTHING;

    -- 16. Điều chỉnh tồn kho bổ sung (chỉ tham chiếu variant, không ảnh hưởng product)
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO inventory_adjustments (id, variant_id, delta, reason, note, adjusted_by, created_at)
        VALUES
            (gen_random_uuid(), v_var_akko1,    -3, 'STOCK_OUT', 'Ban 3 ban phim Akko cho don V56-ORD030', v_admin_id, NOW()-INTERVAL'16 days'),
            (gen_random_uuid(), v_var_airpods1, -3, 'STOCK_OUT', 'Ban 3 AirPods Pro qua chatbot & search',  v_admin_id, NOW()-INTERVAL'6 days'),
            (gen_random_uuid(), v_var_laptop1,  5,  'STOCK_IN',  'Nhap bo sung ASUS ZenBook lo moi',       v_admin_id, NOW()-INTERVAL'2 days')
        ON CONFLICT DO NOTHING;
    END IF;

END $$;