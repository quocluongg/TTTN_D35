-- 3 role mặc định
insert into roles (name, description) values
  ('ADMIN', 'Quản trị viên toàn quyền'),
  ('STAFF', 'Nhân viên vận hành'),
  ('CUSTOMER', 'Khách hàng');

-- Permission cơ bản, sẽ bổ sung thêm khi làm tới module tương ứng
insert into permissions (code, description) values
  ('PRODUCT_CREATE', 'Tạo sản phẩm mới'),
  ('PRODUCT_UPDATE', 'Sửa thông tin sản phẩm'),
  ('PRODUCT_DELETE', 'Xóa sản phẩm'),
  ('ORDER_VIEW_ALL', 'Xem toàn bộ đơn hàng'),
  ('ORDER_UPDATE_STATUS', 'Cập nhật trạng thái đơn hàng'),
  ('USER_MANAGE', 'Quản lý tài khoản người dùng');

-- ADMIN có tất cả
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'ADMIN';

-- STAFF có quyền vận hành, không có USER_MANAGE
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'STAFF'
  and p.code in ('PRODUCT_CREATE', 'PRODUCT_UPDATE', 'ORDER_VIEW_ALL', 'ORDER_UPDATE_STATUS');

-- CUSTOMER không có quyền nào