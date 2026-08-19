package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.response.ApiResponse;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Seed dữ liệu demo ĐẦY ĐỦ & ADDITIVE (không xóa dữ liệu có sẵn):
 *   - KHÔNG truncate / xóa products, categories, variants, images, orders, reviews...
 *   - Tham chiếu các sản phẩm/biến thể THẬT đang có trong DB.
 *   - Tạo mới: users demo, đơn hàng, đánh giá, voucher, phiếu bảo hành, hội thoại
 *     chatbot + sự kiện chuyển đổi, điều chỉnh tồn kho, audit logs.
 *   - Idempotent: dùng UUID xác định + ON CONFLICT DO NOTHING để chạy lại an toàn.
 */
@RestController
@RequiredArgsConstructor
public class DevDatabaseSeedController {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    private record RefVar(UUID variantId, UUID productId, String productName, double price) {}

    @PostMapping("/dev/seed-data")
    @Transactional
    public ApiResponse<String> seedDemoData() {
        try {
            UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'ADMIN'", UUID.class);
            UUID staffRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'STAFF'", UUID.class);
            UUID customerRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE name = 'CUSTOMER'", UUID.class);
            if (adminRoleId == null || staffRoleId == null || customerRoleId == null) {
                return ApiResponse.<String>builder().success(false)
                        .message("Roles (ADMIN, STAFF, CUSTOMER) not found. Run flyway migrations first.")
                        .timestamp(LocalDateTime.now()).build();
            }
            String encodedPass = passwordEncoder.encode("123456");

            // ===== 1. Users (idempotent) =====
            UUID adminId = ensureUser("admin@shopwise.com", "Super Admin", adminRoleId, encodedPass);
            UUID staffId = ensureUser("staff@shopwise.com", "Staff Operator", staffRoleId, encodedPass);
            String[] custEmails = {"customer@shopwise.com", "nguyen.van.a@gmail.com", "tran.thi.b@gmail.com",
                    "le.van.c@gmail.com", "pham.quoc.d@gmail.com"};
            String[] custNames = {"Client Buyer", "Nguyễn Văn An", "Trần Thị Bích", "Lê Văn Cường", "Phạm Quốc Đạt"};
            Map<String, UUID> customers = new LinkedHashMap<>();
            for (int i = 0; i < custEmails.length; i++) {
                customers.put(custEmails[i], ensureUser(custEmails[i], custNames[i], customerRoleId, encodedPass));
            }

            // ===== 2. Reference sản phẩm THẬT đang có (KHÔNG tạo mới) =====
            List<RefVar> variants = jdbcTemplate.query(
                    "SELECT v.id, v.product_id, p.name, v.price FROM product_variants v " +
                    "JOIN products p ON p.id = v.product_id " +
                    "WHERE v.is_active = true ORDER BY v.stock DESC LIMIT 8",
                    (rs, rowNum) -> new RefVar(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class),
                            rs.getString(3), rs.getDouble(4)));
            if (variants.isEmpty()) {
                return ApiResponse.<String>builder().success(false)
                        .message("Không có sản phẩm nào trong DB để tham chiếu. Hãy seed catalogue trước.")
                        .timestamp(LocalDateTime.now()).build();
            }
            RefVar rv0 = variants.get(0), rv1 = variants.get(1), rv2 = variants.get(2),
                    rv3 = variants.get(3), rv4 = variants.size() > 4 ? variants.get(4) : rv0;

            UUID kbVersionId = jdbcTemplate.queryForObject("SELECT id FROM knowledge_base_version ORDER BY created_at LIMIT 1", UUID.class);

            // ===== 3. Địa chỉ (idempotent) =====
            UUID addr1 = insertAddress(customers.get("customer@shopwise.com"), "Client Buyer", "0912345678", "99 Đường số 9, Quận 7, TP.HCM");
            UUID addr2 = insertAddress(customers.get("nguyen.van.a@gmail.com"), "Nguyễn Văn An", "0988776655", "12 Lê Lợi, Quận 1, TP.HCM");

            // ===== 4. Giỏ hàng (idempotent) =====
            insertCartItem(customers.get("customer@shopwise.com"), rv1.variantId, 1);
            insertCartItem(customers.get("nguyen.van.a@gmail.com"), rv0.variantId, 2);

            // ===== 5. Đơn hàng + items + payment (idempotent) =====
            UUID order1 = insertOrder(customers.get("customer@shopwise.com"), addr1, null, 0.00,
                    "Client Buyer", "customer@shopwise.com", "0912345678", "99 Đường số 9, Quận 7, TP.HCM",
                    rv1.price, "PENDING", "COD", "PENDING", LocalDateTime.now().minusHours(3), "1");
            UUID oi1 = insertOrderItem(order1, rv1.productId, rv1.variantId, 1, rv1.price, "1");
            insertReview(rv1.productId, oi1, customers.get("customer@shopwise.com"), 5,
                    "Sản phẩm tốt, đóng gói cẩn thận, nhân viên tư vấn nhiệt tình!", "APPROVED");

            UUID order2 = insertOrder(customers.get("nguyen.van.a@gmail.com"), addr2, null, 0.00,
                    "Nguyễn Văn An", "nguyen.van.a@gmail.com", "0988776655", "12 Lê Lợi, Quận 1, TP.HCM",
                    rv0.price, "COMPLETED", "VNPAY", "PAID", LocalDateTime.now().minusDays(2), "2");
            UUID oi2 = insertOrderItem(order2, rv0.productId, rv0.variantId, 1, rv0.price, "2");
            insertPayment(order2, "VNPAY", "VNPAY-SEED-2", rv0.price, "SUCCESS", LocalDateTime.now().minusDays(2).minusHours(1));
            insertReview(rv0.productId, oi2, customers.get("nguyen.van.a@gmail.com"), 4,
                    "Cấu hình ổn định, giao hàng nhanh, chỉ hơi nóng khi chạy nặng.", "APPROVED");

            UUID order3 = insertOrder(customers.get("tran.thi.b@gmail.com"), null, null, 0.00,
                    "Trần Thị Bích", "tran.thi.b@gmail.com", "0977112233", "45 Nguyễn Huệ, TP.HCM",
                    rv2.price, "SHIPPED", "VNPAY", "PAID", LocalDateTime.now().minusDays(1), "3");
            UUID oi3 = insertOrderItem(order3, rv2.productId, rv2.variantId, 1, rv2.price, "3");
            insertPayment(order3, "STRIPE", "STRIPE-SEED-3", rv2.price, "SUCCESS", LocalDateTime.now().minusDays(1).minusHours(2));
            insertReview(rv2.productId, oi3, customers.get("tran.thi.b@gmail.com"), 5,
                    "Rất hài lòng, đáng tiền, đúng như tư vấn của chatbot.", "APPROVED");

            UUID order4 = insertOrder(customers.get("le.van.c@gmail.com"), null, null, 0.00,
                    "Lê Văn Cường", "le.van.c@gmail.com", "0966554433", "88 Bạch Đằng, Đà Nẵng",
                    rv3.price, "CANCELLED", "COD", "PENDING", LocalDateTime.now().minusDays(5), "4");

            UUID order5 = insertOrder(customers.get("pham.quoc.d@gmail.com"), null, null, 0.00,
                    "Phạm Quốc Đạt", "pham.quoc.d@gmail.com", "0900111222", "7 Trần Phú, Hà Nội",
                    rv4.price, "COMPLETED", "COD", "PAID", LocalDateTime.now().minusDays(6), "5");
            insertOrderItem(order5, rv4.productId, rv4.variantId, 1, rv4.price, "5");

            // ===== 6. Voucher + usage (idempotent theo code) =====
            UUID voucher1 = insertVoucher("GIAM10K", "Giảm 10% đơn từ 5 triệu", "PERCENT", 10.00, 1000000.00, 1000000.00, 100,
                    LocalDateTime.now().minusDays(10), LocalDateTime.now().plusDays(30));
            insertVoucher("TET2026", "Giảm 500k đơn từ 10 triệu", "FIXED", 500000.00, 0.00, 10000000.00, 50,
                    LocalDateTime.now().minusDays(5), LocalDateTime.now().plusDays(60));
            insertVoucherUsage(voucher1, order1, customers.get("customer@shopwise.com"), 3000000.00, LocalDateTime.now().minusHours(3));

            // ===== 7. Phiếu bảo hành + lịch sử (idempotent) =====
            UUID warrantyCard = insertWarrantyCard(order2, oi2, customers.get("nguyen.van.a@gmail.com"), "Nguyễn Văn An",
                    "0988776655", "nguyen.van.a@gmail.com", rv0.productName, "SN-SEED-" + order2.toString().substring(0, 4).toUpperCase(),
                    "WR-" + order2.toString().substring(0, 8).toUpperCase(), LocalDateTime.now().minusDays(2), 12);
            insertWarrantyHistory(warrantyCard);

            // ===== 8. Hội thoại chatbot + sự kiện chuyển đổi (idempotent) =====
            UUID conv1 = insertConversation("seed-conv-customer", customers.get("customer@shopwise.com"),
                    "CLOSED", staffId, "CHATBOT", kbVersionId, LocalDateTime.now().minusDays(1).minusHours(2), LocalDateTime.now().minusDays(1).minusHours(1));
            insertChatMessage(conv1, "USER", "Tư vấn cho tôi một chiếc laptop trong tầm giá hợp lý?", "ask_product", 0.98);
            insertChatMessage(conv1, "ASSISTANT", "Em gợi ý **" + rv1.productName + "** giá " + String.format("%,.0f", rv1.price) + "đ, cấu hình cân đối phù hợp nhu cầu văn phòng và giải trí.", "recommend", 0.96, new String[]{rv1.productId.toString()});
            insertChatMessage(conv1, "USER", "Tôi muốn mua luôn.", "purchase_intent", 0.9);
            insertConversion(conv1, customers.get("customer@shopwise.com"), rv1.productId, rv1.variantId, order1, "ORDER_PLACED", LocalDateTime.now().minusDays(1).minusHours(1));
            insertConversion(conv1, customers.get("customer@shopwise.com"), rv1.productId, rv1.variantId, null, "ADD_TO_CART", LocalDateTime.now().minusDays(1).minusHours(2));

            UUID conv2 = insertConversation("seed-conv-tran", customers.get("tran.thi.b@gmail.com"),
                    "CLOSED", null, "CHATBOT", kbVersionId, LocalDateTime.now().minusDays(1).minusHours(4), LocalDateTime.now().minusDays(1).minusHours(2));
            insertChatMessage(conv2, "USER", "Sản phẩm nào phù hợp cho công việc đồ họa?", "ask_product", 0.97);
            insertChatMessage(conv2, "ASSISTANT", "**" + rv2.productName + "** rất phù hợp, màn hình đẹp và hiệu năng ổn định.", "recommend", 0.95, new String[]{rv2.productId.toString()});
            insertConversion(conv2, customers.get("tran.thi.b@gmail.com"), rv2.productId, rv2.variantId, order3, "ORDER_PLACED", LocalDateTime.now().minusDays(1).minusHours(2));

            UUID conv3 = insertConversation("seed-conv-pham", customers.get("pham.quoc.d@gmail.com"),
                    "ACTIVE", null, "CHATBOT", kbVersionId, LocalDateTime.now().minusMinutes(30), null);
            insertChatMessage(conv3, "USER", "So sánh giúp tôi " + rv3.productName + " và " + rv4.productName + "?", "compare_products", 0.92);
            insertChatMessage(conv3, "ASSISTANT", "Cả hai đều tốt, tùy theo nhu cầu và ngân sách của bạn.", "recommend", 0.60, new String[]{rv3.productId.toString(), rv4.productId.toString()});
            insertChatMessage(conv3, "USER", "Có giảm giá gì không?", "ask_promotion", 0.88, null, "NEEDS_REVIEW", "Câu trả lời thiếu thông tin khuyến mãi chi tiết");

            UUID conv4 = insertConversation("seed-conv-handoff", null,
                    "HANDOFF", staffId, "CHATBOT", kbVersionId, LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(5));
            insertChatMessage(conv4, "USER", "Thanh toán bị lỗi, tôi phải làm sao?", "payment_issue", 0.85);
            insertChatMessage(conv4, "ASSISTANT", "Để em kết nối bạn với nhân viên hỗ trợ ngay nhé.", "handoff", 0.9);

            UUID conv5 = insertConversation("seed-search-le", customers.get("le.van.c@gmail.com"),
                    "CLOSED", null, "SEARCH", null, LocalDateTime.now().minusDays(4).minusHours(3), LocalDateTime.now().minusDays(4).minusHours(1));
            insertChatMessage(conv5, "USER", "Tìm kiếm laptop qua trang chủ.", "search_query", 0.8);
            insertConversion(conv5, customers.get("le.van.c@gmail.com"), rv3.productId, rv3.variantId, order4, "ADD_TO_CART", LocalDateTime.now().minusDays(4).minusHours(2));

            UUID conv6 = insertConversation("seed-search-pham", customers.get("pham.quoc.d@gmail.com"),
                    "CLOSED", null, "SEARCH", null, LocalDateTime.now().minusDays(3).minusHours(2), LocalDateTime.now().minusDays(3).minusHours(1));
            insertChatMessage(conv6, "USER", "Lọc sản phẩm theo bảng giá trong danh mục.", "search_query", 0.75);
            insertConversion(conv6, customers.get("pham.quoc.d@gmail.com"), rv4.productId, rv4.variantId, order5, "ORDER_PLACED", LocalDateTime.now().minusDays(3).minusHours(1));

            // ===== 9. Điều chỉnh tồn kho (idempotent) =====
            insertInventoryAdjustment(rv0.variantId, -2, "DAMAGED", "Phát hiện 2 sản phẩm lỗi trong kho", adminId);
            insertInventoryAdjustment(rv1.variantId, 10, "STOCK_IN", "Nhập hàng bổ sung lô mới", staffId);

            // ===== 10. Audit logs (idempotent) =====
            insertAuditLog(adminId, "CREATE_PRODUCT", "PRODUCT", rv0.productId.toString(), "{\"note\": \"seed demo\"}");
            insertAuditLog(staffId, "ADJUST_INVENTORY", "PRODUCT_VARIANT", rv1.variantId.toString(), "{\"delta\": 10, \"reason\": \"STOCK_IN\"}");

            return ApiResponse.<String>builder().success(true)
                    .data("Seed demo additive thành công! Tham chiếu " + variants.size() + " sản phẩm thật: users, đơn hàng, review, voucher, bảo hành, hội thoại chatbot + chuyển đổi, tồn kho, audit.")
                    .timestamp(LocalDateTime.now()).build();

        } catch (Exception e) {
            return ApiResponse.<String>builder().success(false)
                    .message("Lỗi khi seeding dữ liệu: " + e.getMessage())
                    .timestamp(LocalDateTime.now()).build();
        }
    }

    // ---------- Helpers ----------

    private UUID det(String key) {
        return UUID.nameUUIDFromBytes(("seed-" + key).getBytes());
    }

    private UUID ensureUser(String email, String name, UUID roleId, String encodedPass) {
        List<UUID> ids = jdbcTemplate.query("SELECT id FROM profiles WHERE email = ?",
                (rs, rowNum) -> rs.getObject(1, UUID.class), email);
        if (!ids.isEmpty()) return ids.get(0);
        UUID id = det("user-" + email);
        jdbcTemplate.update("INSERT INTO profiles (id, email, password_hash, auth_provider, role_id, full_name, phone_number, is_active, email_verified) " +
                        "VALUES (?, ?, ?, 'LOCAL', ?, ?, null, true, true) ON CONFLICT (id) DO NOTHING",
                id, email, encodedPass, roleId, name);
        List<UUID> after = jdbcTemplate.query("SELECT id FROM profiles WHERE email = ?",
                (rs, rowNum) -> rs.getObject(1, UUID.class), email);
        return after.isEmpty() ? id : after.get(0);
    }

    private UUID insertAddress(UUID profileId, String fullName, String phone, String line) {
        UUID id = det("addr-" + profileId + "-" + phone);
        jdbcTemplate.update("INSERT INTO addresses (id, profile_id, recipient_name, phone, province, district, ward, detail_address, is_default) " +
                        "VALUES (?, ?, ?, ?, 'TP.HCM', 'Quận 1', 'Phường Bến Nghé', ?, true) ON CONFLICT (id) DO NOTHING",
                id, profileId, fullName, phone, line);
        return id;
    }

    private void insertCartItem(UUID profileId, UUID variantId, int qty) {
        UUID id = det("cart-" + profileId + "-" + variantId);
        jdbcTemplate.update("INSERT INTO cart_items (id, profile_id, variant_id, quantity) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, profileId, variantId, qty);
    }

    private UUID insertOrder(UUID userId, UUID addrId, UUID voucherId, double discount, String name, String email,
                             String phone, String shipAddr, double total, String status, String payMethod, String payStatus,
                             LocalDateTime createdAt, String key) {
        UUID id = det("order-" + key);
        jdbcTemplate.update("INSERT INTO orders (id, user_id, address_id, voucher_id, discount_amount, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, userId, addrId, voucherId, discount, name, email, phone, shipAddr, total, status, payMethod, payStatus, createdAt);
        return id;
    }

    private UUID insertOrderItem(UUID orderId, UUID productId, UUID variantId, int qty, double price, String key) {
        UUID id = det("oi-" + key);
        jdbcTemplate.update("INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_purchase, attributes_snapshot) " +
                        "VALUES (?, ?, ?, ?, ?, ?, '{}'::jsonb) ON CONFLICT (id) DO NOTHING",
                id, orderId, productId, variantId, qty, price);
        return id;
    }

    private void insertPayment(UUID orderId, String provider, String txnId, double amount, String status, LocalDateTime paidAt) {
        UUID id = det("pay-" + orderId);
        jdbcTemplate.update("INSERT INTO payment_transactions (id, order_id, provider, provider_transaction_id, amount, status, paid_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, orderId, provider, txnId, amount, status, paidAt);
    }

    private void insertReview(UUID productId, UUID orderItemId, UUID profileId, int rating, String comment, String status) {
        UUID id = det("review-" + orderItemId);
        jdbcTemplate.update("INSERT INTO product_reviews (id, product_id, order_item_id, profile_id, rating, comment, images, status) " +
                        "VALUES (?, ?, ?, ?, ?, ?, '[]'::jsonb, ?) ON CONFLICT (id) DO NOTHING",
                id, productId, orderItemId, profileId, rating, comment, status);
    }

    private UUID insertVoucher(String code, String desc, String type, double value, double maxDiscount, double minOrder,
                               int maxUsage, LocalDateTime start, LocalDateTime end) {
        UUID id = det("voucher-" + code);
        jdbcTemplate.update("INSERT INTO vouchers (id, code, description, discount_type, discount_value, max_discount_amount, min_order_value, max_usage, max_usage_per_user, used_count, start_time, end_time, is_active) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, true) ON CONFLICT (code) DO NOTHING",
                id, code, desc, type, value, maxDiscount, minOrder, maxUsage, start, end);
        List<UUID> ids = jdbcTemplate.query("SELECT id FROM vouchers WHERE code = ?",
                (rs, rowNum) -> rs.getObject(1, UUID.class), code);
        return ids.isEmpty() ? id : ids.get(0);
    }

    private void insertVoucherUsage(UUID voucherId, UUID orderId, UUID profileId, double discount, LocalDateTime usedAt) {
        UUID id = det("vu-" + orderId);
        jdbcTemplate.update("INSERT INTO voucher_usages (id, voucher_id, order_id, profile_id, discount_amount, used_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, voucherId, orderId, profileId, discount, usedAt);
    }

    private UUID insertWarrantyCard(UUID orderId, UUID orderItemId, UUID customerId, String name, String phone, String email, String productName,
                                    String serial, String code, LocalDateTime purchaseDate, int warrantyMonths) {
        UUID id = det("warranty-" + orderId);
        jdbcTemplate.update("INSERT INTO warranty_cards (id, order_id, order_item_id, customer_id, customer_name, customer_phone, customer_email, product_name, serial_number, purchase_date, warranty_months, starts_at, expires_at, expiry_date, status, warranty_code) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE + " + warrantyMonths * 30 + ", 'ACTIVE', ?) ON CONFLICT (id) DO NOTHING",
                id, orderId, orderItemId, customerId, name, phone, email, productName, serial, purchaseDate, warrantyMonths, purchaseDate, purchaseDate.plusMonths(warrantyMonths), code);
        return id;
    }

    private void insertWarrantyHistory(UUID warrantyCardId) {
        UUID id = det("wh-" + warrantyCardId);
        jdbcTemplate.update("INSERT INTO warranty_histories (id, warranty_card_id, request_date, description, issue_description, repair_action, status, completed_at) " +
                        "VALUES (?, ?, CURRENT_TIMESTAMP - INTERVAL '1 day', 'Bảo hành định kỳ', 'Kiểm tra tình trạng máy', 'Đã vệ sinh và kiểm tra, máy hoạt động tốt', 'COMPLETED', CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING",
                id, warrantyCardId);
    }

    private UUID insertConversation(String sessionId, UUID userId, String status, UUID staffId, String source,
                                    UUID kbVersionId, LocalDateTime startedAt, LocalDateTime endedAt) {
        UUID id = det("conv-" + sessionId);
        jdbcTemplate.update("INSERT INTO chat_conversations (id, session_id, user_id, status, handoff_staff_id, source, kb_version_id, started_at, ended_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, sessionId, userId, status, staffId, source, kbVersionId, startedAt, endedAt);
        return id;
    }

    private void insertChatMessage(UUID convId, String role, String content, String intent, double confidence) {
        insertChatMessage(convId, role, content, intent, confidence, null, "NONE", null);
    }

    private void insertChatMessage(UUID convId, String role, String content, String intent, double confidence, String[] productIds) {
        insertChatMessage(convId, role, content, intent, confidence, productIds, "NONE", null);
    }

    private void insertChatMessage(UUID convId, String role, String content, String intent, double confidence,
                                   String[] productIds, String flagStatus, String flagNote) {
        UUID id = det("msg-" + convId + "-" + content.hashCode());
        String productIdsArr = productIds != null && productIds.length > 0
                ? "ARRAY['" + String.join("'::uuid,'", productIds) + "'::uuid]" : null;
        jdbcTemplate.update("INSERT INTO chat_messages (id, conversation_id, role, content, intent, confidence, latency_ms, flag_status, flag_note) " +
                        "VALUES (?, ?, ?, ?, ?, ?, 850, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, convId, role, content, intent, confidence, flagStatus, flagNote);
        if (productIdsArr != null) {
            jdbcTemplate.update("UPDATE chat_messages SET product_ids = " + productIdsArr + "::uuid[] WHERE id = ?", id);
        }
    }

    private void insertConversion(UUID convId, UUID userId, UUID productId, UUID variantId, UUID orderId, String eventType, LocalDateTime createdAt) {
        UUID id = det("conv-evt-" + convId + "-" + eventType + "-" + orderId);
        jdbcTemplate.update("INSERT INTO chat_conversion_events (id, conversation_id, user_id, product_id, variant_id, order_id, event_type, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, convId, userId, productId, variantId, orderId, eventType, createdAt);
    }

    private void insertInventoryAdjustment(UUID variantId, int delta, String reason, String note, UUID adjustedBy) {
        UUID id = det("inv-" + variantId + "-" + reason + "-" + delta);
        jdbcTemplate.update("INSERT INTO inventory_adjustments (id, variant_id, delta, reason, note, adjusted_by) " +
                        "VALUES (?, ?, ?, ?::inventory_adjust_reason, ?, ?) ON CONFLICT (id) DO NOTHING",
                id, variantId, delta, reason, note, adjustedBy);
    }

    private void insertAuditLog(UUID actorId, String action, String resourceType, String resourceId, String newValue) {
        UUID id = det("audit-" + action + "-" + resourceId);
        jdbcTemplate.update("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, summary, old_value, new_value, ip_address, user_agent, resource_type, resource_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, null, ?::jsonb, '127.0.0.1', 'Mozilla/5.0', ?, ?) ON CONFLICT (id) DO NOTHING",
                id, actorId, action, resourceType, resourceId, action, newValue, resourceType, resourceId);
    }
}