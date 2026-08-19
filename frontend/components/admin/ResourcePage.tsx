"use client";

import { useQuery } from "@tanstack/react-query";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import type { Query } from "@/services/apiTypes";
import React from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";

type Row = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  queryKey: string;
  fetcher: (params?: Query) => Promise<unknown>;
  fields: { key: string; label: string }[];
  filter?: React.ReactNode;
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => void;
  onCreate?: () => void;
  customActions?: (row: Row) => React.ReactNode;
};

const formatValue = (key: string, val: unknown): React.ReactNode => {
  if (val == null) return "—";
  
  if (typeof val === "boolean") {
    return <StatusBadge status={val ? "ACTIVE" : "INACTIVE"} />;
  }

  if (key.toLowerCase().includes("status")) {
    return <StatusBadge status={String(val)} />;
  }

  if (key.toLowerCase().includes("price") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("total") || key.toLowerCase().includes("revenue")) {
    const num = Number(val);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("vi-VN").format(num) + "đ";
    }
  }

  if (typeof val === "object") {
    if (React.isValidElement(val)) return val;
    try {
      return <span className="max-w-xs truncate block font-mono text-xs text-zinc-500">{JSON.stringify(val)}</span>;
    } catch {
      return "—";
    }
  }

  return <span className="max-w-xs truncate block text-xs text-zinc-800 dark:text-zinc-200">{String(val)}</span>;
};

export default function ResourcePage({
  title,
  description,
  queryKey,
  fetcher,
  fields,
  filter,
  onEdit,
  onDelete,
  onCreate,
  customActions,
}: Props) {
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, page, size],
    queryFn: () => fetcher({ page, size }),
  });

  const payload: any = (data as any)?.data ?? data ?? {};
  
  // Extract content rows correctly for PageResponse
  const rows: Row[] = Array.isArray(payload)
    ? payload
    : payload?.items || payload?.content || [];

  const totalPages = payload?.pagination?.totalPages ?? payload?.totalPages ?? 1;
  const totalElements = payload?.pagination?.totalItems ?? payload?.totalElements ?? rows.length;

  const columns: Column<Row>[] = fields.map((field) => ({
    key: field.key,
    header: field.label,
    cell: (row) => formatValue(field.key, row[field.key]),
  }));

  // Append actions column if callbacks are provided
  if (onEdit || onDelete || customActions) {
    columns.push({
      key: "resource-actions",
      header: "Thao tác",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {customActions && customActions(row)}
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <section className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {filter}
          {onCreate && (
            <button
              onClick={onCreate}
              className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus size={14} /> Thêm mới
            </button>
          )}
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 p-5 text-red-700 dark:text-red-300 text-xs font-semibold">
          Không thể tải dữ liệu. Hãy kiểm tra quyền truy cập hoặc kết nối API backend.
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={rows}
            loading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            rowKey={(row) => String(row.id ?? row.key ?? row.code ?? Math.random())}
          />
          {!isLoading && rows.length > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-xs">
              <div>
                Trang <strong className="text-zinc-900 dark:text-white font-mono">{page + 1}</strong> / {totalPages} (Tổng <strong className="text-zinc-900 dark:text-white font-mono">{totalElements}</strong> kết quả)
              </div>
              <div className="flex items-center gap-2">
                <span>Hiển thị:</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono cursor-pointer outline-none text-xs"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                  <option value={100}>100 / trang</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
