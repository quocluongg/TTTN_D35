"use client";

import { useQuery } from "@tanstack/react-query";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import type { Query } from "@/services/apiTypes";
import React from "react";

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
      return <span className="max-w-xs truncate block font-mono text-xs">{JSON.stringify(val)}</span>;
    } catch {
      return "—";
    }
  }

  return <span className="max-w-xs truncate block">{String(val)}</span>;
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
      cell: (row) => (
        <div className="flex items-center gap-2">
          {customActions && customActions(row)}
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="border border-black px-2 py-1 text-xs hover:bg-zinc-100"
            >
              Sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="border border-black bg-black text-white px-2 py-1 text-xs hover:bg-zinc-800"
            >
              Xóa
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {filter}
          {onCreate && (
            <button
              onClick={onCreate}
              className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 border border-black"
            >
              Thêm mới
            </button>
          )}
        </div>
      </div>

      {isError ? (
        <div className="border border-red-500 bg-red-50 dark:bg-red-950/40 p-5 text-red-800 dark:text-red-300 font-medium">
          Không thể tải dữ liệu. Hãy kiểm tra quyền truy cập hoặc API backend.
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
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 bg-white dark:bg-zinc-900 p-4 border border-black dark:border-zinc-800">
              <div>
                Hiển thị trang <strong className="text-black dark:text-white">{page + 1}</strong> / {totalPages} (Tổng <strong className="text-black dark:text-white">{totalElements}</strong> dòng)
              </div>
              <div className="flex items-center gap-2">
                <span>Hiển thị:</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="px-2 py-1 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white font-mono cursor-pointer outline-none text-xs"
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
