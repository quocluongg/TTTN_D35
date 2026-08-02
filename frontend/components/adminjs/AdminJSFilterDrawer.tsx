"use client";

import { X, Filter, RotateCcw } from "lucide-react";

type AdminJSFilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset?: () => void;
  children: React.ReactNode;
  title?: string;
};

export default function AdminJSFilterDrawer({
  isOpen,
  onClose,
  onApply,
  onReset,
  children,
  title = "Bộ Lọc Tài Nguyên (Resource Filter)",
}: AdminJSFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-slate-700">
          {children}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt Lại (Reset)</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-md shadow-sm transition"
            >
              Áp Dụng Lọc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
