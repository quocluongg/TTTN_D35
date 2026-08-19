-- V54: RAG Chat Management & Chatbot Analytics
-- ---------------------------------------------------------------------------
-- Bổ sung hạ tầng cho quản trị chatbot (mục 3 & 4 của đề cương):
--   * chat_conversations    : hội thoại chatbot (kể cả khi được nhân viên tiếp quản)
--   * chat_messages         : từng lượt tin nhắn (user/assistant/staff), intent, confidence,
--                             sources, product_ids, trạng thái gắn cờ chất lượng
--   * sensitive_questions   : danh sách câu hỏi nhạy cảm cần chuyển nhân viên
--   * knowledge_base_version: phiên bản knowledge base để đánh giá hiệu quả RAG theo version/quý
--   * chat_conversion_events: sự kiện chuyển đổi từ tư vấn chatbot -> giỏ hàng/đơn hàng
--
-- Chatbot (Python service) GHÉP hội thoại vào DB này; Backend đọc/quản trị qua Admin API.
-- ---------------------------------------------------------------------------

-- 1. knowledge_base_version (được tham chiếu bởi chat_conversations, nên tạo trước)
CREATE TABLE IF NOT EXISTS knowledge_base_version (
    id                UUID PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    chunking_strategy VARCHAR(100),
    embedding_model   VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. chat_conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id                UUID PRIMARY KEY,
    session_id        VARCHAR(128) NOT NULL,
    user_id           UUID REFERENCES profiles (id) ON DELETE SET NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | HANDOFF | CLOSED
    handoff_staff_id  UUID REFERENCES profiles (id) ON DELETE SET NULL,
    source            VARCHAR(20)  NOT NULL DEFAULT 'CHATBOT',  -- CHATBOT | SEARCH
    kb_version_id     UUID REFERENCES knowledge_base_version (id) ON DELETE SET NULL,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id                UUID PRIMARY KEY,
    conversation_id   UUID NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
    role              VARCHAR(20) NOT NULL,                       -- USER | ASSISTANT | STAFF
    content           TEXT NOT NULL,
    intent            VARCHAR(40),
    confidence        DOUBLE PRECISION,
    latency_ms        INTEGER,
    sources           JSONB,
    product_ids       UUID[],
    flag_status       VARCHAR(20) NOT NULL DEFAULT 'NONE',        -- NONE | NEEDS_REVIEW | APPROVED | REJECTED
    flag_note         TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. sensitive_questions
CREATE TABLE IF NOT EXISTS sensitive_questions (
    id          UUID PRIMARY KEY,
    pattern     VARCHAR(255) NOT NULL,
    category    VARCHAR(40),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. chat_conversion_events
CREATE TABLE IF NOT EXISTS chat_conversion_events (
    id                UUID PRIMARY KEY,
    conversation_id   UUID REFERENCES chat_conversations (id) ON DELETE SET NULL,
    user_id           UUID REFERENCES profiles (id) ON DELETE SET NULL,
    product_id        UUID REFERENCES products (id) ON DELETE SET NULL,
    variant_id        UUID REFERENCES product_variants (id) ON DELETE SET NULL,
    order_id          UUID REFERENCES orders (id) ON DELETE SET NULL,
    event_type        VARCHAR(20) NOT NULL,                       -- RECOMMENDED | ADD_TO_CART | ORDER_PLACED
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user        ON chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status      ON chat_conversations (status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_started_at  ON chat_conversations (started_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation     ON chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_flag_status      ON chat_messages (flag_status);
CREATE INDEX IF NOT EXISTS idx_chat_conv_event_type           ON chat_conversion_events (event_type);
CREATE INDEX IF NOT EXISTS idx_chat_conv_event_created_at     ON chat_conversion_events (created_at);
CREATE INDEX IF NOT EXISTS idx_kb_version_active              ON knowledge_base_version (is_active);

-- 7. Seed sensitive questions mẫu (idempotent)
INSERT INTO sensitive_questions (id, pattern, category, is_active) VALUES
    (gen_random_uuid(), 'mật khẩu',           'ACCOUNT', TRUE),
    (gen_random_uuid(), 'đăng nhập',          'ACCOUNT', TRUE),
    (gen_random_uuid(), 'thông tin tài khoản', 'ACCOUNT', TRUE),
    (gen_random_uuid(), 'số thẻ tín dụng',     'PAYMENT', TRUE),
    (gen_random_uuid(), 'thanh toán thất bại', 'PAYMENT', TRUE),
    (gen_random_uuid(), 'hoàn tiền',           'PAYMENT', TRUE),
    (gen_random_uuid(), 'khiếu nại',           'COMPLAINT', TRUE),
    (gen_random_uuid(), 'chính sách bảo mật',  'PRIVACY', TRUE)
ON CONFLICT DO NOTHING;

-- 8. Seed knowledge base version đầu tiên (idempotent)
INSERT INTO knowledge_base_version (id, name, description, chunking_strategy, embedding_model, is_active) VALUES
    (gen_random_uuid(), 'v1', 'Phiên bản knowledge base ban đầu', 'semantic-split', 'BGE-M3', TRUE)
ON CONFLICT DO NOTHING;