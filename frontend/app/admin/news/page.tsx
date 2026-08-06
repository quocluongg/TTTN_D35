"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminNewsService } from "@/services/admin/adminNewsService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";

type NewsRow = Record<string, any>;

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<NewsRow | null>(null);
  const [editingNews, setEditingNews] = useState<NewsRow | null>(null);

  // Form states for creating/editing news article
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setThumbnail("");
    setSummary("");
    setContent("");
    setTags("");
    setStatus("DRAFT");
    setEditingNews(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminNewsService.create(data),
    onSuccess: () => {
      notifySuccess("Tạo bài viết tin tức thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể tạo bài viết.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminNewsService.update(id, data),
    onSuccess: () => {
      notifySuccess("Cập nhật bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật bài viết.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminNewsService.delete(id),
    onSuccess: () => {
      notifySuccess("Xóa bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      setDeleteConfirmItem(null);
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể xóa bài viết.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminNewsService.status(id, { status }),
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái xuất bản thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể thay đổi trạng thái.");
    },
  });

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (row: NewsRow) => {
    setEditingNews(row);
    setTitle(row.title || "");
    setSlug(row.slug || "");
    setThumbnail(row.thumbnail || "");
    setSummary(row.summary || "");
    setContent(row.content || "");
    setTags(row.tags || "");
    setStatus(row.status || "DRAFT");
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      slug: slug || undefined,
      thumbnail,
      summary,
      content,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean).join(",") : undefined,
      status,
    };

    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const customNewsActions = (row: NewsRow) => (
    <button
      onClick={() =>
        toggleStatusMutation.mutate({
          id: row.id,
          status: row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
        })
      }
      className={`border px-2 py-1 text-xs font-semibold ${
        row.status === "PUBLISHED"
          ? "border-amber-600 text-amber-600 hover:bg-amber-50"
          : "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
      }`}
    >
      {row.status === "PUBLISHED" ? "Gỡ bài" : "Đăng bài"}
    </button>
  );

  return (
    <div className="space-y-6">
      <ResourcePage
        title="Tin tức & Sự kiện"
        description="Biên tập bài viết, xuất bản tin tức công nghệ và cập nhật sự kiện khuyến mãi cho trang chủ."
        queryKey="admin-news"
        fetcher={adminNewsService.list}
        fields={[
          { key: "title", label: "Tiêu đề bài viết" },
          { key: "slug", label: "Slug" },
          { key: "tags", label: "Tags" },
          { key: "status", label: "Trạng thái" },
          { key: "createdAt", label: "Ngày tạo" },
        ]}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeleteConfirmItem(row)}
        customActions={customNewsActions}
      />

      {/* Create/Edit News Modal */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
          <DialogContent className="max-w-2xl border-2 border-black bg-white p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider">
                {editingNews ? "Chỉnh sửa bài viết" : "Viết bài mới"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm text-black">
              <label className="block font-semibold">
                Tiêu đề bài viết <span className="text-red-500">*</span>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="Ví dụ: Đánh giá chi tiết Laptop ASUS Zenbook 14 OLED"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block font-semibold">
                  Đường dẫn tĩnh (Slug)
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                    placeholder="Tự động sinh nếu để trống"
                  />
                </label>

                <label className="block font-semibold">
                  Ảnh đại diện (Thumbnail URL)
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block font-semibold">
                  Thẻ phân loại (Tags - cách nhau bởi dấu phẩy)
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                    placeholder="Zenbook, ASUS, Review"
                  />
                </label>

                <label className="block font-semibold">
                  Trạng thái hiển thị
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  >
                    <option value="DRAFT">DRAFT (Nháp)</option>
                    <option value="PUBLISHED">PUBLISHED (Công khai)</option>
                  </select>
                </label>
              </div>

              <label className="block font-semibold">
                Tóm tắt ngắn (Summary) <span className="text-red-500">*</span>
                <textarea
                  required
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="Viết tóm tắt hiển thị ở danh sách tin tức..."
                />
              </label>

              <label className="block font-semibold">
                Nội dung chi tiết (Markdown / HTML) <span className="text-red-500">*</span>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-xs font-mono bg-white"
                  placeholder="Viết nội dung bài viết..."
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmItem}
        onOpenChange={(v) => !v && setDeleteConfirmItem(null)}
        title="Xác nhận xóa bài viết?"
        description={`Hành động này sẽ xóa vĩnh viễn tin tức "${deleteConfirmItem?.title}". Bạn không thể khôi phục lại dữ liệu này sau khi xóa.`}
        confirmText="Xóa vĩnh viễn"
        onConfirm={() => {
          if (deleteConfirmItem) deleteMutation.mutate(deleteConfirmItem.id);
        }}
      />
    </div>
  );
}
