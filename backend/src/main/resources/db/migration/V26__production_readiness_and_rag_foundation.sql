-- V7__production_readiness_and_rag_foundation.sql
-- Expand granular permissions and initialize RAG provider tables

insert into permissions (code, description) values
    ('USER_LOCK', 'Khóa và mở khóa tài khoản'),
    ('PRODUCT_VIEW', 'Xem danh sách và chi tiết sản phẩm'),
    ('PRODUCT_DELETE', 'Soft delete hoặc ẩn sản phẩm'),
    ('CATEGORY_MANAGE', 'Quản lý danh mục sản phẩm'),
    ('ORDER_VIEW', 'Xem danh sách đơn hàng'),
    ('ORDER_UPDATE', 'Cập nhật trạng thái đơn hàng'),
    ('RAG_VIEW', 'Xem lịch sử hội thoại RAG Chatbot'),
    ('RAG_MANAGE', 'Quản lý kiến thức và cấu hình RAG Chatbot'),
    ('RAG_FEEDBACK_REVIEW', 'Xem và duyệt phản hồi người dùng về RAG Chatbot')
on conflict (code) do nothing;

-- Ensure ADMIN role has all permissions
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.name = 'ADMIN'
on conflict do nothing;

-- Assign managerial permissions to MANAGER
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in
 ('USER_LOCK','PRODUCT_VIEW','PRODUCT_DELETE','CATEGORY_MANAGE','ORDER_VIEW','ORDER_UPDATE',
  'RAG_VIEW','RAG_MANAGE','RAG_FEEDBACK_REVIEW')
where r.name = 'MANAGER'
on conflict do nothing;

-- Assign staff permissions to STAFF
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in
 ('PRODUCT_VIEW','ORDER_VIEW','ORDER_UPDATE','RAG_VIEW')
where r.name = 'STAFF'
on conflict do nothing;

-- RAG Assistant Infrastructure Tables
create table if not exists rag_conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    status varchar(20) not null default 'ACTIVE',
    started_at timestamp not null default now(),
    ended_at timestamp,
    metadata jsonb default '{}'::jsonb
);
create index if not exists idx_rag_conversations_user on rag_conversations(user_id, started_at desc);

create table if not exists rag_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references rag_conversations(id) on delete cascade,
    role varchar(20) not null,
    content text not null,
    confidence numeric(5,4),
    sources jsonb default '[]'::jsonb,
    suggested_products jsonb default '[]'::jsonb,
    provider varchar(50) not null default 'mock',
    created_at timestamp not null default now()
);
create index if not exists idx_rag_messages_conv on rag_messages(conversation_id, created_at asc);

create table if not exists rag_feedbacks (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references rag_messages(id) on delete cascade,
    rating integer not null check (rating in (1, -1)),
    note text,
    created_by uuid references profiles(id) on delete set null,
    created_at timestamp not null default now()
);
create index if not exists idx_rag_feedbacks_msg on rag_feedbacks(message_id);

create table if not exists rag_unanswered_questions (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid references rag_conversations(id) on delete set null,
    question text not null,
    confidence numeric(5,4),
    category varchar(100),
    created_at timestamp not null default now()
);
create index if not exists idx_rag_unanswered_created on rag_unanswered_questions(created_at desc);
