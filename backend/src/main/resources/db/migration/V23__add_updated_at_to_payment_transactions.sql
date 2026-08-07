alter table payment_transactions
    add column updated_at timestamp not null default now();
