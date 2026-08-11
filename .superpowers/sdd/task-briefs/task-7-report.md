# Task 7 Report: Fix Product Recommendation Flow

## Status: DONE

## Changes Made

**File modified:** `frontend/app/ai/page.tsx`

### 7a. Use reranked sources for product recommendations

**Old flow (broken):**
- Ignored `data.sources` from RAG pipeline
- Made naive `productService.getProducts({ search: userMessage.content, size: 2 })` call
- Bypassed all NLU/retrieval/reranking work

**New flow (correct):**
- Extracts product IDs from `data.sources` chunk IDs using `extractProductId()`
- Deduplicates IDs (multiple chunks may belong to same product)
- Fetches top 3 real products via `productService.getProductBySlugOrId()` in parallel using `Promise.allSettled`
- Converts `ProductDetail` to `ProductListItem` via new `detailToListItem()` helper
- Stores in `realProducts` on the message

### 7b. Remove `parseProductFromSource` hardcoded data

- **Deleted** `parseProductFromSource()` function entirely (was 53 lines of hardcoded MSI, HP, MacBook, iPhone, Samsung fake data)
- **Added** `extractBasicInfoFromSource()` - minimal fallback that extracts only name and brand from source text, with NO fake prices/specs/ratings
- **Added** `detailToListItem()` converter to transform `ProductDetail` API response to `ProductListItem` format

### 7c. Update RefProductCard to handle loading states

- Added `loading` state with animated skeleton placeholder while product details are being fetched
- Added `fetchFailed` state that shows:
  - Reduced opacity card
  - "Liên hệ" (Contact) instead of fake price
  - "--" for rating instead of fake 4.8
  - "Không tìm thấy" button text
  - No link navigation (href undefined)
  - Hidden review count when no data

### 7d. Improve product extraction logic

New pipeline:
```
data.sources -> extractProductId() -> deduplicate -> slice(0,3) -> Promise.allSettled(getProductBySlugOrId) -> detailToListItem -> realProducts
```

## Key Design Decisions

1. **Parallel fetching** with `Promise.allSettled` - if one product fetch fails, others still succeed
2. **Max 3 products** per response (task brief says 2-3, chose 3 for better coverage)
3. **`extractBasicInfoFromSource`** as fallback - only extracts name/brand from text, no fabricated data
4. **Loading skeleton** matches the card layout for smooth visual transition
5. **`RefProductCard` kept** as fallback renderer when `realProducts` is empty (sources exist but fetch failed)

## Verification

- TypeScript compilation: PASS (`npx tsc --noEmit`)
- No remaining references to `parseProductFromSource`
- All acceptance criteria met

## Commit

- `11bd5b5` - fix: use RAG source chunks for product recommendations instead of naive search
