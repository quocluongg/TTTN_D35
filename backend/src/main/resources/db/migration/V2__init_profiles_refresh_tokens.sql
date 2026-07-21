create table profiles (
    id                uuid primary key default gen_random_uuid(),
    email             varchar(255) not null unique,
    password_hash     varchar(255),
    auth_provider     varchar(20) not null default 'LOCAL'
                      check (auth_provider in ('LOCAL', 'GOOGLE', 'FACEBOOK')),
    provider_user_id  varchar(255),
    role_id           uuid not null references roles(id),
    full_name         varchar(150),
    email_notif       boolean not null default true,
    push_notif        boolean not null default true,
    system_notif      boolean not null default true,
    is_active         boolean not null default true,
    created_at        timestamp not null default now(),
    updated_at        timestamp
);

create table refresh_tokens (
    id           uuid primary key default gen_random_uuid(),
    profile_id   uuid not null references profiles(id) on delete cascade,
    token_hash   varchar(255) not null unique,
    device_info  varchar(255),
    ip_address   varchar(64),
    expires_at   timestamp not null,
    revoked      boolean not null default false,
    created_at   timestamp not null default now(),
    updated_at   timestamp
);

create index idx_refresh_tokens_profile on refresh_tokens(profile_id);
