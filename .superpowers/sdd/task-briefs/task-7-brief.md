# Task 7: Fix Product Recommendation Flow

## Problem
After the RAG pipeline returns reranked `sources`, the frontend IGNORES them for product cards. Instead it makes a separate call: `productService.getProducts({ search: userMessage.content, size: 2 })` which does a naive text search, bypassing all NLU/retrieval/reranking.

Additionally, `parseProductFromSource()` has HARDCODED product data (MSI, HP, MacBook prices/specs) that will be wrong for any real product.

## Requirements

### 7a. Use reranked sources for product recommendations
In `frontend/app/ai/page.tsx`, after receiving the RAG response:
1. Extract product IDs from the top reranked source chunks using `extractProductId()` (already exists)
2. Deduplicate product IDs (multiple chunks may belong to same product)
3. Fetch real product details from backend using those IDs: `productService.getProductBySlugOrId(productId)`
4. Use these real products for the product cards

### 7b. Remove `parseProductFromSource` hardcoded data
- Delete the `parseProductFromSource` function entirely
- The `RefProductCard` component should ONLY use real API data
- If API fetch fails, show a minimal fallback (product name from chunk text, no fake prices)

### 7c. Update RefProductCard to handle loading states
- Add loading skeleton/spinner while product details are being fetched
- Show error state gracefully if fetch fails

### 7d. Improve product extraction logic
The current flow:
```
sources -> extractProductId -> fetch product -> show card
```
Should be:
```
sources (from reranked RAG results) -> extract unique product IDs -> fetch top 2-3 products -> show cards
```

## Files to Modify
- `frontend/app/ai/page.tsx` (lines 103-155 parseProductFromSource, lines 198-310 RefProductCard, lines 527-538 product fetch logic)

## Acceptance Criteria
- Product cards show real data from backend API, not hardcoded values
- Product IDs are extracted from reranked RAG source chunks
- No separate naive text search for products
- Loading state shown while fetching
- Graceful fallback if product fetch fails
- Maximum 3 product cards shown per response
