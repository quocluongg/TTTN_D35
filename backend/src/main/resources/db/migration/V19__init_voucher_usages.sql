create table voucher_usages (
    id                uuid primary key default gen_random_uuid(),
    voucher_id        uuid not null references vouchers(id),
    order_id          uuid not null references orders(id) on delete cascade,
    profile_id        uuid references profiles(id),
    discount_amount   numeric(14,2) not null,
    used_at           timestamp not null default now(),

    constraint uq_voucher_usages_voucher_order unique (voucher_id, order_id)
);

create index idx_voucher_usages_profile on voucher_usages(voucher_id, profile_id);
