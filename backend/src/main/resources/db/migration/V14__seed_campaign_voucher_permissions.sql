insert into permissions (code, description) values
  ('CAMPAIGN_CREATE', 'Tạo đợt khuyến mãi mới'),
  ('CAMPAIGN_UPDATE', 'Sửa đợt khuyến mãi'),
  ('CAMPAIGN_DELETE', 'Ẩn/khôi phục đợt khuyến mãi'),
  ('VOUCHER_CREATE', 'Tạo mã giảm giá mới'),
  ('VOUCHER_UPDATE', 'Sửa mã giảm giá'),
  ('VOUCHER_DELETE', 'Ẩn/khôi phục mã giảm giá');

-- ADMIN có tất cả permission mới
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'ADMIN'
  and p.code in ('CAMPAIGN_CREATE', 'CAMPAIGN_UPDATE', 'CAMPAIGN_DELETE',
                 'VOUCHER_CREATE', 'VOUCHER_UPDATE', 'VOUCHER_DELETE');

-- STAFF được tạo/sửa, không được ẩn/khôi phục (việc nhạy cảm hơn, ảnh hưởng tài chính, giữ cho ADMIN)
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'STAFF'
  and p.code in ('CAMPAIGN_CREATE', 'CAMPAIGN_UPDATE', 'VOUCHER_CREATE', 'VOUCHER_UPDATE');
