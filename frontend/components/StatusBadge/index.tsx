import React from "react";

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  COMPLETED: { label: "HOÀN TẤT", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DELIVERED: { label: "ĐÃ GIAO", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SHIPPED: { label: "ĐANG GIAO", style: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  SHIPPING: { label: "ĐANG GIAO", style: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  PROCESSING: { label: "ĐANG XỬ LÝ", style: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { label: "ĐÃ XÁC NHẬN", style: "bg-blue-50 text-blue-700 border-blue-200" },
  PENDING: { label: "CHỜ XỬ LÝ", style: "bg-amber-50 text-amber-700 border-amber-200" },
  CANCELLED: { label: "ĐÃ HỦY", style: "bg-rose-50 text-rose-700 border-rose-200" },
  ACTIVE: { label: "HOẠT ĐỘNG", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PUBLISHED: { label: "ĐÃ XUẤT BẢN", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  INACTIVE: { label: "ĐÃ KHÓA", style: "bg-rose-50 text-rose-700 border-rose-200" },
  DRAFT: { label: "BẢN NHÁP", style: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  LOCKED: { label: "ĐÃ KHÓA", style: "bg-rose-50 text-rose-700 border-rose-200" },
  PAID: { label: "ĐÃ THANH TOÁN", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UNPAID: { label: "CHƯA THANH TOÁN", style: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function StatusBadge({ status }: { status?: string | null }) {
  const value = (status || "UNKNOWN").toUpperCase();
  const config = STATUS_CONFIG[value] || { label: value, style: "bg-zinc-100 text-zinc-700 border-zinc-200" };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${config.style}`}
    >
      {config.label}
    </span>
  );
}

