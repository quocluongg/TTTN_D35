-- null = không giới hạn số suất sale riêng (chỉ bị chặn bởi tồn kho variant chung).
alter table campaign_items add column stock_quantity integer;

alter table campaign_items add constraint chk_campaign_items_stock_quantity
    check (stock_quantity is null or stock_quantity >= 0);
