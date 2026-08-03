-- V31__rename_product_specifications_to_product_attribute_values.sql
-- Đổi tên bảng product_specifications → product_attribute_values
-- cho nhất quán với cặp product_attribute_keys ↔ product_attribute_values.

ALTER TABLE product_specifications
    RENAME TO product_attribute_values;

-- Đổi tên constraint FK cho khớp tên bảng mới
ALTER TABLE product_attribute_values
    RENAME CONSTRAINT product_specifications_attribute_key_id_fkey
    TO product_attribute_values_attribute_key_id_fkey;

-- Đổi tên index cho khớp tên bảng mới
ALTER INDEX IF EXISTS idx_product_specs_attr_key
    RENAME TO idx_product_attr_values_key;
