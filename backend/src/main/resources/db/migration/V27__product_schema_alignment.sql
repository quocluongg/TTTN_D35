-- V27__product_schema_alignment.sql
-- Align actual database schema with DB_Design.md specification.
-- Fixes: missing tables, missing columns, inconsistent timestamp types.

------------------------------------------------------------
-- 1. product_images  (gallery ảnh sản phẩm)
------------------------------------------------------------
create table if not exists product_images (
    id         uuid         primary key default gen_random_uuid(),
    product_id uuid         references products(id) on delete cascade,
    url        varchar(1000) not null,
    sort_order integer      not null default 0,
    created_at timestamptz  not null default now()
);
create index if not exists idx_product_images_product on product_images(product_id, sort_order);

------------------------------------------------------------
-- 2. product_specifications  (thông số kỹ thuật key-value)
------------------------------------------------------------
create table if not exists product_specifications (
    id         bigserial    primary key,
    product_id uuid         references products(id) on delete cascade,
    spec_group varchar(150),
    spec_key   varchar(150) not null,
    spec_value varchar(500) not null,
    spec_unit  varchar(50),
    created_at timestamptz  not null default now()
);
create index if not exists idx_product_specs_product on product_specifications(product_id);
create index if not exists idx_product_specs_key on product_specifications(spec_key);

------------------------------------------------------------
-- 3. product_category_mapping  (quan hệ n-n Product ↔ Category)
------------------------------------------------------------
create table if not exists product_category_mapping (
    product_id  uuid not null references products(id)   on delete cascade,
    category_id uuid not null references categories(id) on delete cascade,
    primary key (product_id, category_id)
);

------------------------------------------------------------
-- 4. product_chunks  (RAG embedding chunks)
------------------------------------------------------------
create table if not exists product_chunks (
    id          varchar(200) primary key,
    product_id  uuid         references products(id) on delete cascade,
    content     text         not null,
    chunk_type  varchar(50)  not null default 'text',
    created_at  timestamptz  not null default now()
);
create index if not exists idx_product_chunks_product on product_chunks(product_id);

------------------------------------------------------------
-- 5. ALTER product_variants — thêm attributes, vat_percent
------------------------------------------------------------
alter table product_variants add column if not exists attributes  jsonb;
alter table product_variants add column if not exists vat_percent numeric(5,2);

------------------------------------------------------------
-- 6. ALTER products — thêm custom_tabs
------------------------------------------------------------
alter table products add column if not exists custom_tabs jsonb;

------------------------------------------------------------
-- 7. Đồng nhất timestamp type → timestamptz
------------------------------------------------------------

-- profiles
alter table profiles        alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table profiles        alter column updated_at type timestamptz using updated_at at time zone 'UTC';

-- refresh_tokens
alter table refresh_tokens  alter column expires_at type timestamptz using expires_at at time zone 'UTC';
alter table refresh_tokens  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table refresh_tokens  alter column updated_at type timestamptz using updated_at at time zone 'UTC';

-- otp_verifications
alter table otp_verifications alter column expires_at  type timestamptz using expires_at  at time zone 'UTC';
alter table otp_verifications alter column created_at  type timestamptz using created_at  at time zone 'UTC';

-- system_configs
alter table system_configs  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table system_configs  alter column updated_at type timestamptz using updated_at at time zone 'UTC';

-- audit_logs
alter table audit_logs      alter column created_at type timestamptz using created_at at time zone 'UTC';

-- news
alter table news            alter column published_at type timestamptz using published_at at time zone 'UTC';
alter table news            alter column created_at   type timestamptz using created_at   at time zone 'UTC';
alter table news            alter column updated_at   type timestamptz using updated_at   at time zone 'UTC';
