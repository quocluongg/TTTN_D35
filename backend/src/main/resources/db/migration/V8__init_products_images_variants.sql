create table products (
    id              uuid primary key default gen_random_uuid(),
    name            varchar(255) not null,
    slug            varchar(280) not null unique,
    description     text,
    brand           varchar(100),
    origin          varchar(100),
    thumbnail       text,
    category_id     uuid not null references categories(id) on delete restrict,
    warranty_months integer,
    custom_tabs     jsonb not null default '[]'::jsonb,
    rating_avg      numeric(2,1) not null default 0,
    review_count    integer not null default 0,
    is_active       boolean not null default true,
    created_at      timestamp not null default now(),
    updated_at      timestamp
);

create index idx_products_category on products(category_id);
create index idx_products_brand on products(brand);
create index idx_products_is_active on products(is_active);

create table product_images (
    id          uuid primary key default gen_random_uuid(),
    product_id  uuid not null references products(id) on delete cascade,
    url         text not null,
    sort_order  integer not null default 0,
    created_at  timestamp not null default now(),
    updated_at  timestamp
);

create index idx_product_images_product on product_images(product_id);

create table product_variants (
    id           uuid primary key default gen_random_uuid(),
    product_id   uuid not null references products(id) on delete cascade,
    sku          varchar(30) not null unique,
    variant_name varchar(255),
    price        numeric(12,2) not null,
    stock        integer not null default 0,
    attributes   jsonb not null default '{}'::jsonb,
    vat_percent  numeric(5,2) not null default 0,
    image        text,
    created_at   timestamp not null default now(),
    updated_at   timestamp
);

create index idx_product_variants_product on product_variants(product_id);

-- Dùng cho sinh SKU tuần tự toàn hệ thống (xem ProductServiceImpl#generateSku),
-- tránh race condition khi 2 admin cùng tạo variant một lúc (khác COUNT(*) không an toàn).
create sequence product_variant_sku_seq start with 1 increment by 1;
