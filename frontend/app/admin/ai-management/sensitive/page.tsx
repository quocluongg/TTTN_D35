"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import { notifyError, notifySuccess } from "@/components/Notify";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ShieldAlert,
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

const CATEGORIES = [
  { value: "", label: "Tất cả" },
  { value: "ACCOUNT", label: "Tài khoản" },
  { value: "PAYMENT", label: "Thanh toán" },
  { value: "COMPLAINT", label: "Khiếu nại" },
  { value: "PRIVACY", label: "Bảo mật" },
  { value: "OTHER", label: "Khác" },
];

const CATEGORY_COLORS: Record<string, string> = {
  ACCOUNT: "bg-blue-50 text-blue-700",
  PAYMENT: "bg-amber-50 text-amber-700",
  COMPLAINT: "bg-red-50 text-red-700",
  PRIVACY: "bg-purple-50 text-purple-700",
  OTHER: "bg-zinc-100 text-zinc-600",
};

interface SensitiveQuestion {
  id: string;
  pattern: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface FormState {
  pattern: string;
  category: string;
  isActive: boolean;
}

const emptyForm: FormState = { pattern: "", category: "OTHER", isActive: true };

export default function SensitiveQuestionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sensitive-questions", search, categoryFilter, activeFilter],
    queryFn: () =>
      adminApi.chat.sensitiveQuestions({
        search: search || undefined,
        isActive: activeFilter !== "" ? activeFilter === "true" : undefined,
      }),
  });

  const rows: SensitiveQuestion[] = (() => {
    const raw = unwrap(data) || [];
    const list = Array.isArray(raw) ? raw : raw.content ?? [];
    if (!categoryFilter) return list;
    return list.filter((r: SensitiveQuestion) => r.category === categoryFilter);
  })();

  const createMutation = useMutation({
    mutationFn: (d: FormState) => adminApi.chat.createSensitiveQuestion(d),
    onSuccess: () => {
      notifySuccess("Thêm câu hỏi nhạy cảm thành công");
      queryClient.invalidateQueries({ queryKey: ["sensitive-questions"] });
      closeModal();
    },
    onError: () => notifyError("Thêm thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormState }) =>
      adminApi.chat.updateSensitiveQuestion(id, data),
    onSuccess: () => {
      notifySuccess("Cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["sensitive-questions"] });
      closeModal();
    },
    onError: () => notifyError("Cập nhật thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.chat.deleteSensitiveQuestion(id),
    onSuccess: () => {
      notifySuccess("Đã xóa câu hỏi nhạy cảm");
      queryClient.invalidateQueries({ queryKey: ["sensitive-questions"] });
      setDeleteConfirmId(null);
    },
    onError: () => notifyError("Xóa thất bại"),
  });

  const toggleMutation = useMutation({
    mutationFn: (row: SensitiveQuestion) =>
      adminApi.chat.updateSensitiveQuestion(row.id, {
        pattern: row.pattern,
        category: row.category,
        isActive: !row.isActive,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensitive-questions"] }),
    onError: () => notifyError("Thao tác thất bại"),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: SensitiveQuestion) => {
    setEditingId(row.id);
    setForm({ pattern: row.pattern, category: row.category, isActive: row.isActive });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pattern.trim()) return notifyError("Vui lòng nhập từ khóa nhạy cảm");
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h1 className="text-[26px] font-semibold text-zinc-900 flex items-center gap-2">
            <ShieldAlert size={24} className="text-red-500" />
            Câu Hỏi Nhạy Cảm
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Quản lý danh sách từ khóa cần chuyển nhân viên khi chatbot nhận được
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
        >
          <Plus size={16} />
          Thêm từ khóa
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm từ khóa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as any)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <option value="">Trạng thái: Tất cả</option>
          <option value="true">Đang bật</option>
          <option value="false">Đã tắt</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-sm text-zinc-500">Đang tải...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert size={40} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Không có dữ liệu</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-zinc-600">Từ khóa nhạy cảm</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-600">Danh mục</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-600">Trạng thái</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <span className="font-medium text-zinc-800">{row.pattern}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[row.category] || "bg-zinc-100 text-zinc-600"}`}>
                      {CATEGORIES.find((c) => c.value === row.category)?.label || row.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleMutation.mutate(row)} className="flex items-center gap-1.5 text-sm">
                      {row.isActive ? (
                        <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600 font-medium">Bật</span></>
                      ) : (
                        <><ToggleLeft size={20} className="text-zinc-400" /><span className="text-zinc-400">Tắt</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors" title="Sửa">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirmId(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors" title="Xóa">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && rows.length > 0 && (
        <p className="text-xs text-zinc-400 text-right">
          {rows.filter((r) => r.isActive).length} đang bật / {rows.length} từ khóa
        </p>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" />
              {editingId ? "Chỉnh sửa từ khóa nhạy cảm" : "Thêm từ khóa nhạy cảm"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Từ khóa / Pattern <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.pattern}
                onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                placeholder="Ví dụ: thanh toán thất bại, hoàn tiền..."
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
              <p className="text-xs text-zinc-400 mt-1">Khi chatbot nhận tin nhắn chứa từ khóa này, hệ thống sẽ chuyển sang nhân viên</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white"
              >
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-zinc-700">Trạng thái</p>
                <p className="text-xs text-zinc-400">Bật để kích hoạt bộ lọc từ khóa này</p>
              </div>
              <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                {form.isActive ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-zinc-400" />}
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Hủy</button>
              <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                {isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Xác nhận xóa</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-600">Bạn có chắc muốn xóa từ khóa nhạy cảm này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50">Hủy</button>
            <button onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

