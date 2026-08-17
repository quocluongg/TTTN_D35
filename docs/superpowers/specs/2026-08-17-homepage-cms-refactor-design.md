# Homepage CMS Refactor Design

**Date:** 2026-08-17
**Status:** Approved
**Approach:** Dirty State Refactor (Approach 2)

## Problem Statement

The Homepage CMS has 5 critical bugs across admin and public sides:

### Admin CMS Bugs
1. **Publish button doesn't persist** — `handlePublishAll()` only shows a success toast without calling any API
2. **Inspector missing fields** — Section inspector only edits `title`, `subtitle`, `enabled`. Missing `layoutStyle` and `configJson`
3. **Reorder doesn't work** — `reorderLayoutMutation` fires but changes don't persist or reflect properly

### Public Homepage Bugs
4. **Layout doesn't match admin** — Hero section doesn't receive `banners` prop; sections render but config isn't applied
5. **Hardcoded sections** — BuyByNeedSection, CategoryGridSection have hardcoded content; only `section.title` is read from CMS

## Design Decisions

- **Scope:** Fix 5 bugs + refactor state management. No new features.
- **Dynamic level:** "Cấu trúc động, nội dung tĩnh" — admin can edit title/subtitle/enabled/layoutStyle/configJson. Content inside sections (images, links, text) stays as-is in code.
- **Save flow:** Batch save via Publish button. All changes accumulated locally, saved in one batch on Publish.
- **Database:** No changes needed. Backend API already complete.
- **Backend:** No changes needed.

## Architecture

### State Management — `useCmsState` Hook

A custom hook that manages all CMS local state with dirty tracking:

```
useCmsState()
├── originalSections: HomeLayoutSection[]     ← snapshot from API (last successful load/publish)
├── localSections: HomeLayoutSection[]        ← local editable copy
├── dirtySectionIds: Set<string>              ← sections modified since last sync
├── deletedSectionIds: Set<string>            ← sections marked for deletion
├── orderChanged: boolean                     ← whether displayOrder changed
│
├── editSection(id, changes)                  ← update local, mark dirty
├── toggleEnabled(id)                         ← toggle + mark dirty
├── reorder(fromIdx, toIdx)                   ← reorder local, mark orderChanged
├── deleteSection(id)                         ← mark deleted (or remove if new)
├── createSection(data)                       ← add to local (no id → will POST on publish)
│
└── publishAll() → Promise<PublishResult>     ← diff → batch API calls
```

### Publish Flow

When user clicks Publish:

1. **Collect changes:**
   - `newSections[]` — local sections without `id` → `POST /admin/home/layout`
   - `dirtySections[]` — sections in `dirtySectionIds` → `PUT /admin/home/layout/{id}`
   - `deletedSections[]` — sections in `deletedSectionIds` → `DELETE /admin/home/layout/{id}`
   - If `orderChanged` → `PUT /admin/home/layout/reorder`

2. **Execute sequentially:**
   - Create new sections first (to get IDs)
   - Update dirty sections
   - Delete removed sections
   - Reorder if needed

3. **On success:**
   - Invalidate react-query `["cms-layout"]`
   - Reset `dirtySectionIds`, `deletedSectionIds`, `orderChanged`
   - Update `originalSections` snapshot
   - Show success toast

4. **On error:**
   - Show error toast with specific failed item
   - Keep dirty state intact (user can retry)

### Section Inspector Form

Expand the sidebar inspector to include all fields:

| Field | Type | Editable |
|---|---|---|
| `sectionKey` | Select (create) / Read-only (edit) | When creating only |
| `title` | Text input | Always |
| `subtitle` | Text input | Always |
| `enabled` | Checkbox | Always |
| `layoutStyle` | Select dropdown | Always |
| `configJson` | Form fields (parsed) | Always |

**layoutStyle options:** `FULL_WIDTH`, `HERO_FULL`, `GRID`, `GRID_5`, `2_COL_GRID`, `3_COL_GRID`, `CARDS`, `TICKER`, `LIST`

**configJson handling:** Parse JSON → render contextual form fields:
- `limit` → number input
- `sortBy` → select (createdAt, price, name, rating)
- Not raw JSON editor — user-friendly form fields

### Public Homepage Sync

Fix `app/page.tsx` to properly pass data to all section components:

1. **Fetch banners and brands** in addition to layout
2. **Pass `banners` to HeroSection** — enables slide banner display
3. **Pass `brands` to new BrandLogosSection** — enables brand logos display
4. **Apply `configJson.limit`** in ProductShowcaseSection to slice products
5. **Add BRAND_LOGOS case** to section renderer

## File Changes

### Files to Modify

| File | Changes |
|---|---|
| `frontend/app/admin/cms/page.tsx` | Replace scattered state with `useCmsState` hook. Fix `handlePublishAll` to batch save. Pass local sections to canvas. |
| `frontend/components/admin/cms/ThemeStudioSidebar.tsx` | Expand inspector form: add `layoutStyle` select, `configJson` form fields. Section key dropdown for create mode. |
| `frontend/components/admin/cms/ThemeStudioCanvas.tsx` | Ensure it renders from `localSections` (already does via props, minor verification). |
| `frontend/app/page.tsx` | Fetch banners/brands. Add BRAND_LOGOS case. Pass banners to HeroSection. |
| `frontend/services/homeService.ts` | Verify brands endpoint exists (already has it). |

### Files to Create

| File | Purpose |
|---|---|
| `frontend/hooks/useCmsState.ts` | Custom hook: dirty state tracking, batch publish logic |
| `frontend/components/home/BrandLogosSection.tsx` | New section component for brand logos display |

### Files NOT Changed

- **Backend:** All APIs already exist and work correctly
- **Database:** Schema is complete, no migrations needed
- **Section components (BuyByNeed, CategoryGrid, etc.):** Keep as-is per "cấu trúc động, nội dung tĩnh" decision

## Section Key Mapping

| Section Key | Component | Data Source | Dynamic Fields |
|---|---|---|---|
| HERO_BANNER | HeroSection | Banners from API | title, subtitle, banners |
| MARQUEE_TICKER | MarqueeTickerSection | section.subtitle | subtitle (ticker text) |
| FEATURED_PRODUCTS | ProductShowcaseSection | Products from API | title, subtitle, configJson.limit |
| BUY_BY_NEED | BuyByNeedSection | Hardcoded content | title only |
| FEATURED_CATEGORIES | CategoryGridSection | Hardcoded content | title only |
| NEWS_JOURNAL | NewsJournalSection | Articles from API | title, subtitle |
| BRAND_LOGOS | BrandLogosSection (new) | Brands from API | title, subtitle |

## Success Criteria

After implementation:
1. Admin can edit title, subtitle, enabled, layoutStyle, configJson for each section
2. Admin can reorder sections and changes persist after Publish
3. Publish button correctly batch-saves all changes to backend
4. Public homepage displays sections in correct order matching admin config
5. Hero section shows slide banners from admin CMS
6. Brand logos section renders on public homepage
7. All section components read title/subtitle from CMS data
