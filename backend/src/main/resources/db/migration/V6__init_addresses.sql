create table addresses (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid not null references profiles(id) on delete cascade,
    recipient_name  varchar(150) not null,
    phone           varchar(20) not null,
    province        varchar(100) not null,
    district        varchar(100) not null,
    ward            varchar(100) not null,
    detail_address  varchar(255) not null,
    is_default      boolean not null default false,
    note            varchar(255),
    created_at      timestamp not null default now(),
    updated_at      timestamp
);

create index idx_addresses_profile on addresses(profile_id);
