# AI Response Product Cards Design

**Date:** 2026-08-10
**Status:** Approved
**Scope:** Enhance AI chat page to show real product cards with 2-column layout

---

## Overview

Enhance the AI chat response to display real product cards fetched from the backend API, replacing the current mock data implementation. Cards will display in a 2-column grid layout and link to product detail pages.

---

## Goals

1. **Real product data** — Fetch actual product information using product IDs from AI sources
2. **2-column layout** — Display product cards in a responsive 2-column grid in AI responses
3. **Real thumbnails** — Show actual product images from the API
4. **Clickable navigation** — Cards link to `/product/{id}` in new tabs

---

## Approach

**Approach A: Inline Fetch on Render**

- When a message with `sources` renders, fetch product data by ID via `productService.getProductById()`
- Store fetched products in local state (`Map<productId, ProductListItem>`)
- Render 2-column grid with real data

---

## Components

### 1. `useProductFetcher` Hook

**Purpose:** Fetch and cache product data by ID

```typescript
const useProductFetcher = () => {
  const [productCache, setProductCache] = useState<Map<string, ProductListItem>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const fetchProduct = async (id: string) => {
    if (productCache.has(id) || loadingIds.has(id)) return;

    setLoadingIds(prev => new Set(prev).add(id));
    try {
      const product = await productService.getProductById(id);
      setProductCache(prev => new Map(prev).set(id, product));
    } catch (err) {
      console.error(`Failed to fetch product ${id}:`, err);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return { productCache, loadingIds, fetchProduct };
};
```

---

### 2. `ProductCard` Component

**Purpose:** Display a single product card with thumbnail, details, and link

**Props:**
- `product: ProductListItem` — Product data from API

**Structure:**
```
<a href="/product/{id}" target="_blank">
  ├── Thumbnail container (aspect-square)
  │   ├── Product image (object-contain)
  │   └── Brand badge (absolute positioned)
  └── Details container
      ├── Product name (line-clamp-2)
      ├── Rating (star icon + value)
      └── Price (formatted currency)
```

**Styling:**
- Rounded corners (`rounded-2xl`)
- Border with hover effect (`hover:border-blue-500/50`)
- Shadow on hover (`hover:shadow-md`)
- Image scale on hover (`group-hover:scale-105`)

---

### 3. `ProductCardSkeleton` Component

**Purpose:** Loading placeholder while product data is being fetched

**Structure:**
```
<div class="animate-pulse">
  ├── Thumbnail placeholder (aspect-square, bg-zinc-200)
  └── Details placeholder
      ├── Title line (3/4 width)
      ├── Rating line (1/2 width)
      └── Price line (1/3 width)
</div>
```

---

### 4. Product List Layout (in AI response)

**Purpose:** Display up to 4 product cards in 2-column grid

**Structure:**
```
<div class="grid grid-cols-2 gap-3">
  {sources.slice(0, 4).map(source => {
    const product = productCache.get(source.id);
    if (!product) {
      fetchProduct(source.id);
      return <ProductCardSkeleton />;
    }
    return <ProductCard product={product} />;
  })}
</div>
```

---

## File Structure

```
frontend/
├── components/
│   └── ai/
│       ├── ProductCard.tsx        ← NEW
│       └── ProductCardSkeleton.tsx ← NEW
├── hooks/
│   └── useProductFetcher.ts       ← NEW
└── app/
    └── ai/
        └── page.tsx               ← MODIFY
```

---

## Changes to `page.tsx`

### Remove
- `parseProductFromSource()` function (lines 229-277)
- `getRefProductImage()` function (lines 218-227)
- `mockPreviewImages` array (lines 279-283)
- Inline product card JSX (lines 559-629)

### Add
- Import `ProductCard`, `ProductCardSkeleton`, `useProductFetcher`
- Initialize hook: `const { productCache, loadingIds, fetchProduct } = useProductFetcher()`
- Replace inline JSX with new component structure

---

## Data Flow

1. AI response arrives with `sources: [{ id, text, score }]`
2. Component renders, checks `productCache` for each source ID
3. If not cached, calls `fetchProduct(id)` and shows skeleton
4. `productService.getProductById(id)` fetches from backend
5. Product stored in cache, component re-renders with real data
6. User clicks card → opens `/product/{id}` in new tab

---

## Success Criteria

- [ ] Product cards show real data (name, price, thumbnail, rating)
- [ ] Cards display in 2-column grid layout
- [ ] Cards link to product pages in new tabs
- [ ] Loading skeletons shown while fetching
- [ ] Graceful fallback if product fetch fails
- [ ] No mock/hardcoded product data remains
