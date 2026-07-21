create table otp_verifications (
    id            uuid primary key default gen_random_uuid(),
    profile_id    uuid not null references profiles(id) on delete cascade,
    otp_hash      varchar(255) not null,
    purpose       varchar(30) not null
                  check (purpose in ('REGISTER', 'RESET_PASSWORD')),
    expires_at    timestamp not null,
    verified      boolean not null default false,
    attempt_count int not null default 0,
    created_at    timestamp not null default now()
);

create index idx_otp_profile_purpose on otp_verifications(profile_id, purpose);
