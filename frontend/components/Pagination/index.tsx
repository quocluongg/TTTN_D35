"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { 
  page: number; 
  totalPages: number; 
  onChange: (page: number) => void 
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => Math.max(0, Math.min(page - 2, totalPages - 5)) + i);

  return (
    <nav className="flex items-center gap-1.5 justify-end pt-2" aria-label="Pagination">
      <button 
        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors" 
        disabled={page === 0} 
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16}/>
      </button>

      {pages.map((item) => (
        <button 
          key={item} 
          onClick={() => onChange(item)} 
          className={`min-w-8 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all ${
            item === page 
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs" 
              : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          {item + 1}
        </button>
      ))}

      <button 
        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors" 
        disabled={page >= totalPages - 1} 
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={16}/>
      </button>
    </nav>
  );
}
