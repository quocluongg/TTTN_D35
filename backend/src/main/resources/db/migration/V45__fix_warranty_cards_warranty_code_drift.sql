-- Bug: DB thật trên Supabase có cột warranty_cards.warranty_code NOT NULL nhưng cột này
-- KHÔNG hề được tạo bởi migration nào (V34__init_warranty.sql không có) và entity WarrantyCard
-- cũng không map field này -> mọi insert từ WarrantyServiceImpl (kể cả auto-generate khi
-- OrderServiceImpl.updateStatus chuyển đơn sang COMPLETED) đều bắn lỗi:
--   ERROR: null value in column "warranty_code" of relation "warranty_cards" violates not-null constraint
-- Đây là dấu hiệu cột đã bị thêm tay ngoài Flyway (Supabase Table Editor) ở một thời điểm nào đó.
-- Xử lý: bỏ ràng buộc NOT NULL, đồng thời set default để các bản ghi cũ/mới không rơi vào lỗi
-- tương tự nếu có nơi khác cũng đang insert thiếu cột này.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'warranty_cards' AND column_name = 'warranty_code'
    ) THEN
        ALTER TABLE warranty_cards ALTER COLUMN warranty_code DROP NOT NULL;
        ALTER TABLE warranty_cards ALTER COLUMN warranty_code SET DEFAULT ('WC-' || upper(substr(gen_random_uuid()::text, 1, 8)));
        UPDATE warranty_cards
        SET warranty_code = 'WC-' || upper(substr(gen_random_uuid()::text, 1, 8))
        WHERE warranty_code IS NULL;
    END IF;
END $$;
