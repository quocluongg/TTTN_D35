alter table vouchers add column campaign_id uuid references campaigns(id);

create index idx_vouchers_campaign on vouchers(campaign_id);
