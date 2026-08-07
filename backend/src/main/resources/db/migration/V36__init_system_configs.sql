DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_configs' AND column_name = 'config_key'
    ) THEN
        ALTER TABLE system_configs RENAME COLUMN config_key TO key;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_configs' AND column_name = 'config_value'
    ) THEN
        ALTER TABLE system_configs RENAME COLUMN config_value TO value;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS system_configs (
    key         VARCHAR(100) PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_public   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS key VARCHAR(100);
ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS value JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Đổi kiểu dữ liệu của cột value sang JSONB nếu nó đang là TEXT/VARCHAR cũ
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_configs' 
          AND column_name = 'value' 
          AND data_type IN ('character varying', 'text')
    ) THEN
        ALTER TABLE system_configs ALTER COLUMN value TYPE JSONB USING value::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'system_configs'::regclass AND contype = 'p'
    ) THEN
        ALTER TABLE system_configs ADD PRIMARY KEY (key);
    END IF;
END $$;

INSERT INTO system_configs (key, value, description, is_public)
SELECT 'shipping_fee', '"30000"'::jsonb, 'Phí ship mặc định (VNĐ)', TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'shipping_fee');

INSERT INTO system_configs (key, value, description, is_public)
SELECT 'free_shipping_threshold', '"1000000"'::jsonb, 'Đơn tối thiểu để freeship (VNĐ)', TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'free_shipping_threshold');

INSERT INTO system_configs (key, value, description, is_public)
SELECT 'chatbot_enabled', 'true'::jsonb, 'Bật/tắt chatbot RAG', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'chatbot_enabled');

INSERT INTO system_configs (key, value, description, is_public)
SELECT 'warranty_reminder_days', '30'::jsonb, 'Số ngày trước expiry để nhắc bảo hành', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'warranty_reminder_days');
