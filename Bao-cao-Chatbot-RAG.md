# Báo cáo hiệu quả Chatbot RAG

**Tổng quan hiệu suất tư vấn AI & chuyển đổi đơn hàng**

- Kỳ báo cáo: Q2/2026
- Nơi xuất bản: ShopWise
- Xuất bản: 22:50:56 19/8/2026
- Trang: 1

---

## 1. Tóm tắt chỉ số chính (Executive Summary)

| Chỉ tiêu | Giá trị |
|----------|---------|
| Tổng phiên Chat | 20 |
| Yêu cầu tiếp quản (Handoff) | 3 |
| Tỉ lệ chuyển đổi đơn hàng | 35.0% |
| Doanh thu từ Chatbot | 149.9 triệu ₫ |

**Tổng quan & Đánh giá**

Báo cáo này tổng hợp toàn bộ hoạt động của hệ thống tư vấn thông minh Chatbot RAG trong kỳ, bao gồm mức độ tương tác, chất lượng phản hồi của RAG Engine và mức độ đóng góp vào doanh số bán hàng của cửa hàng.

Trong kỳ báo cáo, chatbot đã xử lý 20 phiên hội thoại, trong đó 3 phiên cần chuyển sang nhân viên hỗ trợ. Khách hàng được AI tư vấn có tỉ lệ chốt đơn đạt 35.0%, cao gấp 2.4 lần so với khách chỉ dùng tìm kiếm thông thường (14.5%). Doanh thu ước tính phát sinh từ các gợi ý của chatbot đạt 149.9 triệu đồng.

---

## 2. Chỉ số vận hành RAG Engine

Thời gian phản hồi trung bình của hệ thống là 480 ms, đáp ứng tốt kỳ vọng về trải nghiệm tư vấn thời gian thực. Tỉ lệ trích dẫn nguồn thành công (Hit Rate) đạt 94.2%, khẳng định chất lượng Knowledge Base và mô hình embedding hiện tại.

Tỉ lệ phản hồi lỗi / out-of-scope duy trì ở mức thấp 2.1%, cho thấy hệ thống xử lý tốt phần lớn các câu hỏi trong phạm vi kiến thức của cửa hàng.

| Chỉ số | Giá trị |
|--------|---------|
| Độ trễ trung bình (Latency) | 480 ms |
| Tỉ lệ trích dẫn nguồn thành công (Hit Rate) | 94.2% |
| Tỉ lệ phản hồi lỗi / out-of-scope | 2.1% |
| Tỉ lệ chuyển đổi Chatbot so với Search bar | 35.0% so với 14.5% |

---

## 3. Chỉ số hiệu suất chính (KPI)

| Chỉ tiêu | Giá trị |
|----------|---------|
| Tổng phiên Chat | 20 |
| Yêu cầu tiếp quản (Handoff) | 3 |
| Tỉ lệ chuyển đổi | 35.0% |

---

## 4. Hiệu quả RAG theo phiên bản Knowledge Base

| Phiên bản | Mô hình | Trạng thái | Hit Rate | Latency | Phiên phục vụ |
|-----------|---------|------------|----------|---------|---------------|
| Version 1.0 (Q1/2026) | TF-IDF + Standard chunking | Đã ngừng | 82.1% | 680 ms | 890 phiên |
| Version 2.0 (Q2/2026) | PhoBERT + BGE-M3 (Paragraph split) | Đang vận hành | — | — | — |

---

## 5. Top sản phẩm được tư vấn nhiều nhất

| # | Sản phẩm | Số lần tư vấn | Tỉ lệ |
|---|----------|---------------|-------|
| 1 | Tai nghe Bluetooth Apple AirPods 3 MagSafe | 3 | 300.0% |
| 2 | iPhone 15 256GB | 2 | 200.0% |
| 3 | Laptop ASUS Zenbook A14 UX3407QA-QD299WS | 2 | 200.0% |
| 4 | Laptop MSI Cyborg 15 A13UC-2082VN | 2 | 200.0% |
| 5 | Laptop Acer Aspire Lite Gen 2 AL14-52M-32KV | 3 | 300.0% |
| 6 | Laptop HP 250 G10 B73TQAT | 1 | 100.0% |
| 7 | Laptop Dell Pro 15 Essential PV15250 VKVKD | 2 | 200.0% |
| 8 | Camera DJI Osmo Action 4 | 4 | 400.0% |

> Lưu ý: Cột "Tỉ lệ" đang vượt quá 100% — cần xác minh lại công thức tính.

---

## 6. Top câu hỏi phổ biến theo ý định (Intent)

| # | Nội dung câu hỏi | Intent AI | Tần suất |
|---|------------------|-----------|----------|
| 1 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 2 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 3 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 4 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 5 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 6 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 7 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 8 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 9 | *(thiếu dữ liệu)* | ask_specs | 0 |
| 10 | *(thiếu dữ liệu)* | ask_specs | 0 |

> Lưu ý: Nội dung câu hỏi và tần suất bị trống trong dữ liệu gốc.
