"use client";

import { Plus, Filter, RefreshCw, ChevronRight } from "lucide-react";

type ActionButton = {
  label: string;
  onClick: () => void;
  icon?: any;
};

type AdminJSPageHeaderProps = {
  title: string;
  resourceName?: string;
  count?: number;
  description?: string;
  onFilterToggle?: () => void;
  onRefresh?: () => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  customActions?: ActionButton[];
};

export default function AdminJSPageHeader({
  title,
  resourceName,
  count,
  description,
  onFilterToggle,
  onRefresh,
  onAddNew,
  addNewLabel = "Tạo Mới (New)",
  customActions = [],
}: AdminJSPageHeaderProps) {
  return (
    <div className="mb-6 bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#8A99AD] font-semibold mb-1">
          <span>TailAdmin</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span>Dashboard</span>
          {resourceName && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#3C50E0] dark:text-[#80CAEE] font-bold">{resourceName}</span>
            </>
          )}
        </div>

        {/* Title & Count */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1C2434] dark:text-white tracking-tight">{title}</h1>
          {typeof count === "number" && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#EFF4FB] dark:bg-[#24303F] text-[#3C50E0] dark:text-[#80CAEE] border border-[#E2E8F0] dark:border-[#2E3A47]">
              {count} records
            </span>
          )}
        </div>
        {description && <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">{description}</p>}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {onFilterToggle && (
          <button
            onClick={onFilterToggle}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1C2434] dark:text-slate-200 bg-[#F1F5F9] dark:bg-[#24303F] hover:bg-slate-200 dark:hover:bg-[#333A48] rounded-lg border border-[#E2E8F0] dark:border-[#2E3A47] transition"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ Lọc (Filter)</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1C2434] dark:text-slate-200 bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] rounded-lg border border-[#E2E8F0] dark:border-[#2E3A47] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải Lại</span>
          </button>
        )}

        {customActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1C2434] dark:text-slate-200 bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] rounded-lg border border-[#E2E8F0] dark:border-[#2E3A47] transition"
          >
            {action.icon && <action.icon className="w-3.5 h-3.5" />}
            <span>{action.label}</span>
          </button>
        ))}

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#3C50E0] hover:bg-[#3C50E0]/90 rounded-lg shadow-sm shadow-[#3C50E0]/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{addNewLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
