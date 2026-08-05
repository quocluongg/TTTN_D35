"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DataTable, { type Column } from "@/components/DataTable";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";
import { FileText, Search, ShieldAlert } from "lucide-react";

interface AuditLog {
  id: string;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  detail?: string | Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

const RESOURCE_TYPES = [
  "ALL",
  "PRODUCT",
  "CATEGORY",
  "ORDER",
  "USER",
  "ROLE",
  "CAMPAIGN",
  "VOUCHER",
  "INVENTORY",
  "WARRANTY",
  "SYSTEM_CONFIG",
];

const unwrap = (x: any) => x?.data ?? x;

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [searchAction, setSearchAction] = useState("");
  const [resourceType, setResourceType] = useState("ALL");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });

  const handleSearchActionChange = (val: string) => {
    setSearchAction(val);
    setPage(0);
  };

  const handleResourceTypeChange = (val: string) => {
    setResourceType(val);
    setPage(0);
  };

  const handleRangeChange = (val: DateRange) => {
    setRange(val);
    setPage(0);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", page, searchAction, resourceType, range],
    queryFn: () =>
      adminApi.auditLogs({
        page,
        size: 20,
        ...(searchAction ? { action: searchAction } : {}),
        ...(resourceType !== "ALL" ? { resourceType } : {}),
        ...range,
      }),
  });

  const payload: any = unwrap(data) || {};
  const rows: AuditLog[] = Array.isArray(payload) ? payload : payload.content || [];
  const totalPages = payload.totalPages || 0;

  const columns: Column<AuditLog>[] = [
    {
      key: "actor",
      header: "Người thực hiện",
      cell: (r) => (
        <div>
          <p className="font-medium text-black">{r.actorName || r.actorEmail || "Hệ thống"}</p>
          {r.actorEmail && <span className="font-mono text-xs text-zinc-500">{r.actorEmail}</span>}
        </div>
      ),
    },
    {
      key: "action",
      header: "Hành động",
      cell: (r) => <span className="font-mono text-xs font-bold text-black uppercase">{r.action}</span>,
    },
    {
      key: "resource",
      header: "Đối tượng",
      cell: (r) => (
        <div>
          <span className="inline-flex border border-black bg-zinc-100 px-2 py-0.5 text-[11px] font-bold">
            {r.resourceType}
          </span>
          {r.resourceId && <p className="font-mono text-xs text-zinc-500 mt-0.5">ID: {r.resourceId}</p>}
        </div>
      ),
    },
    {
      key: "detail",
      header: "Chi tiết",
      cell: (r) => (
        <span className="max-w-xs truncate block text-xs text-zinc-600 font-mono">
          {typeof r.detail === "object" ? JSON.stringify(r.detail) : r.detail || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Thời gian",
      cell: (r) => (
        <span className="text-xs font-mono text-zinc-500">
          {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "—"}
        </span>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black pb-5">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight flex items-center gap-2">
            <FileText size={26} /> Nhật ký hệ thống (Audit Logs)
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Truy xuất lịch sử thao tác, thay đổi dữ liệu và nhật ký truy cập (Chế độ chỉ đọc).
          </p>
        </div>

        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-black p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo hành động (VD: CREATE_PRODUCT)..."
            value={searchAction}
            onChange={(e) => handleSearchActionChange(e.target.value)}
            className="w-full border border-black pl-9 pr-3 py-2 text-sm rounded-none"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Loại tài nguyên:</span>
          <select
            value={resourceType}
            onChange={(e) => handleResourceTypeChange(e.target.value)}
            className="border border-black px-3 py-2 text-sm rounded-none bg-white"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        rowKey={(r) => r.id || Math.random()}
        empty="Chưa ghi nhận nhật ký thao tác nào."
      />
    </section>
  );
}
