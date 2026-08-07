create table campaigns (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(200) not null,
    description text,
    start_time  timestamp not null,
    end_time    timestamp not null,
    is_active   boolean not null default true,
    created_at  timestamp not null default now(),
    updated_at  timestamp,

    constraint chk_campaigns_time_range check (end_time > start_time)
);

create index idx_campaigns_active_time on campaigns(is_active, start_time, end_time);
