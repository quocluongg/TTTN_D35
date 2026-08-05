"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { notifyError, notifySuccess } from "@/components/Notify";
import { Settings, Edit3, X, Lock, Globe } from "lucide-react";

interface SystemConfig {
  id?: string;
  configKey: string;
  configValue: string;
  isPublic: boolean;
  description?: string;
  updatedAt?: string;
}

const unwrap = (x: any) => x?.data ?? x;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-system-configs"],
    queryFn: () => adminApi.systemConfigs.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value, isPublic }: { key: string; value: string; isPublic: boolean }) =>
      adminApi.systemConfigs.update(key, { configValue: value, isPublic }),
    onSuccess: () => {
      notifySuccess("Cập nhật cấu hình thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-system-configs"] });
      setEditingConfig(null);
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật cấu hình.");
    },
  });

  const payload: any = unwrap(data) || [];
  const rows: SystemConfig[] = Array.isArray(payload) ? payload : payload.content || [];

  const handleOpenEdit = (config: SystemConfig) => {
    setEditingConfig(config);
    setEditValue(config.configValue || "");
    setIsPublic(config.isPublic ?? false);
  };

  const columns: Column<SystemConfig>[] = [
    {
      key: "configKey",
      header: "Khóa cấu hình (Key)",
      cell: (r) => (
        <div>
          <span className="font-mono text-sm font-bold text-black">{r.configKey || (r as any).key}</span>
          {r.description && <p className="text-xs text-zinc-500">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "configValue",
      header: "Giá trị (Value)",
      cell: (r) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 border border-zinc-300 max-w-sm truncate block">
          {r.configValue || (r as any).value || "—"}
        </span>
      ),
    },
    {
      key: "isPublic",
      header: "Quyền truy cập",
      cell: (r) =>
        r.isPublic ? (
          <span className="inline-flex items-center gap-1 border border-green-700 bg-green-50 text-green-800 px-2 py-0.5 text-xs font-bold">
            <Globe size={12} /> PUBLIC
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 border border-zinc-500 bg-zinc-100 text-zinc-700 px-2 py-0.5 text-xs font-bold">
            <Lock size={12} /> PRIVATE
          </span>
        ),
    },
    {
      key: "updatedAt",
      header: "Cập nhật",
      cell: (r) => (
        <span className="text-xs font-mono text-zinc-500">
          {r.updatedAt ? new Date(r.updatedAt).toLocaleString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (r) => (
        <button
          onClick={() => handleOpenEdit(r)}
          className="flex items-center gap-1 border border-black px-2.5 py-1 text-xs font-medium hover:bg-zinc-100"
        >
          <Edit3 size={13} /> Sửa giá trị
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="border-b border-black pb-5">
        <h1 className="text-[28px] font-medium tracking-tight flex items-center gap-2">
          <Settings size={26} /> Cấu hình hệ thống
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tùy chỉnh các tham số vận hành, thông tin thương hiệu, phí giao hàng và cấu hình tích hợp.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        rowKey={(r) => r.configKey || (r as any).key || Math.random()}
        empty="Chưa có tham số cấu hình nào."
      />

      {/* Edit Config Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                key: editingConfig.configKey || (editingConfig as any).key,
                value: editValue,
                isPublic,
              });
            }}
            className="w-full max-w-lg border border-black bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-xl font-medium">Sửa cấu hình</h3>
              <button type="button" onClick={() => setEditingConfig(null)}>
                <X size={20} />
              </button>
            </div>

            <div>
              <p className="font-mono text-xs text-zinc-500 uppercase">Config Key</p>
              <p className="font-mono text-base font-bold text-black">{editingConfig.configKey || (editingConfig as any).key}</p>
            </div>

            <label className="block text-sm font-medium">
              Giá trị cấu hình (Config Value)
              <textarea
                rows={4}
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mt-1 block w-full border border-black font-mono px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-black"
              />
              Công khai (Public client API có thể đọc)
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-black">
              <button type="button" onClick={() => setEditingConfig(null)} className="border border-black px-4 py-2 text-sm">
                Hủy
              </button>
              <button disabled={updateMutation.isPending} className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50">
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
