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

/**
 * Seed dữ liệu demo đầy đủ: users, danh mục, sản phẩm, biến thể, giỏ hàng,
 * đơn hàng, đánh giá, voucher, phiếu bảo hành, hội thoại chatbot + sự kiện
 * chuyển đổi, điều chỉnh tồn kho, audit logs.
 */
@RestController
@RequiredArgsConstructor
public class DevDatabaseSeedController {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/dev/seed-data")
    @Transactional
    public ApiResponse<String> seedDemoData() {
        try {
            clearExistingData();

            UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'ADMIN'", UUID.class);
            UUID staffRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'STAFF'", UUID.class);
            UUID customerRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'CUSTOMER'", UUID.class);

            if (adminRoleId == null || staffRoleId == null || customerRoleId == null) {
                return ApiResponse.<String>builder()
                        .success(false)
                        .message("Roles (ADMIN, STAFF, CUSTOMER) not found. Run flyway migrations first.")
                        .timestamp(LocalDateTime.now())
                        .build();
            }

            String encodedPass = passwordEncoder.encode("123456");

            // ===== 1. Users =====
            Map<String, UUID> customers = new LinkedHashMap<>();
            UUID adminId = insertUser("admin@shopwise.com", "Super Admin", adminRoleId, encodedPass);
            UUID staffId = insertUser("staff@shopwise.com", "Staff Operator", staffRoleId, encodedPass);
            String[] custEmails = {"customer@shopwise.com", "nguyen.van.a@gmail.com", "tran.thi.b@gmail.com",
                    "le.van.c@gmail.com", "pham.quoc.d@gmail.com"};
            String[] custNames = {"Client Buyer", "Nguyễn Văn An", "Trần Thị Bích", "Lê Văn Cường", "Phạm Quốc Đạt"};
            for (int i = 0; i < custEmails.length; i++) {
                UUID uid = insertUser(custEmails[i], custNames[i], customerRoleId, encodedPass);
                customers.put(custEmails[i], uid);
            }

            // ===== 2. Categories =====
            UUID laptopCat = insertCategory("Laptop", "laptop", "Máy tính xách tay");
            UUID phoneCat = insertCategory("Điện thoại", "dien-thoai", "Smartphone chính hãng");
            UUID keyboardCat = insertCategory("Bàn phím cơ", "ban-phim-co", "Bàn phím cơ gaming & văn phòng");
            UUID accessoryCat = insertCategory("Phụ kiện", "phu-kien", "Tai nghe, sạc, phụ kiện công nghệ");

            // ===== 3. Products + Variants =====
            // Laptops
            UUID asusProd = insertProduct("Laptop ASUS ZenBook 14 UM3406", "laptop-asus-zenbook-14-um3406",
                    "Dòng laptop cao cấp mỏng nhẹ màn hình OLED", "ASUS", "Đài Loan", laptopCat, 24, 4.8, 12);
            UUID asusVar1 = insertVariant(asusProd, "ASU-ZEN14-01", "Xám - Ryzen 7 / 16GB / 512GB", 28990000.00, 15, "{\"Màu sắc\": \"Xám\"}");
            UUID asusVar2 = insertVariant(asusProd, "ASU-ZEN14-02", "Bạc - Ryzen 7 / 32GB / 1TB", 34990000.00, 5, "{\"Màu sắc\": \"Bạc\"}");

            UUID dellProd = insertProduct("Laptop Dell Pro 13 Plus PB13250", "laptop-dell-pro-13-plus-pb13250",
                    "Máy tính Dell đỉnh cao cấu hình văn phòng", "Dell", "Mỹ", laptopCat, 12, 4.5, 4);
            UUID dellVar = insertVariant(dellProd, "DEL-XPS13-01", "Bạc - Ultra 7 / 16GB / 512GB", 35990000.00, 8, "{\"Màu sắc\": \"Bạc\"}");

            UUID msiProd = insertProduct("Laptop Gaming MSI Cyborg 15 A13UC", "laptop-gaming-msi-cyborg-15-a13uc",
                    "Laptop gaming hiệu năng cao RTX 3050", "MSI", "Đài Loan", laptopCat, 24, 4.9, 25);
            UUID msiVar = insertVariant(msiProd, "MSI-CYB15-01", "Đen - i5/16GB/512GB/RTX3050", 23990000.00, 12, "{\"Màu sắc\": \"Đen\"}");

            // Phones
            UUID iphoneProd = insertProduct("iPhone 15 Pro Max 256GB", "iphone-15-pro-max-256gb",
                    "Smartphone flagship camera tiên tiến", "Apple", "Mỹ", phoneCat, 12, 4.9, 40);
            UUID iphoneVar = insertVariant(iphoneProd, "IPH-15PM-01", "Titan Tự Nhiên - 256GB", 32990000.00, 20, "{\"Màu sắc\": \"Titan Tự Nhiên\"}");

            UUID samsungProd = insertProduct("Samsung Galaxy S24 Ultra 5G", "samsung-galaxy-s24-ultra-5g",
                    "Smartphone cao cấp bút S-Pen, camera 200MP", "Samsung", "Hàn Quốc", phoneCat, 12, 4.8, 30);
            UUID samsungVar = insertVariant(samsungProd, "SAM-S24U-01", "Titan Đen - 256GB", 29990000.00, 18, "{\"Màu sắc\": \"Titan Đen\"}");

            // Keyboards
            UUID akkoProd = insertProduct("Bàn phím cơ Akko 3098B Plus", "ban-phim-co-akko-3098b-plus",
                    "Bàn phím cơ không dây đa chế độ kết nối", "Akko", "Trung Quốc", keyboardCat, 12, 4.9, 25);
            UUID akkoVar1 = insertVariant(akkoProd, "AKK-3098B-01", "Ocean Star - Akko Blue", 1890000.00, 50, "{\"Màu sắc\": \"Ocean Star\"}");
            UUID akkoVar2 = insertVariant(akkoProd, "AKK-3098B-02", "Ocean Star - Akko Pink", 1890000.00, 0, "{\"Màu sắc\": \"Ocean Star\", \"Switch\": \"Akko Pink\"}");

            // Accessories
            UUID airpodsProd = insertProduct("Tai nghe Apple AirPods Pro 2", "tai-nghe-apple-airpods-pro-2",
                    "Tai nghe chống ồn chủ động thế hệ mới", "Apple", "Mỹ", accessoryCat, 12, 4.7, 50);
            UUID airpodsVar = insertVariant(airpodsProd, "APP-AIRP2-01", "Trắng - USB-C", 5990000.00, 35, "{\"Màu sắc\": \"Trắng\"}");

            // ===== 4. Addresses =====
            UUID addr1 = insertAddress(customers.get("customer@shopwise.com"), "Client Buyer", "0912345678", "99 Đường số 9, Quận 7, TP.HCM");
            UUID addr2 = insertAddress(customers.get("nguyen.van.a@gmail.com"), "Nguyễn Văn An", "0988776655", "12 Lê Lợi, Quận 1, TP.HCM");

            // ===== 5. Cart Items =====
            insertCartItem(customers.get("customer@shopwise.com"), iphoneVar, 1);
            insertCartItem(customers.get("nguyen.van.a@gmail.com"), akkoVar1, 2);

            // ===== 6. Orders + Items =====
            // Order 1: PENDING, COD
            UUID order1 = insertOrder(customers.get("customer@shopwise.com"), addr1, null, 0.00,
                    "Client Buyer", "customer@shopwise.com", "0912345678", "99 Đường số 9, Quận 7, TP.HCM",
                    30880000.00, "PENDING", "COD", "PENDING", LocalDateTime.now().minusHours(3));
            UUID oi1_1 = insertOrderItem(order1, iphoneProd, iphoneVar, 1, 32990000.00);
            UUID oi1_2 = insertOrderItem(order1, akkoProd, akkoVar1, 1, 1890000.00);

            // Order 2: COMPLETED, VNPAY
            UUID order2 = insertOrder(customers.get("nguyen.van.a@gmail.com"), addr2, null, 0.00,
                    "Nguyễn Văn An", "nguyen.van.a@gmail.com", "0988776655", "12 Lê Lợi, Quận 1, TP.HCM",
                    35990000.00, "COMPLETED", "VNPAY", "PAID", LocalDateTime.now().minusDays(2));
            UUID oi2_1 = insertOrderItem(order2, dellProd, dellVar, 1, 35990000.00);
            insertPayment(order2, "VNPAY", "VNPAY-" + UUID.randomUUID().toString().substring(0, 16), 35990000.00, "SUCCESS", LocalDateTime.now().minusDays(2).minusHours(1));

            // Order 3: SHIPPED, VNPAY - order placed via chatbot (conversion)
            UUID order3 = insertOrder(customers.get("tran.thi.b@gmail.com"), null, null, 0.00,
                    "Trần Thị Bích", "tran.thi.b@gmail.com", "0977112233", "45 Nguyễn Huệ, TP.HCM",
                    23990000.00, "SHIPPED", "VNPAY", "PAID", LocalDateTime.now().minusDays(1));
            UUID oi3_1 = insertOrderItem(order3, msiProd, msiVar, 1, 23990000.00);
            insertPayment(order3, "STRIPE", "STRIPE-" + UUID.randomUUID().toString().substring(0, 16), 23990000.00, "SUCCESS", LocalDateTime.now().minusDays(1).minusHours(2));

            // Order 4: CANCELLED
            UUID order4 = insertOrder(customers.get("le.van.c@gmail.com"), null, null, 0.00,
                    "Lê Văn Cường", "le.van.c@gmail.com", "0966554433", "88 Bạch Đằng, Đà Nẵng",
                    29990000.00, "CANCELLED", "COD", "PENDING", LocalDateTime.now().minusDays(5));

            // Order 5: COMPLETED - another chatbot conversion (AirPods)
            UUID order5 = insertOrder(customers.get("pham.quoc.d@gmail.com"), null, null, 0.00,
                    "Phạm Quốc Đạt", "pham.quoc.d@gmail.com", "0900111222", "7 Trần Phú, Hà Nội",
                    5990000.00, "COMPLETED", "COD", "PAID", LocalDateTime.now().minusDays(6));
            insertOrderItem(order5, airpodsProd, airpodsVar, 1, 5990000.00);

            // ===== 7. Reviews =====
            insertReview(iphoneProd, oi1_1, customers.get("customer@shopwise.com"), 5, "Máy rất xịn, camera tuyệt vời!", "APPROVED");
            insertReview(dellProd, oi2_1, customers.get("nguyen.van.a@gmail.com"), 4, "Cấu hình mượt, chỉ hơi nóng.", "APPROVED");
            insertReview(msiProd, oi3_1, customers.get("tran.thi.b@gmail.com"), 5, "Chơi game mượt mà, đáng tiền.", "APPROVED");

            // ===== 8. Vouchers + usages =====
            UUID voucher1 = insertVoucher("GIAM10K", "Giảm 10% đơn từ 5 triệu", "PERCENT", 10.00, 1000000.00, 1000000.00, 100, LocalDateTime.now().minusDays(10), LocalDateTime.now().plusDays(30));
            UUID voucher2 = insertVoucher("TET2026", "Giảm 500k đơn từ 10 triệu", "FIXED", 500000.00, 0.00, 10000000.00, 50, LocalDateTime.now().minusDays(5), LocalDateTime.now().plusDays(60));
            insertVoucherUsage(voucher1, order1, customers.get("customer@shopwise.com"), 3000000.00, LocalDateTime.now().minusHours(3));

            // ===== 9. Warranty =====
            UUID warrantyCard = insertWarrantyCard(order2, oi2_1, customers.get("nguyen.van.a@gmail.com"), "Nguyễn Văn An", "0988776655", "nguyen.van.a@gmail.com",
                    "Laptop Dell Pro 13 Plus PB13250", "SN-DELL-XPS-99812", "WR-DELL-XPS-13", LocalDateTime.now().minusDays(2), 12);
            jdbcTemplate.update("INSERT INTO warranty_histories (id, warranty_card_id, request_date, description, issue_description, repair_action, status, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP - INTERVAL '1 day', 'Bảo hành định kỳ', 'Nút nguồn chập chờn', 'Đã vệ sinh tiếp điểm', 'COMPLETED', CURRENT_TIMESTAMP)",
                    UUID.randomUUID(), warrantyCard);

            // ===== 10. Chat conversations + messages + conversion events =====
            // Conversation 1 (customer@shopwise.com) -> chat + add to cart + order placed
            UUID conv1 = insertConversation("conv-" + customers.get("customer@shopwise.com").toString().substring(0, 8), customers.get("customer@shopwise.com"),
                    "CLOSED", staffId, "CHATBOT", null, LocalDateTime.now().minusDays(1).minusHours(2), LocalDateTime.now().minusDays(1).minusHours(1));
            insertChatMessage(conv1, "USER", "Tư vấn cho tôi một chiếc iPhone tầm 35 triệu?", "ask_product", 0.98);
            insertChatMessage(conv1, "ASSISTANT", "Gợi ý **iPhone 15 Pro Max 256GB** giá 32.990.000đ.", "recommend", 0.96, new String[]{iphoneProd.toString()});
            insertChatMessage(conv1, "USER", "Tôi muốn mua luôn.", "purchase_intent", 0.9);
            insertConversion(conv1, customers.get("customer@shopwise.com"), iphoneProd, iphoneVar, order1, "ORDER_PLACED", LocalDateTime.now().minusDays(1).minusHours(1));
            insertConversion(conv1, customers.get("customer@shopwise.com"), iphoneProd, iphoneVar, null, "ADD_TO_CART", LocalDateTime.now().minusDays(1).minusHours(2));

            // Conversation 2 (tran.thi.b@gmail.com) -> chat -> order
            UUID conv2 = insertConversation("conv-" + customers.get("tran.thi.b@gmail.com").toString().substring(0, 8), customers.get("tran.thi.b@gmail.com"),
                    "CLOSED", null, "CHATBOT", null, LocalDateTime.now().minusDays(1).minusHours(4), LocalDateTime.now().minusDays(1).minusHours(2));
            insertChatMessage(conv2, "USER", "Laptop gaming dưới 25 triệu cấu hình mạnh?", "ask_product", 0.97);
            insertChatMessage(conv2, "ASSISTANT", "**MSI Cyborg 15** phù hợp với ngân sách của bạn.", "recommend", 0.95, new String[]{msiProd.toString()});
            insertConversion(conv2, customers.get("tran.thi.b@gmail.com"), msiProd, msiVar, order3, "ORDER_PLACED", LocalDateTime.now().minusDays(1).minusHours(2));

            // Conversation 3 (active, needs review)
            UUID conv3 = insertConversation("conv-" + customers.get("pham.quoc.d@gmail.com").toString().substring(0, 8), customers.get("pham.quoc.d@gmail.com"),
                    "ACTIVE", null, "CHATBOT", null, LocalDateTime.now().minusMinutes(30), null);
            insertChatMessage(conv3, "USER", "Tai nghe chống ồn nào tốt?", "ask_product", 0.92);
            insertChatMessage(conv3, "ASSISTANT", "**AirPods Pro 2** là lựa chọn tốt nhất hiện nay.", "recommend", 0.94, new String[]{airpodsProd.toString()});
            insertChatMessage(conv3, "USER", "Có giảm giá gì không?", "ask_promotion", 0.88, null, "NEEDS_REVIEW", "Câu trả lời thiếu thông tin khuyến mãi chi tiết");

            // Conversation 4 (guest, unanswered / handoff needed)
            UUID conv4 = insertConversation("conv-guest-handoff", null, "HANDOFF", staffId, "CHATBOT", null,
                    LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(5));
            insertChatMessage(conv4, "USER", "Thanh toán bị lỗi, tôi phải làm sao?", "payment_issue", 0.85);
            insertChatMessage(conv4, "ASSISTANT", "Để tôi kết nối bạn với nhân viên hỗ trợ.", "handoff", 0.9);

            // ===== 11. Inventory adjustments =====
            insertInventoryAdjustment(asusVar2, -2, "DAMAGED", "Phát hiện 2 máy lỗi màn hình", adminId);
            insertInventoryAdjustment(akkoVar1, 10, "STOCK_IN", "Nhập hàng bổ sung lô mới", staffId);

            // ===== 12. Audit logs =====
            insertAuditLog(adminId, "CREATE_PRODUCT", "PRODUCT", asusProd.toString(), "{\"name\": \"Laptop ASUS ZenBook\"}");
            insertAuditLog(staffId, "ADJUST_INVENTORY", "PRODUCT_VARIANT", akkoVar1.toString(), "{\"delta\": 10, \"reason\": \"STOCK_IN\"}");

            return ApiResponse.<String>builder()
                    .success(true)
                    .data("Dữ liệu demo đầy đủ đã được Seed thành công! (users, sản phẩm, đơn hàng, review, voucher, chatbot, báo cáo...)")
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

    private void clearExistingData() {
        jdbcTemplate.execute("TRUNCATE TABLE chat_conversion_events CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE chat_messages CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE chat_conversations CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE warranty_histories CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE warranty_cards CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE payment_transactions CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE voucher_usages CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE vouchers CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE product_reviews CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE order_items CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE orders CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE cart_items CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE inventory_adjustments CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE audit_logs CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE addresses CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE product_variants CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE product_images CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE products CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE categories CASCADE");
        jdbcTemplate.execute("DELETE FROM profiles WHERE email IN ('admin@shopwise.com','staff@shopwise.com','customer@shopwise.com','nguyen.van.a@gmail.com','tran.thi.b@gmail.com','le.van.c@gmail.com','pham.quoc.d@gmail.com')");
    }

    private UUID insertUser(String email, String name, UUID roleId, String encodedPass) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, phone_number, is_active, email_verified) VALUES (?, ?, ?, 'LOCAL', ?, ?, null, true, true)",
                id, email, encodedPass, roleId, name);
        return id;
    }

    private UUID insertCategory(String name, String slug, String desc) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO categories (id, name, slug, description, parent_id, is_active) VALUES (?, ?, ?, ?, null, true)", id, name, slug, desc);
        return id;
    }

    private UUID insertProduct(String name, String slug, String desc, String brand, String origin, UUID catId,
                               int warrantyMonths, double rating, int reviewCount) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO products (id, name, slug, description, brand, origin, thumbnail, category_id, warranty_months, rating_avg, review_count, is_active) VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, true)",
                id, name, slug, desc, brand, origin, catId, warrantyMonths, rating, reviewCount);
        return id;
    }

    private UUID insertVariant(UUID productId, String sku, String variantName, double price, int stock, String attributes) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO product_variants (id, product_id, sku, variant_name, price, stock, attributes, vat_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, 10.00, true)",
                id, productId, sku, variantName, price, stock, attributes);
        return id;
    }

    private UUID insertAddress(UUID profileId, String fullName, String phone, String line) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO addresses (id, profile_id, recipient_name, phone, province, district, ward, detail_address, is_default) VALUES (?, ?, ?, ?, 'TP.HCM', 'Quận 1', 'Phường Bến Nghé', ?, true)",
                id, profileId, fullName, phone, line);
        return id;
    }

    private void insertCartItem(UUID profileId, UUID variantId, int qty) {
        jdbcTemplate.update("INSERT INTO cart_items (id, profile_id, variant_id, quantity) VALUES (?, ?, ?, ?)", UUID.randomUUID(), profileId, variantId, qty);
    }

    private UUID insertOrder(UUID userId, UUID addrId, UUID voucherId, double discount, String name, String email,
                             String phone, String shipAddr, double total, String status, String payMethod, String payStatus, LocalDateTime createdAt) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO orders (id, user_id, address_id, voucher_id, discount_amount, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, userId, addrId, voucherId, discount, name, email, phone, shipAddr, total, status, payMethod, payStatus, createdAt);
        return id;
    }

    private UUID insertOrderItem(UUID orderId, UUID productId, UUID variantId, int qty, double price) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_purchase, attributes_snapshot) VALUES (?, ?, ?, ?, ?, ?, '{}'::jsonb)",
                id, orderId, productId, variantId, qty, price);
        return id;
    }

    private void insertPayment(UUID orderId, String provider, String txnId, double amount, String status, LocalDateTime paidAt) {
        jdbcTemplate.update("INSERT INTO payment_transactions (id, order_id, provider, provider_transaction_id, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), orderId, provider, txnId, amount, status, paidAt);
    }

    private void insertReview(UUID productId, UUID orderItemId, UUID profileId, int rating, String comment, String status) {
        jdbcTemplate.update("INSERT INTO product_reviews (id, product_id, order_item_id, profile_id, rating, comment, images, status) VALUES (?, ?, ?, ?, ?, ?, '[]'::jsonb, ?)",
                UUID.randomUUID(), productId, orderItemId, profileId, rating, comment, status);
    }

    private UUID insertVoucher(String code, String desc, String type, double value, double maxDiscount, double minOrder,
                               int maxUsage, LocalDateTime start, LocalDateTime end) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO vouchers (id, code, description, discount_type, discount_value, max_discount_amount, min_order_value, max_usage, max_usage_per_user, used_count, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, true)",
                id, code, desc, type, value, maxDiscount, minOrder, maxUsage, start, end);
        return id;
    }

    private void insertVoucherUsage(UUID voucherId, UUID orderId, UUID profileId, double discount, LocalDateTime usedAt) {
        jdbcTemplate.update("INSERT INTO voucher_usages (id, voucher_id, order_id, profile_id, discount_amount, used_at) VALUES (?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), voucherId, orderId, profileId, discount, usedAt);
    }

    private UUID insertWarrantyCard(UUID orderId, UUID orderItemId, UUID customerId, String name, String phone, String email, String productName,
                                    String serial, String code, LocalDateTime purchaseDate, int warrantyMonths) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO warranty_cards (id, order_id, order_item_id, customer_id, customer_name, customer_phone, customer_email, product_name, serial_number, purchase_date, warranty_months, starts_at, expires_at, expiry_date, status, warranty_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE + " + warrantyMonths * 30 + ", 'ACTIVE', ?)",
                id, orderId, orderItemId, customerId, name, phone, email, productName, serial, purchaseDate, warrantyMonths, purchaseDate, purchaseDate.plusMonths(warrantyMonths), code);
        return id;
    }

    private UUID insertConversation(String sessionId, UUID userId, String status, UUID staffId, String source,
                                    UUID kbVersionId, LocalDateTime startedAt, LocalDateTime endedAt) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO chat_conversations (id, session_id, user_id, status, handoff_staff_id, source, kb_version_id, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, sessionId, userId, status, staffId, source, kbVersionId, startedAt, endedAt);
        return id;
    }

    private void insertChatMessage(UUID convId, String role, String content, String intent, double confidence) {
        insertChatMessage(convId, role, content, intent, confidence, null, "NONE", null);
    }

    private void insertChatMessage(UUID convId, String role, String content, String intent, double confidence,
                                   String[] productIds) {
        insertChatMessage(convId, role, content, intent, confidence, productIds, "NONE", null);
    }

    private void insertChatMessage(UUID convId, String role, String content, String intent, double confidence,
                                   String[] productIds, String flagStatus, String flagNote) {
        String productIdsArr = productIds != null && productIds.length > 0
                ? "ARRAY['" + String.join("'::uuid,'", productIds) + "'::uuid]" : null;
        String sql = "INSERT INTO chat_messages (id, conversation_id, role, content, intent, confidence, latency_ms, flag_status, flag_note) VALUES (?, ?, ?, ?, ?, ?, 850, ?, ?)";
        jdbcTemplate.update(sql, UUID.randomUUID(), convId, role, content, intent, confidence, flagStatus, flagNote);
        if (productIdsArr != null) {
            jdbcTemplate.update("UPDATE chat_messages SET product_ids = " + productIdsArr + "::uuid[] WHERE content = ? AND conversation_id = ?", content, convId);
        }
    }

    private void insertConversion(UUID convId, UUID userId, UUID productId, UUID variantId, UUID orderId, String eventType, LocalDateTime createdAt) {
        jdbcTemplate.update("INSERT INTO chat_conversion_events (id, conversation_id, user_id, product_id, variant_id, order_id, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), convId, userId, productId, variantId, orderId, eventType, createdAt);
    }

    private void insertInventoryAdjustment(UUID variantId, int delta, String reason, String note, UUID adjustedBy) {
        jdbcTemplate.update("INSERT INTO inventory_adjustments (id, variant_id, delta, reason, note, adjusted_by) VALUES (?, ?, ?, ?::inventory_adjust_reason, ?, ?)",
                UUID.randomUUID(), variantId, delta, reason, note, adjustedBy);
    }

    private void insertAuditLog(UUID actorId, String action, String resourceType, String resourceId, String newValue) {
        jdbcTemplate.update("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, summary, old_value, new_value, ip_address, user_agent, resource_type, resource_id) VALUES (?, ?, ?, ?, ?, ?, null, ?::jsonb, '127.0.0.1', 'Mozilla/5.0', ?, ?)",
                UUID.randomUUID(), actorId, action, resourceType, resourceId, action, newValue, resourceType, resourceId);
    }
}