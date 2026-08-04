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

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_configs' 
          AND column_name = 'value' 
          AND data_type IN ('character varying', 'text')
    ) THEN
        ALTER TABLE system_configs ALTER COLUMN value TYPE JSONB USING to_jsonb(value);
    END IF;
END $$;
