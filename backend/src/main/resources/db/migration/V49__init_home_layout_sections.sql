-- V47__init_home_layout_sections.sql
-- Create home_layout_sections table and seed default layout data

CREATE TABLE IF NOT EXISTS home_layout_sections (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key    VARCHAR(100) NOT NULL UNIQUE,
    title          VARCHAR(255),
    subtitle       VARCHAR(500),
    display_order  INTEGER NOT NULL DEFAULT 0,
    enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    layout_style   VARCHAR(100),
    config_json    TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO home_layout_sections (section_key, title, subtitle, display_order, enabled, layout_style) VALUES
  ('HERO_BANNER', 'Hero Slide Banners', 'Banner quảng cáo slider chính', 1, true, 'FULL_WIDTH'),
  ('MARQUEE_TICKER', 'Dòng thông báo', 'Khuyến mãi & Tin nổi bật', 2, true, 'TICKER'),
  ('FEATURED_PRODUCTS', 'Sản Phẩm Nổi Bật', 'Những sản phẩm công nghệ hot nhất', 3, true, 'GRID'),
  ('BUY_BY_NEED', 'Mua Theo Nhu Cầu', 'Lựa chọn thiết bị phù hợp với bạn', 4, true, 'CARDS'),
  ('FEATURED_CATEGORIES', 'Danh Mục Nổi Bật', 'Các nhóm hàng được ưa chuộng', 5, true, 'GRID'),
  ('NEWS_JOURNAL', 'Tin Tức & Xu Hướng', 'Bài viết đánh giá và tin tức mới nhất', 6, true, 'LIST')
ON CONFLICT (section_key) DO NOTHING;
