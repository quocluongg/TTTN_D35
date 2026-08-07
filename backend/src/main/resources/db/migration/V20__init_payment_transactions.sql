create table payment_transactions (
    id                        uuid primary key default gen_random_uuid(),
    order_id                  uuid not null references orders(id) on delete cascade,
    provider                  varchar(20) not null,
    provider_transaction_id   varchar(150),
    amount                    numeric(14,2) not null,
    status                    varchar(20) not null default 'PENDING',
    raw_payload               text,
    created_at                timestamp not null default now(),
    paid_at                   timestamp,

    constraint chk_payment_transactions_status check (status in ('PENDING','SUCCESS','FAILED')),
    constraint uq_payment_transactions_provider_txn unique (provider, provider_transaction_id)
);

create index idx_payment_transactions_order on payment_transactions(order_id);
