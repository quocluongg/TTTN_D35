create extension if not exists "pgcrypto";

create table roles (
    id           uuid primary key default gen_random_uuid(),
    name         varchar(50) not null unique,
    description  text,
    created_at   timestamp not null default now(),
    updated_at   timestamp
);

create table permissions (
    id           uuid primary key default gen_random_uuid(),
    code         varchar(100) not null unique,
    description  text,
    created_at   timestamp not null default now(),
    updated_at   timestamp
);

create table role_permissions (
    role_id        uuid not null references roles(id) on delete cascade,
    permission_id  uuid not null references permissions(id) on delete cascade,
    primary key (role_id, permission_id)
);
