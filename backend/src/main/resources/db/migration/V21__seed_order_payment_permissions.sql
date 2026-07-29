insert into permissions (code, description) values
  ('ORDER_VIEW_ALL', 'Xem tất cả đơn hàng'),
  ('ORDER_UPDATE_STATUS', 'Cập nhật trạng thái đơn hàng'),
  ('ORDER_CANCEL', 'Huỷ đơn hàng');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'ADMIN'
  and p.code in ('ORDER_VIEW_ALL', 'ORDER_UPDATE_STATUS', 'ORDER_CANCEL');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'STAFF'
  and p.code in ('ORDER_VIEW_ALL', 'ORDER_UPDATE_STATUS');
