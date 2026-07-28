create table vouchers (
    id                   uuid primary key default gen_random_uuid(),
    code                 varchar(50) not null unique,
    description          text,
    discount_type        varchar(20) not null,
    discount_value       numeric(12,2) not null,
    max_discount_amount  numeric(12,2),
    min_order_value      numeric(14,2) not null default 0,
    max_usage            integer,
    max_usage_per_user   integer not null default 1,
    used_count           integer not null default 0,
    start_time           timestamp not null,
    end_time             timestamp not null,
    is_active            boolean not null default true,
    created_at           timestamp not null default now(),
    updated_at           timestamp,

    constraint chk_vouchers_time_range check (end_time > start_time),
    constraint chk_vouchers_discount_value check (discount_value >= 0),
    constraint chk_vouchers_percent_range check (discount_type <> 'PERCENT' or discount_value <= 100),
    constraint chk_vouchers_min_order_value check (min_order_value >= 0),
    constraint chk_vouchers_max_usage check (max_usage is null or max_usage > 0),
    constraint chk_vouchers_max_usage_per_user check (max_usage_per_user > 0),
    constraint chk_vouchers_used_count check (used_count >= 0)
);

create index idx_vouchers_active_time on vouchers(is_active, start_time, end_time);
