package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.response.ApiResponse;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class DevDatabaseSeedController {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/dev/seed-data")
    @Transactional
    public ApiResponse<String> seedDemoData() {
        try {
            // 1. Clean existing records securely to avoid duplicate keys in test data
            jdbcTemplate.execute("TRUNCATE TABLE warranty_histories CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE warranty_cards CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE payment_transactions CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE order_items CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE orders CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE product_variants CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE product_images CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE products CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE categories CASCADE");
            jdbcTemplate.execute("DELETE FROM profiles WHERE email IN ('admin@shopwise.com', 'staff@shopwise.com', 'customer@shopwise.com')");

            // 2. Fetch or seed default Roles
            UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'ADMIN'", UUID.class);
            UUID staffRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'STAFF'", UUID.class);
            UUID customerRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'CUSTOMER'", UUID.class);

            if (adminRoleId == null || staffRoleId == null || customerRoleId == null) {
                return ApiResponse.<String>builder()
                        .success(false)
                        .message("Roles (ADMIN, STAFF, CUSTOMER) not found in DB. Please run flyway migrations first.")
                        .timestamp(LocalDateTime.now())
                        .build();
            }

            // 3. Seed users profiles (Password: 123456)
            String encodedPass = passwordEncoder.encode("123456");
            UUID adminProfileId = UUID.randomUUID();
            UUID staffProfileId = UUID.randomUUID();
            UUID customerProfileId = UUID.randomUUID();

            jdbcTemplate.update("INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, is_active, email_verified) VALUES (?, ?, ?, 'LOCAL', ?, ?, true, true)",
                    adminProfileId, "admin@shopwise.com", encodedPass, adminRoleId, "Super Admin");
            jdbcTemplate.update("INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, is_active, email_verified) VALUES (?, ?, ?, 'LOCAL', ?, ?, true, true)",
                    staffProfileId, "staff@shopwise.com", encodedPass, staffRoleId, "Staff Operator");
            jdbcTemplate.update("INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, is_active, email_verified) VALUES (?, ?, ?, 'LOCAL', ?, ?, true, true)",
                    customerProfileId, "customer@shopwise.com", encodedPass, customerRoleId, "Client Buyer");

            // 4. Seed Categories
            UUID laptopCatId = UUID.randomUUID();
            UUID keyboardCatId = UUID.randomUUID();
            UUID phoneCatId = UUID.randomUUID();

            jdbcTemplate.update("INSERT INTO categories (id, name, slug, description, parent_id, is_active) VALUES (?, 'Laptop', 'laptop', 'Máy tính xách tay cấu hình cao', null, true)", laptopCatId);
            jdbcTemplate.update("INSERT INTO categories (id, name, slug, description, parent_id, is_active) VALUES (?, 'Bàn phím cơ', 'ban-phim-co', 'Bàn phím cơ gaming & văn phòng', null, true)", keyboardCatId);
            jdbcTemplate.update("INSERT INTO categories (id, name, slug, description, parent_id, is_active) VALUES (?, 'Điện thoại', 'dien-thoai', 'Smartphones chính hãng', null, true)", phoneCatId);

            // 5. Seed Products
            // Laptop ASUS ZenBook
            UUID zenbookProdId = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO products (id, name, slug, description, brand, origin, thumbnail, category_id, warranty_months, rating_avg, review_count, is_active) VALUES (?, 'Laptop ASUS ZenBook 14 UM3406', 'laptop-asus-zenbook-14-um3406', 'Dòng laptop cao cấp mỏng nhẹ màn hình OLED', 'ASUS', 'Đài Loan', 'https://zzukpubwbntihzztilqy.supabase.co/storage/v1/object/public/product-images/82915ae...png', ?, 24, 4.8, 12, true)",
                    zenbookProdId, laptopCatId);

            // Laptop Dell XPS
            UUID dellProdId = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO products (id, name, slug, description, brand, origin, thumbnail, category_id, warranty_months, rating_avg, review_count, is_active) VALUES (?, 'Laptop Dell Pro 13 Plus PB13250', 'laptop-dell-pro-13-plus-pb13250', 'Máy tính Dell đỉnh cao cấu hình văn phòng', 'Dell', 'Mỹ', 'https://zzukpubwbntihzztilqy.supabase.co/storage/v1/object/public/product-images/51fbbdb...png', ?, 12, 4.5, 4, true)",
                    dellProdId, laptopCatId);

            // Bàn phím Akko
            UUID akkoProdId = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO products (id, name, slug, description, brand, origin, thumbnail, category_id, warranty_months, rating_avg, review_count, is_active) VALUES (?, 'Bàn phím cơ Akko 3098B Plus', 'ban-phim-co-akko-3098b-plus', 'Bàn phím cơ không dây đa chế độ kết nối', 'Akko', 'Trung Quốc', '', ?, 12, 4.9, 25, true)",
                    akkoProdId, keyboardCatId);

            // 6. Seed Product Variants
            // ASUS Variants
            UUID asusVar1 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO product_variants (id, product_id, sku, variant_name, price, stock, attributes, vat_percent, is_active) VALUES (?, ?, 'ASU-ZEN14-01', 'Xám - Ryzen 7 / 16GB / 512GB', 28990000.00, 15, '{\"Màu sắc\": \"Xám\", \"Cấu hình\": \"R7/16GB/512GB\"}'::jsonb, 10.00, true)",
                    asusVar1, zenbookProdId);

            UUID asusVar2 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO product_variants (id, product_id, sku, variant_name, price, stock, attributes, vat_percent, is_active) VALUES (?, ?, 'ASU-ZEN14-02', 'Bạc - Ryzen 7 / 32GB / 1TB', 34990000.00, 5, '{\"Màu sắc\": \"Bạc\", \"Cấu hình\": \"R7/32GB/1TB\"}'::jsonb, 10.00, true)",
                    asusVar2, zenbookProdId);

            // Dell Variants
            UUID dellVar1 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO product_variants (id, product_id, sku, variant_name, price, stock, attributes, vat_percent, is_active) VALUES (?, ?, 'DEL-XPS13-01', 'Bạc - Ultra 7 / 16GB / 512GB', 35990000.00, 8, '{\"Màu sắc\": \"Bạc\", \"Cấu hình\": \"U7/16GB/512GB\"}'::jsonb, 10.00, true)",
                    dellVar1, dellProdId);

            // Akko Variants
            UUID akkoVar1 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO product_variants (id, product_id, sku, variant_name, price, stock, attributes, vat_percent, is_active) VALUES (?, ?, 'AKK-3098B-01', 'Ocean Star - Akko Blue Switch', 1890000.00, 50, '{\"Màu sắc\": \"Ocean Star\", \"Switch\": \"Akko Blue\"}'::jsonb, 10.00, true)",
                    akkoVar1, akkoProdId);

            UUID akkoVar2 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO product_variants (id, product_id, sku, variant_name, price, stock, attributes, vat_percent, is_active) VALUES (?, ?, 'AKK-3098B-02', 'Ocean Star - Akko Pink Switch', 1890000.00, 0, '{\"Màu sắc\": \"Ocean Star\", \"Switch\": \"Akko Pink\"}'::jsonb, 10.00, true)",
                    akkoVar2, akkoProdId);

            // 7. Seed Orders
            UUID order1 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO orders (id, user_id, address_id, voucher_id, discount_amount, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, null, null, 0.00, 'Client Buyer', 'customer@shopwise.com', '0912345678', '99 Đường số 9, Quận 7, TP.HCM', 30880000.00, 'PENDING', 'COD', 'PENDING', CURRENT_TIMESTAMP)",
                    order1, customerProfileId);

            UUID order2 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO orders (id, user_id, address_id, voucher_id, discount_amount, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, null, null, 0.00, 'Nguyễn Văn Linh', 'linh.nguyen@gmail.com', '0988776655', '12 Lê Lợi, Quận 1, TP.HCM', 35990000.00, 'COMPLETED', 'VNPAY', 'PAID', CURRENT_TIMESTAMP - INTERVAL '2 days')",
                    order2, customerProfileId);

            // 8. Seed Order Items
            UUID orderItem1_1 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_purchase, attributes_snapshot) VALUES (?, ?, ?, ?, 1, 28990000.00, '{\"Màu sắc\": \"Xám\"}'::jsonb)",
                    orderItem1_1, order1, zenbookProdId, asusVar1);

            UUID orderItem1_2 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_purchase, attributes_snapshot) VALUES (?, ?, ?, ?, 1, 1890000.00, '{\"Switch\": \"Akko Blue\"}'::jsonb)",
                    orderItem1_2, order1, akkoProdId, akkoVar1);

            UUID orderItem2_1 = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_purchase, attributes_snapshot) VALUES (?, ?, ?, ?, 1, 35990000.00, '{\"Màu sắc\": \"Bạc\"}'::jsonb)",
                    orderItem2_1, order2, dellProdId, dellVar1);

            // 9. Seed Warranty Cards
            UUID warrantyCard = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO warranty_cards (id, order_id, order_item_id, customer_name, customer_phone, customer_email, product_name, serial_number, purchase_date, warranty_months, expiry_date, status, notes, warranty_code) VALUES (?, ?, ?, 'Nguyễn Văn Linh', '0988776655', 'linh.nguyen@gmail.com', 'Laptop Dell Pro 13 Plus PB13250', 'SN-DELL-XPS-99812', CURRENT_DATE - 2, 12, CURRENT_DATE + 363, 'ACTIVE', 'Thẻ bảo hành chính hãng kích hoạt tự động', 'WR-DELL-XPS-13')",
                    warrantyCard, order2, orderItem2_1);

            // 10. Seed Warranty History
            jdbcTemplate.update("INSERT INTO warranty_histories (id, warranty_card_id, request_date, issue_description, repair_action, status, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP - INTERVAL '1 day', 'Nút nguồn chập chờn khó bật', 'Đã vệ sinh tiếp điểm và cố định cáp nguồn', 'COMPLETED', CURRENT_TIMESTAMP)",
                    UUID.randomUUID(), warrantyCard);

            // 11. Seed Audit Logs
            jdbcTemplate.update("INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent) VALUES (?, ?, 'CREATE_PRODUCT', 'PRODUCT', ?, null, '{\"name\": \"Laptop ASUS ZenBook\"}'::jsonb, '127.0.0.1', 'Mozilla/5.0')",
                    UUID.randomUUID(), adminProfileId, zenbookProdId.toString());

            return ApiResponse.<String>builder()
                    .success(true)
                    .data("Dữ liệu thử nghiệm phong phú đã được Seed thành công vào Database!")
                    .timestamp(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .success(false)
                    .message("Lỗi khi seeding dữ liệu: " + e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
        }
    }
}
