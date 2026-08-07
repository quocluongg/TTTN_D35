create table orders (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid references profiles(id),
    address_id        uuid references addresses(id),
    voucher_id        uuid references vouchers(id),
    discount_amount   numeric(14,2) not null default 0,
    customer_name     varchar(150) not null,
    customer_email    varchar(150),
    customer_phone    varchar(20) not null,
    shipping_address  varchar(500) not null,
    total_amount      numeric(14,2) not null,
    status            varchar(20) not null default 'PENDING',
    payment_method    varchar(20) not null,
    payment_status    varchar(20) not null default 'PENDING',
    tracking_number   varchar(100),
    created_at        timestamp not null default now(),
    updated_at        timestamp,

    constraint chk_orders_status check (status in ('PENDING','PROCESSING','SHIPPED','COMPLETED','CANCELLED','RETURNED')),
    constraint chk_orders_payment_method check (payment_method in ('COD','STRIPE','VNPAY')),
    constraint chk_orders_payment_status check (payment_status in ('PENDING','PAID','FAILED','REFUNDED')),
    constraint chk_orders_total_amount check (total_amount >= 0),
    constraint chk_orders_discount_amount check (discount_amount >= 0)
);

create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_timeout_scan on orders(payment_method, payment_status, status, created_at);
