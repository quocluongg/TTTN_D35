-- V46__seed_homepage_cms_permission.sql
-- Permission cho module Homepage CMS (Banner, Brand, Layout, Featured Categories)
insert into permissions (code, description) values
  ('HOMEPAGE_CMS_MANAGE', 'Quản lý giao diện và layout trang chủ')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name in ('ADMIN', 'MANAGER')
  and p.code = 'HOMEPAGE_CMS_MANAGE'
on conflict do nothing;


