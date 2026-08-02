-- V28__fix_and_complete_product_schema.sql
-- Add missing product operational fields (rating_avg, review_count, sold_quantity, is_active, use_case, discount_percent, source_url)
-- Align product_category_mapping types to UUID.

------------------------------------------------------------
-- 1. ALTER products — add missing columns
------------------------------------------------------------
alter table products add column if not exists rating_avg numeric(3,2) not null default 5.00 check (rating_avg >= 0.00 and rating_avg <= 5.00);
alter table products add column if not exists review_count integer not null default 0 check (review_count >= 0);
alter table products add column if not exists sold_quantity integer not null default 0 check (sold_quantity >= 0);
alter table products add column if not exists is_active boolean not null default true;
alter table products add column if not exists use_case varchar(100);
alter table products add column if not exists discount_percent numeric(5,2);
alter table products add column if not exists source_url varchar(2000);

------------------------------------------------------------
-- 2. ALTER product_variants — add missing columns
------------------------------------------------------------
alter table product_variants add column if not exists is_active boolean not null default true;
alter table product_variants add column if not exists discount_percent numeric(5,2);

------------------------------------------------------------
-- 3. Fix product_category_mapping table to use UUIDs
------------------------------------------------------------
drop table if exists product_category_mapping cascade;
create table product_category_mapping (
    product_id  uuid not null references products(id)   on delete cascade,
    category_id uuid not null references categories(id) on delete cascade,
    primary key (product_id, category_id)
);

------------------------------------------------------------
-- 4. Indexes for query optimization
------------------------------------------------------------
create index if not exists idx_products_is_active on products(is_active);
create index if not exists idx_products_sold_quantity on products(sold_quantity desc);
create index if not exists idx_products_rating_avg on products(rating_avg desc);
create index if not exists idx_products_use_case on products(use_case);
create index if not exists idx_product_variants_is_active on product_variants(is_active);
