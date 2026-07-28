create table campaign_items (
    id             uuid primary key default gen_random_uuid(),
    campaign_id    uuid not null references campaigns(id) on delete cascade,
    variant_id     uuid not null references product_variants(id) on delete cascade,
    discount_type  varchar(20) not null,
    discount_value numeric(12,2) not null,
    created_at     timestamp not null default now(),
    updated_at     timestamp,

    constraint chk_campaign_items_discount_type check (discount_type in ('PERCENT', 'FIXED_AMOUNT')),
    constraint chk_campaign_items_discount_value check (discount_value >= 0),
    constraint chk_campaign_items_percent_range check (discount_type <> 'PERCENT' or discount_value <= 100),
    constraint uq_campaign_items_campaign_variant unique (campaign_id, variant_id)
);

create index idx_campaign_items_variant on campaign_items(variant_id);
