create table categories (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(150) not null,
    slug        varchar(180) not null unique,
    description text,
    parent_id   uuid references categories(id) on delete restrict,
    is_active   boolean not null default true,
    created_at  timestamp not null default now(),
    updated_at  timestamp
);

create index idx_categories_parent on categories(parent_id);
create index idx_categories_is_active on categories(is_active);
