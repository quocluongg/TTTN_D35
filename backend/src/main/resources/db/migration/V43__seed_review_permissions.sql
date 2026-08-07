-- V43__seed_review_permissions.sql
-- Permission cho module Product Review. Đăng/sửa/xóa review (khách đã mua) không cần permission
-- riêng (chỉ cần đăng nhập, check ownership ở Service). Chỉ thao tác admin (xem danh sách + duyệt/từ chối)
-- mới cần permission.
insert into permissions (code, description) values
  ('REVIEW_MODERATE', 'Xem và duyệt/từ chối đánh giá sản phẩm')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name in ('ADMIN', 'STAFF')
  and p.code = 'REVIEW_MODERATE'
on conflict do nothing;
