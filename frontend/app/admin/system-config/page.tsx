"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";

type SystemConfig = {
  key: string;
  value: string;
  description: string;
  valueType: string;
  updatedAt: string;
};

export default function SystemConfigPage() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery<SystemConfig[]>({
    queryKey: ["admin-configs"],
    queryFn: async () => {
      const res = await http.get("/admin/system-config");
      return (res as any).data;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return http.patch(`/admin/system-config/${key}`, { value });
    },
    onSuccess: () => {
      notifySuccess("Cập nhật cấu hình hệ thống thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-configs"] });
      setEditingKey(null);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || "Không thể cập nhật cấu hình");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cấu hình Hệ thống</h1>
        <p className="text-sm text-slate-500">Quản lý các tham số vận hành mà không cần khởi động lại ứng dụng.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Khóa cấu hình (Key)</th>
              <th className="px-6 py-3">Mô tả</th>
              <th className="px-6 py-3">Giá trị (Value)</th>
              <th className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Đang tải cấu hình...</td></tr>
            ) : configs?.length ? (
              configs.map((c) => (
                <tr key={c.key} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-700">{c.key}</td>
                  <td className="px-6 py-4 text-slate-600">{c.description || "N/A"}</td>
                  <td className="px-6 py-4 font-mono text-slate-900">
                    {editingKey === c.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-sm w-full focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      c.value
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingKey === c.key ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingKey(null)} className="text-xs text-slate-500">Hủy</button>
                        <button
                          onClick={() => updateConfigMutation.mutate({ key: c.key, value: editValue })}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingKey(c.key);
                          setEditValue(c.value);
                        }}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        Sửa
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Không có cấu hình nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
