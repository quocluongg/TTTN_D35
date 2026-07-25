"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";

type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  actorEmail?: string;
  createdAt: string;
};

type AuditPageResponse = {
  content: AuditLog[];
  totalPages: number;
  totalElements: number;
};

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery<AuditPageResponse>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await http.get("/admin/audit-logs?size=30");
      return (res as any).data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hoạt động (Audit Trail)</h1>
        <p className="text-sm text-slate-500">Truy vết chi tiết mọi thao tác quản trị, thay đổi tồn kho, đơn hàng và cấu hình.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Tài khoản thực hiện</th>
              <th className="px-6 py-3">Hành động</th>
              <th className="px-6 py-3">Thực thể (Entity)</th>
              <th className="px-6 py-3">Nội dung tóm tắt</th>
              <th className="px-6 py-3">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải nhật ký...</td></tr>
            ) : data?.content?.length ? (
              data.content.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{log.actorEmail || "SYSTEM"}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 border text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">{log.entityType} ({log.entityId})</td>
                  <td className="px-6 py-4">{log.summary}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chưa có nhật ký hoạt động nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
