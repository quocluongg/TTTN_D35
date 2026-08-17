# Homepage CMS Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 Homepage CMS bugs (Publish not saving, Inspector missing fields, Reorder broken, Public layout mismatch, Hardcoded sections) by refactoring admin state management with dirty tracking and batch save.

**Architecture:** Custom React hook `useCmsState` tracks local edits vs API snapshot. All changes accumulate locally; Publish button batch-saves diffs (create/update/delete/reorder) to backend. Public homepage fetches banners/brands alongside layout and passes props to section components.

**Tech Stack:** Next.js 15 (App Router), React 19, TanStack Query, TypeScript, Tailwind CSS

## Global Constraints

- No backend changes — all backend APIs already exist and work correctly
- No database changes — schema is complete
- Section UI components (BuyByNeed, CategoryGrid, etc.) keep current visual design — only title/subtitle/configJson are read from CMS
- `configJson` stored as JSON string in DB; inspector parses to form fields, serializes back on save
- `sectionKey` is read-only on edit (cannot change key of existing section)

---

### Task 1: Create `useCmsState` Hook

**Files:**
- Create: `frontend/hooks/useCmsState.ts`
- Reference: `frontend/types/home.ts` (HomeLayoutSection type)
- Reference: `frontend/services/admin/index.ts` (adminApi.home.layout API)

**Interfaces:**
- Consumes: `HomeLayoutSection` type from `@/types/home`, `adminApi.home.layout` from `@/services/admin`
- Produces: `useCmsState(initialSections: HomeLayoutSection[])` returning `{ localSections, isDirty, hasChanges, editSection, toggleEnabled, reorder, deleteSection, createSection, publishAll, resetToOriginal }`

- [ ] **Step 1: Create the hook file with type definitions**

```typescript
// frontend/hooks/useCmsState.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { HomeLayoutSection } from "@/types/home";
import { adminApi } from "@/services/admin";

const unwrap = (x: any) => x?.data ?? x;

export interface CmsState {
  localSections: HomeLayoutSection[];
  isDirty: boolean;
  hasChanges: boolean;
  editSection: (id: string, changes: Partial<HomeLayoutSection>) => void;
  toggleEnabled: (id: string) => void;
  reorder: (fromIdx: number, toIdx: number) => void;
  deleteSection: (id: string) => void;
  createSection: (data: Omit<HomeLayoutSection, "id" | "createdAt" | "updatedAt">) => void;
  publishAll: () => Promise<boolean>;
  resetToOriginal: (sections: HomeLayoutSection[]) => void;
}
```

- [ ] **Step 2: Implement state tracking (originalSnapshot, dirtyIds, deletedIds, orderChanged)**

```typescript
export function useCmsState(initialSections: HomeLayoutSection[]): CmsState {
  const [originalSnapshot, setOriginalSnapshot] = useState<HomeLayoutSection[]>(initialSections);
  const [localSections, setLocalSections] = useState<HomeLayoutSection[]>(initialSections);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [orderChanged, setOrderChanged] = useState(false);

  // Sync when initialSections changes (from react-query refetch)
  const syncFromServer = useCallback((sections: HomeLayoutSection[]) => {
    setOriginalSnapshot(sections);
    setLocalSections(sections);
    setDirtyIds(new Set());
    setDeletedIds(new Set());
    setOrderChanged(false);
  }, []);

  // ... methods in next steps
```

- [ ] **Step 3: Implement editSection, toggleEnabled, reorder**

```typescript
  const editSection = useCallback((id: string, changes: Partial<HomeLayoutSection>) => {
    setLocalSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
    );
    setDirtyIds((prev) => new Set(prev).add(id));
  }, []);

  const toggleEnabled = useCallback((id: string) => {
    setLocalSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    setDirtyIds((prev) => new Set(prev).add(id));
  }, []);

  const reorder = useCallback((fromIdx: number, toIdx: number) => {
    setLocalSections((prev) => {
      const list = [...prev];
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      // Update displayOrder
      return list.map((s, i) => ({ ...s, displayOrder: i + 1 }));
    });
    setOrderChanged(true);
  }, []);
```

- [ ] **Step 4: Implement deleteSection, createSection**

```typescript
  const deleteSection = useCallback((id: string) => {
    // If section has no id (new, never published), just remove from local
    if (!id || id.startsWith("new-")) {
      setLocalSections((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(id));
    setLocalSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const createSection = useCallback(
    (data: Omit<HomeLayoutSection, "id" | "createdAt" | "updatedAt">) => {
      const newSection: HomeLayoutSection = {
        ...data,
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      setLocalSections((prev) => [...prev, newSection]);
    },
    []
  );
```

- [ ] **Step 5: Implement publishAll (batch save logic)**

```typescript
  const publishAll = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Create new sections (no real id)
      const newSections = localSections.filter(
        (s) => !s.id || s.id.startsWith("new-")
      );
      const createdIds: Map<string, string> = new Map(); // tempId → realId

      for (const sec of newSections) {
        const payload = {
          sectionKey: sec.sectionKey,
          title: sec.title,
          subtitle: sec.subtitle,
          displayOrder: sec.displayOrder,
          enabled: sec.enabled,
          layoutStyle: sec.layoutStyle,
          configJson: sec.configJson,
        };
        const res: any = await adminApi.home.layout.create(payload);
        const created = unwrap(res);
        if (created?.id) {
          createdIds.set(sec.id, created.id);
        }
      }

      // 2. Update dirty existing sections
      const dirtyExisting = localSections.filter(
        (s) => dirtyIds.has(s.id) && !s.id.startsWith("new-")
      );
      for (const sec of dirtyExisting) {
        await adminApi.home.layout.update(sec.id, {
          sectionKey: sec.sectionKey,
          title: sec.title,
          subtitle: sec.subtitle,
          displayOrder: sec.displayOrder,
          enabled: sec.enabled,
          layoutStyle: sec.layoutStyle,
          configJson: sec.configJson,
        });
      }

      // 3. Delete removed sections
      for (const id of deletedIds) {
        await adminApi.home.layout.delete(id);
      }

      // 4. Reorder if changed
      if (orderChanged || newSections.length > 0 || deletedIds.size > 0) {
        // Build final order from localSections (excluding deleted, with real IDs)
        const finalSections = localSections
          .filter((s) => !deletedIds.has(s.id))
          .map((s, idx) => ({
            id: createdIds.get(s.id) || s.id,
            displayOrder: idx + 1,
          }));
        await adminApi.home.layout.reorder(finalSections);
      }

      return true;
    } catch (err) {
      console.error("Publish failed:", err);
      throw err;
    }
  }, [localSections, dirtyIds, deletedIds, orderChanged]);
```

- [ ] **Step 6: Implement resetToOriginal and computed values, export hook**

```typescript
  const resetToOriginal = useCallback((sections: HomeLayoutSection[]) => {
    setOriginalSnapshot(sections);
    setLocalSections(sections);
    setDirtyIds(new Set());
    setDeletedIds(new Set());
    setOrderChanged(false);
  }, []);

  const isDirty = dirtyIds.size > 0 || deletedIds.size > 0 || orderChanged ||
    localSections.some((s) => !s.id || s.id.startsWith("new-"));

  const hasChanges = isDirty;

  return {
    localSections,
    isDirty,
    hasChanges,
    editSection,
    toggleEnabled,
    reorder,
    deleteSection,
    createSection,
    publishAll,
    resetToOriginal,
  };
}
```

- [ ] **Step 7: Verify the hook compiles**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No type errors in `hooks/useCmsState.ts`

- [ ] **Step 8: Commit**

```bash
git add frontend/hooks/useCmsState.ts
git commit -m "feat(cms): add useCmsState hook with dirty tracking and batch publish"
```

---

### Task 2: Refactor Admin CMS Page to Use `useCmsState`

**Files:**
- Modify: `frontend/app/admin/cms/page.tsx`
- Reference: `frontend/hooks/useCmsState.ts` (from Task 1)
- Reference: `frontend/components/admin/cms/ThemeStudioCanvas.tsx` (props interface)
- Reference: `frontend/components/admin/cms/ThemeStudioSidebar.tsx` (props interface)

**Interfaces:**
- Consumes: `useCmsState` from Task 1, `adminApi.home.*` services
- Produces: Updated `CmsPage` component passing `localSections` to canvas/sidebar

- [ ] **Step 1: Import useCmsState and replace layout state management**

In `frontend/app/admin/cms/page.tsx`, replace the layout-related state management:

```typescript
// ADD import at top:
import { useCmsState } from "@/hooks/useCmsState";
```

- [ ] **Step 2: Replace scattered state with useCmsState hook**

Remove the existing `saveLayoutMutation`, `deleteLayoutMutation`, `reorderLayoutMutation` and replace with hook:

```typescript
export default function CmsPage() {
  const queryClient = useQueryClient();

  // Studio Viewport State
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Branding Customization State (persisted in localStorage for demo studio)
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [desktopLogoSize, setDesktopLogoSize] = useState<number>(140);
  const [mobileLogoSize, setMobileLogoSize] = useState<number>(90);

  // Asset Modals
  const [modalType, setModalType] = useState<"banner" | "brand" | "section" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalFormData, setModalFormData] = useState<any>({});

  // Preview Data State
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [previewArticles, setPreviewArticles] = useState<any[]>([]);

  // Load stored studio preferences
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem("studio_logo_url");
      const savedDesktopSize = localStorage.getItem("studio_desktop_logo_size");
      const savedMobileSize = localStorage.getItem("studio_mobile_logo_size");
      if (savedLogo) setLogoUrl(savedLogo);
      if (savedDesktopSize) setDesktopLogoSize(Number(savedDesktopSize));
      if (savedMobileSize) setMobileLogoSize(Number(savedMobileSize));
    } catch (e) {}
  }, []);

  const handleLogoChange = (url: string) => {
    setLogoUrl(url);
    try { localStorage.setItem("studio_logo_url", url); } catch (e) {}
  };

  const handleDesktopLogoSizeChange = (size: number) => {
    setDesktopLogoSize(size);
    try { localStorage.setItem("studio_desktop_logo_size", String(size)); } catch (e) {}
  };

  const handleMobileLogoSizeChange = (size: number) => {
    setMobileLogoSize(size);
    try { localStorage.setItem("studio_mobile_logo_size", String(size)); } catch (e) {}
  };
```

- [ ] **Step 3: Wire up react-query to useCmsState**

```typescript
  // Queries
  const layoutQuery = useQuery({
    queryKey: ["cms-layout"],
    queryFn: () => adminApi.home.layout.list(),
  });

  const bannersQuery = useQuery({
    queryKey: ["cms-banners"],
    queryFn: () => adminApi.home.banners.list(),
  });

  const brandsQuery = useQuery({
    queryKey: ["cms-brands"],
    queryFn: () => adminApi.home.brands.list(),
  });

  const layoutSections: HomeLayoutSection[] = unwrap(layoutQuery.data) || [];
  const banners = unwrap(bannersQuery.data) || [];
  const brands = unwrap(brandsQuery.data) || [];

  // useCmsState hook — sync with server data
  const cms = useCmsState(layoutSections);

  // Sync hook when react-query data changes (initial load or refetch after publish)
  useEffect(() => {
    if (layoutQuery.isSuccess && layoutSections.length >= 0) {
      cms.resetToOriginal(layoutSections);
    }
  }, [layoutQuery.dataUpdatedAt]);

  // ... (preview data loading stays the same)
```

- [ ] **Step 4: Replace mutation handlers with hook methods**

Remove the old `saveLayoutMutation`, `deleteLayoutMutation`, `reorderLayoutMutation`. Replace with:

```typescript
  // Banner mutations (keep these — they're separate from layout)
  const saveBannerMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? adminApi.home.banners.update(data.id, data) : adminApi.home.banners.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Slide Banner!");
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      closeModal();
    },
    onError: (err: any) => notifyError(err?.message || "Không thể lưu Banner."),
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => adminApi.home.banners.delete(id),
    onSuccess: () => {
      notifySuccess("Đã xóa Banner!");
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
    },
  });

  const saveBrandMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? adminApi.home.brands.update(data.id, data) : adminApi.home.brands.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Thương hiệu!");
      queryClient.invalidateQueries({ queryKey: ["cms-brands"] });
      closeModal();
    },
    onError: (err: any) => notifyError(err?.message || "Không thể lưu Thương hiệu."),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => adminApi.home.brands.delete(id),
    onSuccess: () => {
      notifySuccess("Đã xóa Thương hiệu!");
      queryClient.invalidateQueries({ queryKey: ["cms-brands"] });
    },
  });
```

- [ ] **Step 5: Fix handlePublishAll to batch save via hook**

```typescript
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishAll = async () => {
    setIsPublishing(true);
    try {
      await cms.publishAll();
      notifySuccess("Đã xuất bản tất cả thay đổi trang chủ!");
      // Refetch from server to sync state
      queryClient.invalidateQueries({ queryKey: ["cms-layout"] });
    } catch (err: any) {
      notifyError(err?.message || "Không thể xuất bản. Vui lòng thử lại.");
    } finally {
      setIsPublishing(false);
    }
  };
```

- [ ] **Step 6: Update section action handlers to use hook**

```typescript
  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cms.localSections.length) return;
    cms.reorder(index, targetIdx);
  };

  const handleToggleSectionEnabled = (section: HomeLayoutSection) => {
    cms.toggleEnabled(section.id);
  };

  const handleDeleteSection = (id: string) => {
    cms.deleteSection(id);
  };

  const handleSaveSection = (data: any) => {
    if (data.id) {
      cms.editSection(data.id, data);
    }
  };

  const handleCreateSection = (data: any) => {
    cms.createSection(data);
  };
```

- [ ] **Step 7: Update JSX to use localSections and new handlers**

Replace `sections={layoutSections}` with `sections={cms.localSections}` in both canvas and sidebar. Replace old handler names:

```typescript
        <ThemeStudioCanvas
          viewport={viewport}
          onViewportChange={(vp) => setViewport(vp)}
          sections={cms.localSections}
          selectedSectionId={selectedSectionId}
          onSelectSection={(id) => setSelectedSectionId(id)}
          previewProducts={previewProducts}
          previewArticles={previewArticles}
          banners={banners}
          logoUrl={logoUrl}
          desktopLogoSize={desktopLogoSize}
          mobileLogoSize={mobileLogoSize}
        />

        <ThemeStudioSidebar
          sections={cms.localSections}
          selectedSectionId={selectedSectionId}
          onSelectSection={(id) => setSelectedSectionId(id)}
          onMoveSection={handleMoveSection}
          onToggleSectionEnabled={handleToggleSectionEnabled}
          onDeleteSection={handleDeleteSection}
          onSaveSection={handleSaveSection}
          onOpenCreateSection={() => {
            setModalType("section");
            setModalFormData({
              displayOrder: (cms.localSections.length || 0) + 1,
              enabled: true,
              sectionKey: "HERO_BANNER",
            });
          }}
          // ... rest of props stay the same
          isSaving={isPublishing || saveBannerMutation.isPending || saveBrandMutation.isPending}
          onSave={handlePublishAll}
        />
```

- [ ] **Step 8: Update modal form submit for sections to use hook**

In the modal submit handler, replace `saveLayoutMutation.mutate(modalFormData)` with:

```typescript
            onSubmit={(e) => {
              e.preventDefault();
              if (modalType === "section") {
                if (editingItem?.id) {
                  handleSaveSection(modalFormData);
                } else {
                  handleCreateSection(modalFormData);
                }
                closeModal();
              }
              if (modalType === "banner") saveBannerMutation.mutate(modalFormData);
              if (modalType === "brand") saveBrandMutation.mutate(modalFormData);
            }}
```

- [ ] **Step 9: Remove isDirty from ThemeStudioHeader, use cms.isDirty**

Replace `isDirty={isDirty}` with `isDirty={cms.isDirty}` in the ThemeStudioHeader usage. Remove the old `const [isDirty, setIsDirty] = useState<boolean>(false)` state.

- [ ] **Step 10: Verify the page compiles**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No type errors

- [ ] **Step 11: Commit**

```bash
git add frontend/app/admin/cms/page.tsx
git commit -m "refactor(cms): replace scattered state with useCmsState hook and fix Publish"
```

---

### Task 3: Expand ThemeStudioSidebar Inspector Form

**Files:**
- Modify: `frontend/components/admin/cms/ThemeStudioSidebar.tsx`
- Reference: `frontend/types/home.ts` (HomeLayoutSection type)

**Interfaces:**
- Consumes: `HomeLayoutSection` type, `onSaveSection(sectionData)` callback
- Produces: Updated inspector form with `layoutStyle` select and `configJson` form fields

- [ ] **Step 1: Add layoutStyle select to the inspector form**

In the `ThemeStudioSidebar.tsx`, inside the `{selectedSection && (` block (around line 469), expand the form. Replace the existing inspector form section:

```typescript
        {selectedSection && (
          <div className="border-b border-gray-100">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                  Editing: {selectedSection.sectionKey}
                </span>
              </div>
              <form onSubmit={handleInspectorSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Tiêu đề chính
                  </label>
                  <input
                    type="text"
                    value={inspectorData.title ?? selectedSection.title ?? ""}
                    onChange={(e) =>
                      setInspectorData({ ...inspectorData, id: selectedSection.id, title: e.target.value })
                    }
                    placeholder="Nhập tiêu đề..."
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Tiêu đề phụ
                  </label>
                  <input
                    type="text"
                    value={inspectorData.subtitle ?? selectedSection.subtitle ?? ""}
                    onChange={(e) =>
                      setInspectorData({ ...inspectorData, id: selectedSection.id, subtitle: e.target.value })
                    }
                    placeholder="Nhập subtitle..."
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Layout Style Select */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Layout Style
                  </label>
                  <select
                    value={inspectorData.layoutStyle ?? selectedSection.layoutStyle ?? ""}
                    onChange={(e) =>
                      setInspectorData({ ...inspectorData, id: selectedSection.id, layoutStyle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="">— Chọn layout —</option>
                    <option value="FULL_WIDTH">Full Width</option>
                    <option value="HERO_FULL">Hero Full</option>
                    <option value="GRID">Grid</option>
                    <option value="GRID_5">Grid 5 Columns</option>
                    <option value="2_COL_GRID">2 Column Grid</option>
                    <option value="3_COL_GRID">3 Column Grid</option>
                    <option value="CARDS">Cards</option>
                    <option value="TICKER">Ticker</option>
                    <option value="LIST">List</option>
                  </select>
                </div>

                {/* Config JSON Fields */}
                <ConfigJsonEditor
                  sectionKey={selectedSection.sectionKey}
                  configJson={inspectorData.configJson ?? selectedSection.configJson ?? ""}
                  onChange={(json) =>
                    setInspectorData({ ...inspectorData, id: selectedSection.id, configJson: json })
                  }
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inspectorData.enabled ?? selectedSection.enabled ?? true}
                      onChange={(e) =>
                        setInspectorData({ ...inspectorData, id: selectedSection.id, enabled: e.target.checked })
                      }
                      className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                    />
                    Bật hiển thị
                  </label>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
```

- [ ] **Step 2: Create ConfigJsonEditor component**

Add this component above the `ThemeStudioSidebar` function in the same file:

```typescript
/**
 * Parses configJson string and renders contextual form fields per sectionKey.
 * FEATURED_PRODUCTS: limit (number) + sortBy (select)
 * NEWS_JOURNAL: limit (number)
 * Others: no config fields
 */
function ConfigJsonEditor({
  sectionKey,
  configJson,
  onChange,
}: {
  sectionKey: string;
  configJson: string;
  onChange: (json: string) => void;
}) {
  // Parse existing config
  let config: Record<string, any> = {};
  try {
    config = configJson ? JSON.parse(configJson) : {};
  } catch {
    config = {};
  }

  const updateConfig = (key: string, value: any) => {
    const next = { ...config, [key]: value };
    onChange(JSON.stringify(next));
  };

  // Only show config for sections that have config fields
  if (sectionKey === "FEATURED_PRODUCTS") {
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Section Config
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Limit</label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.limit ?? 10}
              onChange={(e) => updateConfig("limit", Number(e.target.value))}
              className="w-full px-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Sort By</label>
            <select
              value={config.sortBy ?? "createdAt"}
              onChange={(e) => updateConfig("sortBy", e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-400"
            >
              <option value="createdAt">Mới nhất</option>
              <option value="price">Giá</option>
              <option value="name">Tên</option>
              <option value="rating">Đánh giá</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (sectionKey === "NEWS_JOURNAL") {
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Section Config
        </label>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Limit</label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.limit ?? 3}
            onChange={(e) => updateConfig("limit", Number(e.target.value))}
            className="w-full px-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
    );
  }

  // No config fields for other section types
  return null;
}
```

- [ ] **Step 3: Fix inspectorData sync when selectedSection changes**

The current code initializes `inspectorData` once. When user clicks a different section, `inspectorData` may be stale. Add a useEffect to sync:

```typescript
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const [inspectorData, setInspectorData] = useState<any>(selectedSection || {});

  // Reset inspector when selected section changes
  useEffect(() => {
    setInspectorData(selectedSection || {});
  }, [selectedSectionId]);
```

Add `useEffect` to the imports at the top of the file if not already imported.

- [ ] **Step 4: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add frontend/components/admin/cms/ThemeStudioSidebar.tsx
git commit -m "feat(cms): expand inspector with layoutStyle select and configJson editor"
```

---

### Task 4: Fix Public Homepage Data Flow

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/services/homeService.ts` (verify only)
- Reference: `frontend/components/home/HeroSection.tsx` (props: banners)
- Reference: `frontend/components/home/ProductShowcaseSection.tsx` (props: products, section)
- Reference: `frontend/components/home/NewsJournalSection.tsx` (props: articles, section)

**Interfaces:**
- Consumes: `homeService.getLayout()`, `homeService.banners()`, `homeService.brands()`
- Produces: Updated `HomePage` component passing banners/brands to section components

- [ ] **Step 1: Add brands fetch to homeService**

Verify `frontend/services/homeService.ts` has the brands endpoint:

```typescript
import http from "@/lib/http";
export const homeService = {
  getLayout: () => http.get("/home/layout"),
  banners: () => http.home.get("/home/banners"),
  brands: () => http.get("/home/brands"),
  featuredCategories: () => http.get("/home/featured-categories"),
};
```

If `brands` is already there, no change needed. If missing, add it.

- [ ] **Step 2: Update page.tsx to fetch banners and brands**

In `frontend/app/page.tsx`, add state and fetch for banners and brands:

```typescript
export default function HomePage() {
  const [layoutSections, setLayoutSections] = useState<HomeLayoutSection[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingLayout, setLoadingLayout] = useState(true);

  // 1. Fetch Dynamic Homepage Layout from Backend API
  useEffect(() => {
    homeService
      .getLayout()
      .then((res: any) => {
        const payload = unwrap(res);
        if (Array.isArray(payload) && payload.length > 0) {
          setLayoutSections(payload);
        }
      })
      .catch((err) => console.error("Lỗi load layout trang chủ:", err))
      .finally(() => setLoadingLayout(false));
  }, []);

  // 2. Load banners
  useEffect(() => {
    homeService
      .banners()
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data)) setBanners(data);
      })
      .catch(() => {});
  }, []);

  // 3. Load brands
  useEffect(() => {
    homeService
      .brands()
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(() => {});
  }, []);

  // 4. Load sản phẩm nổi bật
  useEffect(() => {
    productService
      .getProducts({ size: 10, sortBy: "createdAt" })
      .then((res: any) => {
        const payload = unwrap(res) || {};
        const items = payload.items || payload.content || (Array.isArray(payload) ? payload : []);
        if (items.length > 0) {
          setBestSellers(items);
        }
      })
      .catch((err) => console.error("Lỗi load sản phẩm trang chủ:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  // 5. Load tin tức mới nhất
  useEffect(() => {
    newsService
      .recent(3)
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      })
      .catch((err) => console.error("Lỗi load tin tức trang chủ:", err));
  }, []);
```

- [ ] **Step 3: Update renderSectionComponent to pass banners and brands**

```typescript
  const renderSectionComponent = (section: HomeLayoutSection) => {
    if (!section || !section.enabled) return null;

    switch (section.sectionKey) {
      case "HERO_BANNER":
        return <HeroSection key={section.id || "hero"} section={section} banners={banners} />;
      case "MARQUEE_TICKER":
        return <MarqueeTickerSection key={section.id || "ticker"} section={section} />;
      case "FEATURED_PRODUCTS": {
        // Apply configJson.limit if present
        let limit = 10;
        try {
          const config = section.configJson ? JSON.parse(section.configJson) : {};
          if (config.limit) limit = config.limit;
        } catch {}
        const limitedProducts = bestSellers.slice(0, limit);
        return (
          <ProductShowcaseSection
            key={section.id || "products"}
            section={section}
            products={limitedProducts}
            loading={loadingProducts}
          />
        );
      }
      case "BUY_BY_NEED":
        return <BuyByNeedSection key={section.id || "buy-need"} section={section} />;
      case "FEATURED_CATEGORIES":
        return <CategoryGridSection key={section.id || "categories"} section={section} />;
      case "NEWS_JOURNAL":
        return <NewsJournalSection key={section.id || "news"} section={section} articles={articles} />;
      case "BRAND_LOGOS":
        return <BrandLogosSection key={section.id || "brands"} section={section} brands={brands} />;
      default:
        return null;
    }
  };
```

- [ ] **Step 4: Add import for BrandLogosSection**

```typescript
import BrandLogosSection from "@/components/home/BrandLogosSection";
```

- [ ] **Step 5: Update fallback layout to include banners prop**

```typescript
          <>
            <HeroSection banners={banners} />
            <MarqueeTickerSection />
            <ProductShowcaseSection products={bestSellers} loading={loadingProducts} />
            <BuyByNeedSection />
            <CategoryGridSection />
            <NewsJournalSection articles={articles} />
            <BrandLogosSection brands={brands} />
          </>
```

- [ ] **Step 6: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: May show error for BrandLogosSection import (not created yet) — that's expected, will be fixed in Task 5

- [ ] **Step 7: Commit**

```bash
git add frontend/app/page.tsx frontend/services/homeService.ts
git commit -m "fix(homepage): fetch banners/brands and pass props to section components"
```

---

### Task 5: Create BrandLogosSection Component

**Files:**
- Create: `frontend/components/home/BrandLogosSection.tsx`
- Reference: `frontend/components/home/CategoryGridSection.tsx` (similar structure pattern)
- Reference: `frontend/types/home.ts` (HomeLayoutSection type)

**Interfaces:**
- Consumes: `HomeLayoutSection` type, `brands` array from API
- Produces: `BrandLogosSection` component rendering brand logos grid

- [ ] **Step 1: Create the BrandLogosSection component**

```typescript
// frontend/components/home/BrandLogosSection.tsx
"use client";

import React from "react";
import Image from "next/image";
import { HomeLayoutSection } from "@/types/home";

interface BrandItem {
  id?: string;
  name?: string;
  logoUrl?: string;
  isActive?: boolean;
}

interface BrandLogosSectionProps {
  section?: HomeLayoutSection;
  brands?: BrandItem[];
}

export default function BrandLogosSection({ section, brands = [] }: BrandLogosSectionProps) {
  const title = section?.title || "Thương hiệu đối tác";
  const subtitle = section?.subtitle || "Đối tác chính hãng";

  const activeBrands = brands.filter((b) => b.isActive !== false);

  if (activeBrands.length === 0) return null;

  return (
    <section className="w-full border-b border-black dark:border-zinc-800">
      <div className="w-[1920px] max-w-full mx-auto">
        {/* Header Title */}
        <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
              {subtitle}
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
              {title}
            </h2>
          </div>
        </div>

        {/* Brand Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y divide-black dark:divide-zinc-800">
          {activeBrands.map((brand) => (
            <div
              key={brand.id || brand.name}
              className="group relative flex items-center justify-center p-8 bg-white dark:bg-zinc-900 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-colors aspect-square"
            >
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={brand.name || "Brand"}
                  fill
                  className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <span className="text-sm font-bold text-zinc-400">{brand.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No type errors (the BrandLogosSection import from Task 4 should now resolve)

- [ ] **Step 3: Commit**

```bash
git add frontend/components/home/BrandLogosSection.tsx
git commit -m "feat(homepage): add BrandLogosSection component for brand logos display"
```

---

### Task 6: ThemeStudioCanvas — Pass Banners to HeroSection in Preview

**Files:**
- Modify: `frontend/components/admin/cms/ThemeStudioCanvas.tsx`
- Reference: `frontend/components/home/HeroSection.tsx` (props: section, banners)

**Interfaces:**
- Consumes: `banners` prop (already passed from CmsPage)
- Produces: HeroSection in preview canvas receives banners for slide preview

- [ ] **Step 1: Verify banners are passed to HeroSection in canvas**

Read `frontend/components/admin/cms/ThemeStudioCanvas.tsx` and verify the `renderSectionComponent` function passes `banners` to `HeroSection`:

```typescript
      case "HERO_BANNER":
        return <HeroSection key={sec.id || "hero"} section={sec} banners={banners} />;
```

This is already in the current code (line 47 of ThemeStudioCanvas.tsx). No change needed — just verify.

- [ ] **Step 2: Add BRAND_LOGOS case to canvas renderer**

Add the BRAND_LOGOS case to `renderSectionComponent` in ThemeStudioCanvas:

```typescript
      case "BRAND_LOGOS":
        return (
          <div key={sec.id || "brands"} className="p-8 text-center bg-gray-50">
            <p className="text-sm font-bold text-gray-600">{sec.title || "Thương hiệu đối tác"}</p>
            <p className="text-xs text-gray-400 mt-1">Brand logos will display here on the live site</p>
          </div>
        );
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/cms/ThemeStudioCanvas.tsx
git commit -m "feat(cms): add BRAND_LOGOS preview case in canvas"
```

---

### Task 7: End-to-End Verification

**Files:** None (manual testing)

- [ ] **Step 1: Start dev server and verify admin CMS loads**

Run: `cd frontend && npm run dev`
Open: `http://localhost:3000/admin/cms`
Expected: Page loads with layout sections in sidebar and canvas preview

- [ ] **Step 2: Test section editing (Inspector)**

1. Click a section in the canvas or sidebar
2. Verify inspector shows: title, subtitle, layoutStyle, configJson fields, enabled
3. Edit title → verify canvas preview updates live
4. Change layoutStyle → verify it reflects in inspector

- [ ] **Step 3: Test reorder**

1. Click up/down arrows on a section in sidebar
2. Verify section moves in the list
3. Verify canvas preview reflects new order

- [ ] **Step 4: Test Publish (batch save)**

1. Edit a section title
2. Toggle another section's enabled
3. Reorder a section
4. Click Publish
5. Verify success toast appears
6. Refresh page → verify changes persisted

- [ ] **Step 5: Test public homepage**

1. Open: `http://localhost:3000`
2. Verify sections display in correct order from CMS config
3. Verify hero section shows slide banners
4. Verify brand logos section appears (if brands exist in DB)
5. Verify ProductShowcaseSection uses configJson.limit

- [ ] **Step 6: Test create and delete section**

1. Click "Add a page" in sidebar → fill form → verify new section appears in list
2. Click Publish → verify new section persists
3. Delete a section → verify it disappears from list
4. Click Publish → verify deletion persists

- [ ] **Step 7: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(cms): end-to-end verification fixes"
```
