"use client";

import type { ReactNode } from "react";
import Pagination from "@/components/Pagination";

export type Column<T> = { 
  key: string; 
  header: string; 
  cell: (row: T) => ReactNode; 
  className?: string 
};

type Props<T> = { 
  columns: Column<T>[]; 
  rows: T[]; 
  loading?: boolean; 
  empty?: string; 
  page?: number; 
  totalPages?: number; 
  onPageChange?: (page: number) => void; 
  rowKey: (row: T) => string | number 
};

export default function DataTable<T>({ 
  columns, 
  rows, 
  loading, 
  empty = "Chưa có dữ liệu.", 
  page = 0, 
  totalPages = 0, 
  onPageChange, 
  rowKey 
}: Props<T>) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 uppercase font-bold text-[11px] tracking-wider text-zinc-500">
            <tr>
              {columns.map((col) => (
                <th className={`px-4 py-3.5 ${col.className || ""}`} key={col.key}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-sans">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <tr 
                  key={rowKey(row)} 
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td className="px-4 py-3.5 text-zinc-900 dark:text-zinc-100" key={col.key}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-12 text-center text-zinc-400 font-medium text-xs" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}
