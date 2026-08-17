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

  const publishAll = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Create new sections (no real id)
      const newSections = localSections.filter(
        (s) => !s.id || s.id.startsWith("new-")
      );
      const createdIds: Map<string, string> = new Map(); // tempId -> realId

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
