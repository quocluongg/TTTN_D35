"use client";
import type { ReactNode } from "react";
import Pagination from "@/components/Pagination";
export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; className?: string };
type Props<T> = { columns: Column<T>[]; rows: T[]; loading?: boolean; empty?: string; page?: number; totalPages?: number; onPageChange?: (page: number) => void; rowKey: (row: T) => string | number };
export default function DataTable<T>({ columns, rows, loading, empty = "Chưa có dữ liệu.", page = 0, totalPages = 0, onPageChange, rowKey }: Props<T>) {
 return <><div className="overflow-x-auto border border-black"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-black bg-zinc-100"><tr>{columns.map((col) => <th className={`px-4 py-3 font-bold ${col.className || ""}`} key={col.key}>{col.header}</th>)}</tr></thead><tbody>{loading ? Array.from({length: 5}).map((_, i) => <tr key={i} className="border-b border-zinc-200">{columns.map((col) => <td key={col.key} className="px-4 py-4"><div className="h-4 w-24 animate-pulse bg-zinc-200"/></td>)}</tr>) : rows.length ? rows.map((row) => <tr key={rowKey(row)} className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50">{columns.map((col) => <td className="px-4 py-3" key={col.key}>{col.cell(row)}</td>)}</tr>) : <tr><td className="px-4 py-10 text-center text-zinc-500" colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div>{onPageChange && <Pagination page={page} totalPages={totalPages} onChange={onPageChange}/>}</>;
}
