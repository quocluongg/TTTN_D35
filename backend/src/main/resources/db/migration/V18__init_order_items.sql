create table order_items (
    id                    uuid primary key default gen_random_uuid(),
    order_id              uuid not null references orders(id) on delete cascade,
    product_id            uuid not null references products(id),
    variant_id            uuid not null references product_variants(id),
    quantity              integer not null,
    price_at_purchase     numeric(12,2) not null,
    attributes_snapshot   jsonb,
    created_at            timestamp not null default now(),
    updated_at            timestamp,

    constraint chk_order_items_quantity check (quantity > 0),
    constraint chk_order_items_price check (price_at_purchase >= 0)
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);
