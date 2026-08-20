-- Theo dõi nguồn "thêm vào giỏ hàng": CHATBOT (từ gợi ý bot) vs BROWSE (duyệt web).
-- Dùng bảng event log riêng vì cart_items chỉ là snapshot giỏ hiện tại, không lưu lịch sử.

create table add_to_cart_events (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid not null references profiles(id) on delete cascade,
    product_id      uuid not null references products(id),
    variant_id      uuid not null references product_variants(id),
    source          varchar(20) not null,
    conversation_id uuid references chat_conversations(id) on delete set null,
    created_at      timestamp not null default now(),
    updated_at      timestamp
);

create index idx_add_to_cart_events_profile on add_to_cart_events(profile_id);
create index idx_add_to_cart_events_source on add_to_cart_events(source);
create index idx_add_to_cart_events_created on add_to_cart_events(created_at);

-- Gắn nguồn cho từng dòng giỏ hàng hiện tại (mặc định BROWSE cho dữ liệu cũ).
alter table cart_items add column source varchar(20) not null default 'BROWSE';

-- Gắn nguồn cho từng dòng đơn hàng (NULL = đơn trước khi có tracking).
alter table order_items add column source varchar(20);
create index idx_order_items_source on order_items(source);
