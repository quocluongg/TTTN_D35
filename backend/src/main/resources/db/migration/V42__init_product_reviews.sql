-- V42__init_product_reviews.sql
-- Bảng đánh giá sản phẩm. 1 review gắn với 1 order_item_id cụ thể (không phải product_id trực tiếp)
-- - chứng minh "đã mua" và cho phép review lại nếu mua sản phẩm đó ở đơn khác,
-- - unique(order_item_id) chặn review trùng 2 lần cho cùng 1 lần mua.
-- Trạng thái PENDING -> APPROVED/REJECTED. Product.rating_avg/review_count chỉ tính từ review APPROVED,
-- recompute mỗi lần admin đổi trạng thái (xem ProductReviewServiceImpl).

CREATE TABLE IF NOT EXISTS product_reviews (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_item_id uuid NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
    profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating        smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment       text,
    images        jsonb NOT NULL DEFAULT '[]'::jsonb,
    status        varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at    timestamp without time zone NOT NULL DEFAULT now(),
    updated_at    timestamp without time zone
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status ON product_reviews (product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_profile ON product_reviews (profile_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews (status);
