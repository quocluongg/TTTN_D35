# Quy tắc Tính Giá và Thứ tự Ưu tiên Khuyến mãi (Pricing Rules)

Tài liệu này mô tả chi tiết logic tính giá, hiển thị phần trăm giảm giá và áp dụng mã khuyến mãi trong hệ thống E-commerce tích hợp RAG Chatbot.

---

## 1. Các Nguồn Giá và Giảm Giá trong Cơ Sở Dữ Liệu

1. **Giá Niêm Yết & Giá Bán của Biến thể (`product_variants.price`)**:
   - Đây là giá bán thực tế (Selling Price) của từng phiên bản sản phẩm (Màu sắc, RAM, SSD...).
   - Đơn vị tính: VNĐ (kiểu dữ liệu `numeric(12,2)`).

2. **Phần trăm Giảm Giá (`discount_percent`)**:
   - **Giảm giá theo Sản phẩm (`products.discount_percent`)**: Mức giảm áp dụng chung cho toàn bộ sản phẩm.
   - **Giảm giá theo Biến thể (`product_variants.discount_percent`)**: Mức giảm đè (override) dành riêng cho từng biến thể cụ thể.

3. **Chương trình Flash Sale / Campaign (`campaigns` & `campaign_items`)**:
   - Mức giá ưu đãi đặc biệt `campaign_items.sale_price` áp dụng trong khung giờ vàng (`start_time` -> `end_time`).
   - Có giới hạn số lượng `stock_quantity`.

4. **Mã Giảm Giá / Voucher (`vouchers`)**:
   - Giảm giá theo đơn hàng (Cart/Checkout level) dựa trên loại giảm (`PERCENTAGE` hoặc `FIXED_AMOUNT`).
   - Ràng buộc: `min_order_amount` (giá trị đơn tối thiểu), `max_discount_amount` (mức giảm tối đa), `usage_limit` (lượt dùng).

---

## 2. Thứ tự Ưu tiên & Logic Tính toán (Business Rules)

### A. Tính Giá Bán Thực Tế của Biến thể (Unit Price)
Khi khách chọn 1 Biến thể sản phẩm:
1. **Nếu đang có Campaign/Flash Sale Active**:
   - Ưu tiên cao nhất: Lấy `campaign_items.sale_price` (nếu còn tồn kho `stock_quantity > 0`).
2. **Nếu không thuộc Campaign**:
   - Lấy `product_variants.price`. Nếu có `product_variants.discount_percent` thì tính giảm theo biến thể; nếu không thì lấy theo `products.discount_percent`.

### B. Hiển thị Giá Gốc (Original Price) trên UI
- **Công thức tính Giá Gốc trước giảm (`original_price`)**:
  $$\text{Original Price} = \frac{\text{Selling Price}}{1 - \frac{\text{Discount Percent}}{100}}$$

### C. Áp dụng Mã Giảm Giá khi Đặt Hàng (Checkout Flow)
1. **Giá từng Item (`order_items.price_at_purchase`)**:
   - Chốt (snapshot) theo Unit Price tại thời điểm đặt hàng.
2. **Tổng Tiền Hàng (`subtotal`)**:
   $$\text{Subtotal} = \sum (\text{item.price\_at\_purchase} \times \text{item.quantity})$$
3. **Mã Ưu Đãi (`discount_amount`)**:
   - Giảm trực tiếp trên Subtotal theo voucher.
4. **Tổng Thanh Toán (`total_amount`)**:
   $$\text{Total Amount} = \text{Subtotal} - \text{Discount Amount} + \text{Shipping Fee}$$

---

## 3. Quy định Bất biến Dữ liệu (Data Invariants)
- `price >= 0` (Giá không được âm).
- `stock >= 0` (Tồn kho không được âm).
- `0 <= discount_percent <= 100` (Phần trăm giảm giá từ 0% đến 100%).
