insert into permissions (code, description) values
  ('CATEGORY_CREATE', 'Tạo danh mục sản phẩm mới'),
  ('CATEGORY_UPDATE', 'Sửa thông tin danh mục sản phẩm'),
  ('CATEGORY_DELETE', 'Ẩn/khôi phục danh mục sản phẩm');

-- ADMIN có tất cả permission mới
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'ADMIN'
  and p.code in ('CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE');

-- STAFF được tạo/sửa danh mục, không được ẩn/khôi phục (việc nhạy cảm hơn, giữ cho ADMIN)
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'STAFF'
  and p.code in ('CATEGORY_CREATE', 'CATEGORY_UPDATE');

-- PRODUCT_DELETE (đã seed ở V4) giờ dùng chung cho việc ẩn/khôi phục sản phẩm (soft-delete only,
-- không có hard-delete) - không cần permission mới, chỉ đổi ý nghĩa sử dụng.
