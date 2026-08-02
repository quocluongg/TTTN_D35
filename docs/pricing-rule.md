# Quy tắc Tính Giá và Thứ tự Ưu tiên Khuyến mãi (Pricing Rules)

Tài liệu này mô tả chi tiết logic tính giá, hiển thị phần trăm giảm giá và áp dụng mã khuyến mãi trong toàn bộ hệ thống E-commerce tích hợp AI Chatbot.

---

## 1. Các Nguồn Giá và Giảm Giá trong Cơ Sở Dữ Liệu

1. **Giá Niêm Yết & Giá Bán của Biến thể (`product_variants.price`)**:
   - Đây là giá bán thực tế (Selling Price) của từng phiên bản sản phẩm (Màu sắc, RAM, SSD...).
   - Đơn vị tính: VNĐ (kiểu dữ liệu `numeric(19,2)`).

2. **Phần trăm Giảm Giá (`discount_percent`)**:
   - **Giảm giá theo Sản phẩm (`products.discount_percent`)**: Mức giảm áp dụng chung cho toàn bộ sản phẩm.
   - **Giảm giá theo Biến thể (`product_variants.discount_percent`)**: Mức giảm đè (override) dành riêng cho từng biến thể cụ thể.

3. **Mã Giảm Giá / Voucher (`promotions`)**:
   - Giảm giá theo đơn hàng (Cart/Checkout level) dựa trên loại giảm (`PERCENT` hoặc `FIXED_AMOUNT`).
   - Có các ràng buộc: `minimum_order_amount` (giá trị đơn tối thiểu), `max_discount_amount` (mức giảm tối đa), `starts_at` / `ends_at` (thời gian hiệu lực), `usage_limit` (lượt dùng).

---

## 2. Thứ tự Ưu tiên & Logic Tính toán (Business Rules)

### A. Giá Gốc (Original Price) & Badge Giảm Giá Hiển thị trên UI
- **Thứ tự ưu tiên lấy Phần trăm Giảm Giá (`discount_percent`)**:
  $$\text{Discount Percent} = \text{COALESCE}(\text{product.discount\_percent}, \text{variant.discount\_percent}, 0)$$
- **Công thức tính Giá Gốc trước giảm (`original_price`)**:
  Nếu $\text{Discount Percent} > 0$ và $\text{Selling Price} > 0$:
  $$\text{Original Price} = \frac{\text{Selling Price}}{1 - \frac{\text{Discount Percent}}{100}}$$
- **Hiển thị Badge Giảm Giá**:
  Hiển thị nhãn giảm giá (VD: `-10%`) trên Card sản phẩm dựa theo `discount_percent`.

### B. Áp dụng Khuyến mãi khi Đặt Hàng (Checkout Flow)
1. **Giá từng Item (`order_items.price_at_purchase`)**:
   - Được chốt (snapshot) theo `product_variants.price` tại thời điểm bấm đặt hàng.
2. **Tổng Tiền Hàng (`subtotal`)**:
   $$\text{Subtotal} = \sum (\text{item.price\_at\_purchase} \times \text{item.quantity})$$
3. **Giảm Giá Mã Ưu Đãi (`discount_amount`)**:
   - Khi áp dụng mã Voucher (`promotions`):
     - Nếu `discount_type = 'PERCENT'`: $\text{Discount} = \min(\text{Subtotal} \times \frac{\text{Value}}{100}, \text{max\_discount\_amount})$
     - Nếu `discount_type = 'FIXED_AMOUNT'`: $\text{Discount} = \min(\text{Value}, \text{Subtotal})$
4. **Tổng Thanh Toán (`total_amount`)**:
   $$\text{Total Amount} = \text{Subtotal} - \text{Discount Amount} + \text{Shipping Fee} + \text{Tax Amount}$$

---

## 3. Quy định Bất biến Dữ liệu (Data Invariants)
- `price >= 0` (Giá không được âm).
- `stock >= 0` (Tồn kho không được âm).
- `0 <= discount_percent <= 100` (Phần trăm giảm giá từ 0% đến 100%).
