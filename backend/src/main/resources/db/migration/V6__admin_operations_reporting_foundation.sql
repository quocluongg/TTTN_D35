-- Administration and operational foundation.  This migration is additive so it is safe
-- for installations that already contain catalogue data imported outside Flyway.

insert into roles (name, description) values
    ('MANAGER', 'Quản lý vận hành và báo cáo')
on conflict (name) do nothing;

insert into permissions (code, description) values
    ('USER_VIEW', 'Xem tài khoản'), ('USER_CREATE', 'Tạo tài khoản nhân viên'),
    ('USER_UPDATE', 'Cập nhật hoặc khóa tài khoản'), ('ROLE_VIEW', 'Xem vai trò'),
    ('ROLE_UPDATE', 'Cập nhật quyền vai trò'), ('SYSTEM_CONFIG_VIEW', 'Xem cấu hình hệ thống'),
    ('SYSTEM_CONFIG_UPDATE', 'Cập nhật cấu hình hệ thống'), ('AUDIT_LOG_VIEW', 'Xem nhật ký hệ thống'),
    ('INVENTORY_VIEW', 'Xem tồn kho'), ('INVENTORY_UPDATE', 'Điều chỉnh tồn kho'),
    ('PROMOTION_MANAGE', 'Quản lý khuyến mãi'), ('WARRANTY_MANAGE', 'Quản lý bảo hành'),
    ('NEWS_MANAGE', 'Quản lý nội dung'), ('REPORT_VIEW', 'Xem báo cáo'),
    ('ORDER_CREATE', 'Tạo đơn hàng'), ('ORDER_CANCEL', 'Hủy đơn hàng'),
    ('ORDER_REFUND', 'Hoàn tiền đơn hàng')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.name = 'ADMIN'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in
 ('USER_VIEW','ROLE_VIEW','PRODUCT_CREATE','PRODUCT_UPDATE','ORDER_VIEW_ALL','ORDER_UPDATE_STATUS',
  'INVENTORY_VIEW','INVENTORY_UPDATE','PROMOTION_MANAGE','WARRANTY_MANAGE','NEWS_MANAGE','REPORT_VIEW')
where r.name = 'MANAGER'
on conflict do nothing;

-- The original catalogue was imported outside Flyway in early development.  Keep the
-- migration self-contained for a clean production database without changing existing data.
create table if not exists category (
    id bigserial primary key, name varchar(255) not null unique, slug varchar(300), description text,
    parent_id bigint references category(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists product (
    id bigserial primary key, name varchar(500) not null, description text, brand varchar(255), origin varchar(255),
    thumbnail varchar(1000), category_id bigint references category(id) on delete set null, warranty_months integer,
    discount_percent numeric(5,2), slug varchar(550), source_url varchar(2000),
    created_at timestamptz not null default now(), updated_at timestamptz
);
create table if not exists product_variant (
    id bigserial primary key, product_id bigint not null references product(id) on delete cascade, sku varchar(150),
    price numeric(19,2) not null default 0 check (price >= 0), stock integer not null default 0 check (stock >= 0),
    image varchar(1000), discount_percent numeric(5,2), created_at timestamptz not null default now()
);
create unique index if not exists idx_product_variant_sku_unique on product_variant(sku) where sku is not null;
create index if not exists idx_product_category on product(category_id);

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in
 ('PRODUCT_CREATE','PRODUCT_UPDATE','ORDER_VIEW_ALL','ORDER_UPDATE_STATUS','INVENTORY_VIEW','INVENTORY_UPDATE','WARRANTY_MANAGE')
where r.name = 'STAFF'
on conflict do nothing;

alter table profiles add column if not exists phone varchar(30);
alter table profiles add column if not exists locked_reason varchar(500);
create index if not exists idx_profiles_role_active_created on profiles(role_id, is_active, created_at desc);

create table if not exists system_configs (
    config_key varchar(120) primary key,
    config_value text not null,
    value_type varchar(30) not null default 'STRING',
    description text,
    updated_by uuid references profiles(id) on delete set null,
    created_at timestamp not null default now(),
    updated_at timestamp
);

create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references profiles(id) on delete set null,
    action varchar(120) not null,
    entity_type varchar(100) not null,
    entity_id varchar(100),
    summary varchar(1000) not null,
    old_value jsonb,
    new_value jsonb,
    ip_address varchar(64),
    user_agent varchar(500),
    created_at timestamp not null default now()
);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor_created on audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id, created_at desc);

-- Operational entities use immutable price snapshots on order items.  Every FK used by
-- reporting or joins is indexed below to prevent scans as transactional data grows.
create table if not exists customer_orders (
    id uuid primary key default gen_random_uuid(),
    order_code varchar(40) not null unique,
    customer_id uuid not null references profiles(id),
    status varchar(30) not null default 'PENDING',
    payment_status varchar(30) not null default 'UNPAID',
    subtotal numeric(19,2) not null default 0 check (subtotal >= 0),
    discount_amount numeric(19,2) not null default 0 check (discount_amount >= 0),
    shipping_fee numeric(19,2) not null default 0 check (shipping_fee >= 0),
    tax_amount numeric(19,2) not null default 0 check (tax_amount >= 0),
    total_amount numeric(19,2) not null default 0 check (total_amount >= 0),
    promotion_code varchar(80), shipping_address jsonb not null default '{}'::jsonb,
    created_at timestamp not null default now(), updated_at timestamp
);
create index if not exists idx_customer_orders_customer_created on customer_orders(customer_id, created_at desc);
create index if not exists idx_customer_orders_status_created on customer_orders(status, created_at desc);
create index if not exists idx_customer_orders_completed_created on customer_orders(created_at desc) where status = 'DELIVERED';

create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references customer_orders(id) on delete restrict,
    variant_id bigint references product_variant(id) on delete set null,
    product_name varchar(500) not null, sku varchar(150), quantity integer not null check (quantity > 0),
    unit_price numeric(19,2) not null check (unit_price >= 0), discount_amount numeric(19,2) not null default 0,
    line_total numeric(19,2) not null check (line_total >= 0), warranty_months integer,
    created_at timestamp not null default now()
);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_variant on order_items(variant_id);

create table if not exists order_status_history (
    id uuid primary key default gen_random_uuid(), order_id uuid not null references customer_orders(id) on delete cascade,
    from_status varchar(30), to_status varchar(30) not null, note varchar(1000), actor_id uuid references profiles(id) on delete set null,
    created_at timestamp not null default now()
);
create index if not exists idx_order_history_order_created on order_status_history(order_id, created_at desc);

create table if not exists inventory_movements (
    id uuid primary key default gen_random_uuid(), variant_id bigint not null references product_variant(id) on delete restrict,
    movement_type varchar(30) not null, quantity_delta integer not null, quantity_after integer not null check (quantity_after >= 0),
    reason varchar(500) not null, reference_type varchar(50), reference_id varchar(100), actor_id uuid references profiles(id) on delete set null,
    created_at timestamp not null default now()
);
create index if not exists idx_inventory_variant_created on inventory_movements(variant_id, created_at desc);

create table if not exists promotions (
    id uuid primary key default gen_random_uuid(), code varchar(80) not null unique, name varchar(255) not null,
    discount_type varchar(20) not null, discount_value numeric(19,2) not null check (discount_value >= 0),
    max_discount_amount numeric(19,2), minimum_order_amount numeric(19,2) not null default 0,
    usage_limit integer, used_count integer not null default 0, starts_at timestamp not null, ends_at timestamp not null,
    active boolean not null default true, created_by uuid references profiles(id) on delete set null,
    created_at timestamp not null default now(), updated_at timestamp,
    check (ends_at > starts_at)
);
create index if not exists idx_promotions_active_window on promotions(starts_at, ends_at) where active = true;

create table if not exists warranty_cards (
    id uuid primary key default gen_random_uuid(), warranty_code varchar(50) not null unique,
    order_item_id uuid not null unique references order_items(id) on delete restrict, customer_id uuid not null references profiles(id),
    status varchar(30) not null default 'ACTIVE', starts_at timestamp not null, expires_at timestamp not null, serial_number varchar(150),
    created_at timestamp not null default now(), updated_at timestamp, check (expires_at > starts_at)
);
create index if not exists idx_warranty_cards_customer_status on warranty_cards(customer_id, status);

create table if not exists warranty_histories (
    id uuid primary key default gen_random_uuid(), warranty_card_id uuid not null references warranty_cards(id) on delete cascade,
    status varchar(30) not null, description text not null, resolution text, extra_cost numeric(19,2) not null default 0,
    expected_return_at timestamp, actor_id uuid references profiles(id) on delete set null, created_at timestamp not null default now()
);
create index if not exists idx_warranty_history_card_created on warranty_histories(warranty_card_id, created_at desc);

create table if not exists news (
    id uuid primary key default gen_random_uuid(), title varchar(500) not null, slug varchar(550) not null unique,
    excerpt text, content text not null, thumbnail varchar(1000), status varchar(20) not null default 'DRAFT',
    published_at timestamp, seo_title varchar(255), seo_description varchar(500), author_id uuid references profiles(id) on delete set null,
    created_at timestamp not null default now(), updated_at timestamp
);
alter table news add column if not exists thumbnail varchar(1000);
alter table news add column if not exists status varchar(20) not null default 'DRAFT';
alter table news add column if not exists published_at timestamp;
alter table news add column if not exists seo_title varchar(255);
alter table news add column if not exists seo_description varchar(500);

create index if not exists idx_news_published on news(published_at desc) where status = 'PUBLISHED';

insert into system_configs (config_key, config_value, value_type, description) values
 ('store.name', 'ShopWise', 'STRING', 'Tên cửa hàng'),
 ('shipping.free_threshold', '1000000', 'NUMBER', 'Ngưỡng miễn phí vận chuyển VND'),
 ('shipping.default_fee', '30000', 'NUMBER', 'Phí vận chuyển mặc định VND'),
 ('tax.vat_rate', '0.1', 'NUMBER', 'Thuế VAT mặc định'),
 ('warranty.default_months', '12', 'NUMBER', 'Thời hạn bảo hành mặc định'),
 ('report.inactive_customer_days', '90', 'NUMBER', 'Số ngày xác định khách không mua lại')
on conflict (config_key) do nothing;
