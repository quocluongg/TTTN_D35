"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminCategoryService } from "@/services/admin/adminCategoryService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FolderPlus } from "lucide-react";

type CategoryRow = Record<string, any>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<CategoryRow | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [parentId, setParentId] = useState("");

  const resetForm = () => {
    setName("");
    setSlug("");
    setDisplayOrder(0);
    setParentId("");
    setEditingCategory(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminCategoryService.create(data),
    onSuccess: () => {
      notifySuccess("Thêm danh mục thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể thêm danh mục.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminCategoryService.update(id, data),
    onSuccess: () => {
      notifySuccess("Cập nhật danh mục thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật danh mục.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCategoryService.delete(id),
    onSuccess: () => {
      notifySuccess("Xóa danh mục thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setDeleteConfirmItem(null);
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể xóa danh mục.");
    },
  });

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (row: CategoryRow) => {
    setEditingCategory(row);
    setName(row.name || "");
    setSlug(row.slug || "");
    setDisplayOrder(row.displayOrder || 0);
    setParentId(row.parentId || "");
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      slug: slug || undefined,
      displayOrder,
      parentId: parentId || undefined,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <ResourcePage
        title="Quản lý Danh mục"
        description="Quản lý cây danh mục sản phẩm, thứ tự hiển thị và đường dẫn tĩnh."
        queryKey="admin-categories"
        fetcher={adminCategoryService.list}
        fields={[
          { key: "name", label: "Tên danh mục" },
          { key: "slug", label: "Slug" },
          { key: "parentName", label: "Danh mục cha" },
          { key: "displayOrder", label: "Thứ tự hiển thị" },
        ]}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeleteConfirmItem(row)}
      />

      {/* CRUD Modal */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
          <DialogContent className="max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <span>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ví dụ: Laptop Gaming, Điện thoại..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Đường dẫn tĩnh (Slug)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Tự động sinh nếu để trống"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteConfirmItem}
        onOpenChange={(v) => !v && setDeleteConfirmItem(null)}
        title="Xác nhận xóa danh mục?"
        description={`Hành động này sẽ xóa vĩnh viễn danh mục "${deleteConfirmItem?.name}".`}
        confirmText="Xóa vĩnh viễn"
        danger
        onConfirm={() => {
          if (deleteConfirmItem) deleteMutation.mutate(deleteConfirmItem.id);
        }}
      />
    </div>
  );
}
