"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminCategoryService } from "@/services/admin/adminCategoryService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import ConfirmDialog from "@/components/ConfirmDialog";

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
    <div className="space-y-6">
      <ResourcePage
        title="Quản lý Danh mục"
        description="Quản lý cây danh mục sản phẩm, hiển thị thứ tự và slug đường dẫn."
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
          <DialogContent className="max-w-md border-2 border-black bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider">
                {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">
                Tên danh mục <span className="text-red-500">*</span>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="Ví dụ: Laptop Gaming"
                />
              </label>

              <label className="block text-sm font-semibold">
                Đường dẫn tĩnh (Slug)
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="Tự động sinh nếu để trống"
                />
              </label>

              <label className="block text-sm font-semibold">
                Thứ tự hiển thị
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                />
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-black px-4 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
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
        description={`Hành động này sẽ xóa vĩnh viễn danh mục "${deleteConfirmItem?.name}". Điều này có thể ảnh hưởng đến liên kết danh mục của một số sản phẩm.`}
        confirmText="Xóa vĩnh viễn"
        onConfirm={() => {
          if (deleteConfirmItem) deleteMutation.mutate(deleteConfirmItem.id);
        }}
      />
    </div>
  );
}
