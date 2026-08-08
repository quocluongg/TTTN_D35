-- Enable pgvector extension for Vector Embedding storage and similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store structured product text chunks along with BGE-M3 1024-dimensional dense embeddings
CREATE TABLE IF NOT EXISTS product_chunks (
    id BIGSERIAL PRIMARY KEY,
    chunk_id VARCHAR(255) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255),
    category VARCHAR(100),
    price NUMERIC(15, 2) DEFAULT 0.0,
    chunk_type VARCHAR(50),
    chunk_text TEXT NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure embedding column exists if table pre-existed
ALTER TABLE product_chunks ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- HNSW Index for ultra-fast vector similarity search using Cosine distance (vector_cosine_ops)
CREATE INDEX IF NOT EXISTS idx_product_chunks_embedding 
ON product_chunks USING hnsw (embedding vector_cosine_ops);

-- Index for filtering by product_id
CREATE INDEX IF NOT EXISTS idx_product_chunks_product_id 
ON product_chunks (product_id);
