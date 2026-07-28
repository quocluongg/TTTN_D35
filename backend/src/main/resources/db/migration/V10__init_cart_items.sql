create table cart_items (
    id          uuid primary key default gen_random_uuid(),
    profile_id  uuid not null references profiles(id) on delete cascade,
    variant_id  uuid not null references product_variants(id) on delete cascade,
    quantity    integer not null,
    created_at  timestamp not null default now(),
    updated_at  timestamp,

    constraint chk_cart_items_quantity check (quantity > 0),
    constraint uq_cart_items_profile_variant unique (profile_id, variant_id)
);

create index idx_cart_items_profile on cart_items(profile_id);
