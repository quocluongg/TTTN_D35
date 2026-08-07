-- Migration đối soát (reconciliation), KHÔNG phải tạo permission mới.
--
-- Bối cảnh: bạn làm RAG bên Python service đã tự thêm một số permission thẳng
-- vào bảng `permissions` trên Supabase (RAG_VIEW, RAG_MANAGE, RAG_FEEDBACK_REVIEW,
-- USER_*, ROLE_*, SYSTEM_CONFIG_*, INVENTORY_*, ORDER_CREATE/VIEW/REFUND/UPDATE,
-- AUDIT_LOG_VIEW, NEWS_MANAGE, PROMOTION_MANAGE, WARRANTY_MANAGE, REPORT_VIEW,
-- PRODUCT_VIEW...) mà không đi qua Flyway migration của Java. Việc đó không sai —
-- Python service không dùng Flyway — nhưng khiến Flyway (bên Java) không biết các
-- permission này tồn tại, gây trùng key khi có migration khác lỡ insert lại.
--
-- File này ghi nhận lại (snapshot) toàn bộ permission đang có thật trên Supabase
-- tại thời điểm 2026-07-29, dùng `on conflict (code) do nothing` nên:
--   - Chạy trên DB hiện tại (đã có sẵn các dòng này): không làm gì cả, an toàn.
--   - Chạy trên 1 Supabase project mới tinh (ví dụ máy đồng đội khác, môi trường
--     test/CI): tự tạo lại đầy đủ y hệt, đảm bảo mọi môi trường đồng bộ.
--
-- Từ nay: mọi permission mới (dù bên Java hay bên Python cần) đều nên đi qua
-- 1 file Flyway migration như thế này, để tránh lệch pha giữa các service.
insert into permissions (code, description) values
  ('AUDIT_LOG_VIEW', 'Xem nhật ký hệ thống'),
  ('CATEGORY_CREATE', 'Tạo danh mục sản phẩm mới'),
  ('CATEGORY_DELETE', 'Ẩn/khôi phục danh mục sản phẩm'),
  ('CATEGORY_MANAGE', 'Quản lý danh mục sản phẩm'),
  ('CATEGORY_UPDATE', 'Sửa thông tin danh mục sản phẩm'),
  ('INVENTORY_UPDATE', 'Điều chỉnh tồn kho'),
  ('INVENTORY_VIEW', 'Xem tồn kho'),
  ('NEWS_MANAGE', 'Quản lý nội dung'),
  ('ORDER_CANCEL', 'Hủy đơn hàng'),
  ('ORDER_CREATE', 'Tạo đơn hàng'),
  ('ORDER_REFUND', 'Hoàn tiền đơn hàng'),
  ('ORDER_UPDATE', 'Cập nhật trạng thái đơn hàng'),
  ('ORDER_VIEW', 'Xem danh sách đơn hàng'),
  ('PRODUCT_VIEW', 'Xem danh sách và chi tiết sản phẩm'),
  ('PROMOTION_MANAGE', 'Quản lý khuyến mãi'),
  ('RAG_FEEDBACK_REVIEW', 'Xem và duyệt phản hồi người dùng về RAG Chatbot'),
  ('RAG_MANAGE', 'Quản lý kiến thức và cấu hình RAG Chatbot'),
  ('RAG_VIEW', 'Xem lịch sử hội thoại RAG Chatbot'),
  ('REPORT_VIEW', 'Xem báo cáo'),
  ('ROLE_UPDATE', 'Cập nhật quyền vai trò'),
  ('ROLE_VIEW', 'Xem vai trò'),
  ('SYSTEM_CONFIG_UPDATE', 'Cập nhật cấu hình hệ thống'),
  ('SYSTEM_CONFIG_VIEW', 'Xem cấu hình hệ thống'),
  ('USER_CREATE', 'Tạo tài khoản nhân viên'),
  ('USER_LOCK', 'Khóa và mở khóa tài khoản'),
  ('USER_UPDATE', 'Cập nhật hoặc khóa tài khoản'),
  ('USER_VIEW', 'Xem tài khoản'),
  ('VOUCHER_CREATE', 'Tạo mã giảm giá mới'),
  ('VOUCHER_DELETE', 'Ẩn/khôi phục mã giảm giá'),
  ('VOUCHER_UPDATE', 'Sửa mã giảm giá'),
  ('WARRANTY_MANAGE', 'Quản lý bảo hành'),
  ('CAMPAIGN_CREATE', 'Tạo đợt khuyến mãi mới'),
  ('CAMPAIGN_UPDATE', 'Sửa đợt khuyến mãi'),
  ('CAMPAIGN_DELETE', 'Ẩn/khôi phục đợt khuyến mãi')
on conflict (code) do nothing;

-- Chưa gán role_permissions cho lô này ở đây, vì việc "role nào được quyền gì"
-- (đặc biệt là nhóm RAG_*, SYSTEM_CONFIG_*, USER_*, ROLE_*) là quyết định nghiệp vụ
-- cần chốt riêng (thường ADMIN full, còn STAFF/RAG-operator thì tuỳ) — nên để module
-- tương ứng (Auth/RBAC nâng cấp hoặc module RAG) tự thêm migration gán quyền khi
-- code tới phần đó, tránh gán bừa rồi phải sửa lại.
