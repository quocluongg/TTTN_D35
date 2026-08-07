alter table voucher_usages
    add column created_at timestamp not null default now(),
    add column updated_at timestamp not null default now();
