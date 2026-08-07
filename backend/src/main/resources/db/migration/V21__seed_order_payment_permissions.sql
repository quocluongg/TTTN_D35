-- QUAN TRỌNG: bảng permissions thật trên Supabase hiện đang có một lô ~24
-- permission (ORDER_CREATE, ORDER_CANCEL, ORDER_VIEW, ORDER_REFUND, ORDER_UPDATE,
-- RAG_*, USER_*, ROLE_*, SYSTEM_CONFIG_*, INVENTORY_*, AUDIT_LOG_VIEW, NEWS_MANAGE,
-- PROMOTION_MANAGE, WARRANTY_MANAGE, REPORT_VIEW...) được insert thẳng vào Supabase
-- (không qua migration file nào), lúc 2026-07-25. Flyway hoàn toàn không biết các
-- permission này tồn tại. ORDER_CANCEL nằm trong lô đó nên KHÔNG insert lại ở đây,
-- chỉ còn cần đảm bảo role_permissions được gán đủ cho ADMIN/STAFF.
--
-- LƯU Ý CHO CẢ NHÓM: từ giờ mọi permission mới muốn thêm PHẢI đi qua Flyway migration
-- (không chạy tay trên Supabase SQL editor nữa), và luôn dùng `on conflict do nothing`
-- khi insert vào permissions/role_permissions để migration idempotent, tránh lặp lại lỗi này.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'ADMIN'
  and p.code = 'ORDER_CANCEL'
    on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'STAFF'
  and p.code = 'ORDER_CANCEL'
    on conflict do nothing;