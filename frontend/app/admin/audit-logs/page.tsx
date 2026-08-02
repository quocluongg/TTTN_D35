"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";

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
  const { data, isLoading, refetch } = useQuery<AuditPageResponse>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await http.get("/admin/audit-logs?size=30");
      return (res as any).data;
    },
  });

  const MOCK_LOGS: AuditLog[] = data?.content || [
    { id: 1, action: "UPDATE_STOCK", entityType: "INVENTORY", entityId: "KYOR-1009-STD", summary: "Tăng +10 sản phẩm kiểm kê kho", actorEmail: "admin@shopwise.vn", createdAt: "2024-05-14T09:12:00Z" },
    { id: 2, action: "UPDATE_ORDER_STATUS", entityType: "ORDER", entityId: "SW-89412", summary: "Chuyển trạng thái đơn sang DELIVERED", actorEmail: "kythuat@shopwise.vn", createdAt: "2024-05-14T10:45:00Z" },
    { id: 3, action: "LOCK_USER", entityType: "USER", entityId: "4", summary: "Khóa tài khoản lockeduser@shopwise.vn", actorEmail: "admin@shopwise.vn", createdAt: "2024-05-14T11:20:00Z" },
  ];

  const columns: Column<AuditLog>[] = [
    {
      header: "Thực Hiện Bởi",
      render: (log) => (
        <span className="font-bold text-slate-900">{log.actorEmail || "SYSTEM ENGINE"}</span>
      ),
    },
    {
      header: "Thao Tác (Action)",
      render: (log) => (
        <AdminJSPillTag variant={log.action.includes("LOCK") ? "danger" : log.action.includes("UPDATE") ? "purple" : "info"}>
          {log.action}
        </AdminJSPillTag>
      ),
    },
    {
      header: "Thực Thể (Entity)",
      render: (log) => (
        <span className="font-mono text-slate-600">
          {log.entityType} #{log.entityId}
        </span>
      ),
    },
    {
      header: "Nội Dung Chi Tiết",
      accessor: "summary",
      render: (log) => <span className="text-slate-800">{log.summary}</span>,
    },
    {
      header: "Thời Gian",
      render: (log) => (
        <span className="font-mono text-slate-400 text-[11px]">
          {new Date(log.createdAt).toLocaleString("vi-VN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Nhật Ký Hệ Thống (Audit Logs Resource)"
        resourceName="AuditLogs"
        count={data?.totalElements || MOCK_LOGS.length}
        description="Truy vết chi tiết mọi thao tác quản trị, cập nhật tồn kho, đơn hàng và phân quyền."
        onRefresh={() => refetch()}
      />

      <AdminJSResourceTable<AuditLog>
        columns={columns}
        data={MOCK_LOGS}
        keyExtractor={(log) => String(log.id)}
        isLoading={isLoading}
        onView={(log) => alert(`Chi tiết Log #${log.id}: ${log.summary}`)}
      />
    </div>
  );
}
