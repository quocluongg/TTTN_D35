# Plan cập nhật các khoảng trống (Gaps) so với đề cương

> Tài liệu rà soát & kế hoạch bổ sung các tính năng còn thiếu so với mục 3 & 4
> của đề cương "Xây dựng website bán thiết bị điện tử tích hợp Chatbot tư vấn RAG".
>
> Trạng thái: các tính năng nền tảng (chatbot, quản trị hội thoại, analytics, cấu hình RAG)
> **đã hoàn thiện**. Tài liệu này liệt kê **khoảng trống (GAP)** còn lại và kế hoạch xử lý từng mục.

---

## Tổng quan trạng thái

| Nhóm yêu cầu | Trạng thái |
| --- | --- |
| Chatbot khách hàng 24/7 tiếng Việt, tư vấn thông số, so sánh, giá/khuyến mãi/bảo hành, thêm giỏ/đặt hàng | ✅ Đã có |
| Admin: quản lý catalogue + vector DB, hội thoại, gắn cờ, tiếp quản, dashboard | ✅ Đã có |
| Phân hệ quản trị hệ thống: cấu hình RAG, câu hỏi nhạy cảm, KB versions | ⚠️ Gần đủ (G5, G6) |
| Phân hệ báo cáo thống kê | ⚠️ Gần đủ (G1, G3, G4, G7) |
| Seed data toàn diện | ⚠️ Bổ sung (xem `V56__seed_...sql`) |

---

## G1 — Xuất báo cáo dạng PDF

**Đề cương:** "Xuất báo cáo hiệu quả chatbot và lịch sử đơn hàng phát sinh từ tư vấn AI dạng Excel/PDF."

**Hiện trạng:** Chỉ xuất **CSV** (nút "Xuất Excel") trong `frontend/app/admin/chat/page.tsx`. Chưa có PDF.

**Kế hoạch:**
1. Thêm thư viện client-side `jspdf` + `jspdf-autotable` vào `frontend/package.json`.
2. Viết hàm tiện ích `exportPDF` (tiêu đề, bảng, footer, màu đen-trắng tối giản theo theme hệ thống).
3. Thêm nút "Xuất PDF" cạnh mỗi bảng báo cáo chatbot (user-stats, top-products-asked, top-questions, kb-effectiveness).
4. (Tuỳ chọn mở rộng) Áp dụng cho `admin/reports` khi có nhu cầu.

**File ảnh hưởng:** `frontend/package.json`, `frontend/app/admin/chat/page.tsx`.

---

## G2 — Tự động đồng bộ vector database khi CRUD sản phẩm

**Đề cương:** "thêm/sửa/xóa sản phẩm và **tự động cập nhật vector database trong thời gian thực**."

**Hiện trạng:** Backend Spring Boot quản lý CRUD sản phẩm; AI service có endpoint `ai/admin/sync.py` nhưng việc đồng bộ là **thủ công** (vào màn hình sync bấm).

**Kế hoạch:**
1. Backend: sau khi `AdminProductServiceImpl` tạo/cập nhật/xoá product/variant thành công, gọi HTTP tới AI service:
   - `POST {AI_API}/admin/sync/products` (đồng bộ 1 hoặc toàn bộ).
   - Xoá: `DELETE {AI_API}/admin/products/{id}` + xoá chunk.
2. Dùng `@TransactionalEventListener(AFTER_COMMIT)` để tránh gọi AI trong transaction chưa commit.
3. Cấu hình `AI_API_URL` trong `backend/.env` + `application.yml`.
4. Bật/tắt qua `system_configs` (key `rag.auto_sync`, mặc định ON).

**File ảnh hưởng:** backend `service/impl/AdminProductServiceImpl.java`, `config/`, `application.yml`, frontend (tuỳ chọn hiển thị trạng thái).

---

## G3 — So sánh tỉ lệ chuyển đổi Chatbot vs. Tìm kiếm thông thường

**Đề cương:** "so sánh tỉ lệ chuyển đổi chatbot vs. tìm kiếm thông thường".

**Hiện trạng:** Bảng `chat_conversations` có cột `source` (`CHATBOT | SEARCH`) nhưng **chưa có report** so sánh tỉ lệ chuyển đổi giữa 2 nguồn.

**Kế hoạch:**
1. Backend — thêm DTO `ChatSourceComparisonResponse` + method `getSourceComparison(from, to)`:
   - Với mỗi `source`, đếm: `conversations`, `unique_users`, `add_to_cart`, `orders_placed`, `conversion_rate`, `revenue`.
2. Controller: `GET /admin/chat/analytics/source-comparison`.
3. Frontend: thêm block "So sánh chuyển đổi Chatbot vs. Tìm kiếm" vào tab Analytics + nút xuất CSV/PDF.

**File ảnh hưởng:** `ChatAdminServiceImpl`, `IChatAdminService`, `ChatAdminController`, `ChatSourceComparisonResponse.java`, `services/admin/index.ts`, `frontend/app/admin/chat/page.tsx`.

---

## G4 — Doanh thu phát sinh từ tư vấn chatbot

**Đề cương:** "doanh thu phát sinh từ tư vấn chatbot".

**Hiện trạng:** `chat_conversion_events` có sự kiện `ORDER_PLACED` trỏ tới `order_id`, nhưng **chưa expose** chỉ số doanh thu từ chatbot.

**Kế hoạch:**
1. Backend — trong `getSourceComparison` (G3) và dashboard, tính `revenue` = tổng `orders.total_amount` của các đơn hàng có `ORDER_PLACED` event theo `conversation.source = 'CHATBOT'`.
2. Thêm DTO `ChatRevenueResponse` (theo ngày/tuần/tháng/quý) hoặc gộp vào `source-comparison`.
3. Frontend: hiển thị KPI "Doanh thu từ chatbot" + biểu đồ xu hướng doanh thu chatbot.

**File ảnh hưởng:** như G3 + `ChatDashboardResponse` (thêm field `chatbotRevenue`).

---

## G5 — Cấu hình RAG pipeline đầy đủ

**Đề cương:** "chunking strategy, embedding model, top-k retrieval, ngưỡng similarity và reranking model".

**Hiện trạng:**
- `ai/admin/config_api.py` `GET` trả về `embedding_model`, `reranker_model`, `off_topic_threshold`... nhưng `PUT` chỉ cho sửa `top_k, rerank_top_k, nlu_confidence_threshold, mmr_lambda, off_topic_threshold`.
- `frontend/app/admin/ai-management/config/page.tsx` hiển thị `embedding_model`, `reranker_model` ở chế độ **read-only**; không có "chunking strategy" và "ngưỡng similarity" rõ ràng.

**Kế hoạch:**
1. AI service:
   - Thêm `similarity_threshold` vào `config.py` (ngưỡng vector similarity tối thiểu để chấp nhận chunk).
   - Thêm `chunking_strategy` (semantic-split | paragraph-split | fixed-size) dùng cho `pipelines/`.
   - Cho phép `PUT /admin/config` cập nhật `embedding_model`, `reranker_model`, `chunking_strategy`, `similarity_threshold` (kèm cảnh báo: đổi model phải re-embed → re-sync).
2. Frontend: bỏ read-only các field embedding/reranker, thêm input "Chunking Strategy" & "Similarity Threshold".
3. Đồng bộ màn hình `admin/chat` (KB versions) với `ai-management/config`.

**File ảnh hưởng:** `ai/config.py`, `ai/admin/config_api.py`, `frontend/app/admin/ai-management/config/page.tsx`.

---

## G6 — Quản trị nội dung Knowledge Base (FAQ / bảo hành / khuyến mãi)

**Đề cương:** "Duyệt và cập nhật FAQ, chính sách bảo hành và thông tin khuyến mãi phục vụ knowledge base."

**Hiện trạng:** Có `admin/news`, `admin/promotions`, `admin/warranty` (nghiệp vụ), nhưng **chưa có màn hình riêng** để duyệt/cập nhật nội dung dùng chung cho KB (FAQ, chính sách bảo hành, khuyến mãi) và đồng bộ chunk.

**Kế hoạch:**
1. Bảng `knowledge_documents` (nếu chưa có) hoặc tận dụng `product_chunks` với `chunk_type='faq'|'policy'|'promotion'`.
2. Frontend: màn hình `admin/ai-management/knowledge` cho phép:
   - Xem/danh sách tài liệu KB theo loại (FAQ, bảo hành, khuyến mãi).
   - Thêm/sửa/xoá nội dung, trạng thái "cần duyệt" → "đã duyệt".
   - Nút "Đồng bộ vào vector DB" gọi `ai/admin/sync.py`.
3. AI service: thêm endpoint quản lý tài liệu KB + re-chunk/embed.

**File ảnh hưởng:** migration mới (nếu cần), `ai/admin/`, `frontend/app/admin/ai-management/knowledge/page.tsx`.

---

## G7 — Báo cáo theo ngày/tuần/tháng/quý

**Đề cương:** báo cáo người dùng "theo ngày/tuần/tháng"; hiệu quả RAG "theo quý".

**Hiện trạng:**
- `getUserStats` backend hỗ trợ `groupBy` (`day`|`month`) — **thiếu `week`**.
- Frontend `admin/chat/page.tsx` gọi `adminApi.chat.userStats({ groupBy: "day" })` **cố định** — chưa cho chọn.
- `getKbEffectiveness` không phân theo quý.

**Kế hoạch:**
1. Backend: hỗ trợ thêm `groupBy=week` trong `getUserStats` (dùng `date_trunc('week')`).
2. Frontend: thêm bộ chọn "Ngày / Tuần / Tháng / Quý" cho user-stats.
3. `getKbEffectiveness`: thêm tham số `quarter` (YYYY-Qn) lọc theo `c.started_at`, hiển thị hiệu quả KB theo từng quý.

**File ảnh hưởng:** `ChatAdminServiceImpl`, `frontend/app/admin/chat/page.tsx`.

---

## Seed data (V56)

**Đề cương:** "thêm seed cho hệ thống thể hiện đầy đủ thông tin từ user, đơn hàng, số liệu".
**Lưu ý:** KHÔNG xoá dữ liệu `products` hay thông tin liên quan đến products đã có.

`V56__seed_...sql` bổ sung (idempotent, `ON CONFLICT DO NOTHING`, không `DELETE`):
- Thêm khách hàng & địa chỉ bổ sung.
- Thêm đơn hàng + order items (chỉ trỏ tới **products/variants đã có**, không tạo product mới).
- Thêm `chat_conversations` với `source='SEARCH'` để phục vụ G3 (so sánh chatbot vs tìm kiếm).
- Thêm `chat_conversion_events` (ORDER_PLACED → doanh thu chatbot) để phục vụ G4.
- Thêm đánh giá, thanh toán, usage voucher, warranty, tin tức liên quan.

---

## Thứ tự triển khai khuyến nghị

1. **V56 seed** (dữ liệu để các báo cáo mới có số liệu).
2. **G3 + G4** (backend report + frontend) — phụ thuộc seed.
3. **G1** xuất PDF.
4. **G7** nhóm theo tuần/quý.
5. **G5, G6** cấu hình RAG & quản trị KB content.
6. **G2** auto-sync vector DB.
