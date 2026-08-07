"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
type Props = { page: number; totalPages: number; onChange: (page: number) => void };
export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => Math.max(0, Math.min(page - 2, totalPages - 5)) + i);
  return <nav className="mt-6 flex items-center gap-1" aria-label="Pagination">
    <button className="border border-black p-2 disabled:opacity-30 rounded-none" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={16}/></button>
    {pages.map((item) => <button key={item} onClick={() => onChange(item)} className={`min-w-9 border border-black px-3 py-2 text-sm rounded-none ${item === page ? "bg-black text-white" : "bg-white"}`}>{item + 1}</button>)}
    <button className="border border-black p-2 disabled:opacity-30 rounded-none" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}><ChevronRight size={16}/></button>
  </nav>;
}
