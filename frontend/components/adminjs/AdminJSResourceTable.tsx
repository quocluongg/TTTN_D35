"use client";

import React from "react";
import { Eye, Edit3, Trash2, Lock, ChevronLeft, ChevronRight } from "lucide-react";

export type Column<T> = {
  header: string;
  accessor?: keyof T;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
};

type AdminJSResourceTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onLock?: (item: T) => void;
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
};

export default function AdminJSResourceTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onLock,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: AdminJSResourceTableProps<T>) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl overflow-hidden shadow-xs transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F9FC] dark:bg-[#24303F] border-b border-[#E2E8F0] dark:border-[#2E3A47] text-[11px] font-extrabold uppercase text-[#64748B] dark:text-[#8A99AD] tracking-wider select-none">
              <th className="px-5 py-3.5 w-10 text-center">
                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-[#3C50E0] focus:ring-[#3C50E0]" />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-5 py-3.5 font-bold">
                  {col.header}
                </th>
              ))}
              {(onView || onEdit || onDelete || onLock) && (
                <th className="px-5 py-3.5 text-right font-bold">Hành Động</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47] text-xs text-[#1C2434] dark:text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-[#64748B] dark:text-[#8A99AD]">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-[#64748B] dark:text-[#8A99AD]">
                  Không tìm thấy bản ghi nào.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    className="hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] transition-colors group"
                  >
                    <td className="px-5 py-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-[#3C50E0] focus:ring-[#3C50E0]" />
                    </td>

                    {columns.map((col, idx) => (
                      <td key={idx} className="px-5 py-4">
                        {col.render
                          ? col.render(item)
                          : col.accessor
                          ? String(item[col.accessor] ?? "")
                          : null}
                      </td>
                    ))}

                    {(onView || onEdit || onDelete || onLock) && (
                      <td className="px-5 py-4 text-right space-x-1">
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            title="Xem chi tiết"
                            className="p-1.5 text-slate-500 hover:text-[#3C50E0] hover:bg-[#EFF4FB] dark:hover:bg-[#333A48] rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-slate-500 hover:text-[#3C50E0] hover:bg-[#EFF4FB] dark:hover:bg-[#333A48] rounded-md transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onLock && (
                          <button
                            onClick={() => onLock(item)}
                            title="Khóa / Mở khóa"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            title="Xóa bản ghi"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-[#F7F9FC] dark:bg-[#24303F] border-t border-[#E2E8F0] dark:border-[#2E3A47] flex items-center justify-between text-xs text-[#64748B] dark:text-[#8A99AD]">
        <div>
          Trang <strong className="text-[#1C2434] dark:text-white">{currentPage}</strong> / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="p-1.5 border border-[#E2E8F0] dark:border-[#2E3A47] bg-white dark:bg-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#F1F5F9] dark:hover:bg-[#333A48] transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            className="p-1.5 border border-[#E2E8F0] dark:border-[#2E3A47] bg-white dark:bg-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#F1F5F9] dark:hover:bg-[#333A48] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// TailAdmin Tag Component
export function AdminJSPillTag({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "purple" | "neutral";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    info: "bg-sky-50 text-[#3C50E0] dark:bg-sky-950/40 dark:text-[#80CAEE] border-sky-200 dark:border-sky-800",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase tracking-wider inline-block ${styles[variant]}`}>
      {children}
    </span>
  );
}
