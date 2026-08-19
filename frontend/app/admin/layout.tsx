"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Boxes, 
  FileText, 
  FolderTree, 
  Gauge, 
  LayoutTemplate, 
  Menu, 
  PackageSearch, 
  ReceiptText, 
  Settings, 
  ShieldCheck, 
  Tags, 
  Users, 
  Warehouse, 
  X, 
  Brain 
} from "lucide-react";
import { useState } from "react";

const nav = [
  ["/admin", "Tổng quan", Gauge],
  ["/admin/products", "Sản phẩm", PackageSearch],
  ["/admin/categories", "Danh mục", FolderTree],
  ["/admin/promotions", "Khuyến mãi", Tags],
  ["/admin/orders", "Đơn hàng", ReceiptText],
  ["/admin/users", "Người dùng", Users],
  ["/admin/roles", "Vai trò", ShieldCheck],
  ["/admin/inventory", "Kho hàng", Warehouse],
  ["/admin/news", "Tin tức", FileText],
  ["/admin/warranties", "Bảo hành", Boxes],
  ["/admin/cms", "Homepage CMS", LayoutTemplate],
  ["/admin/reports", "Báo cáo", BarChart3],
  ["/admin/settings", "Cấu hình", Settings],
  ["/admin/audit-logs", "Audit logs", FileText],
  ["/admin/ai-management", "RAG / AI", Brain],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <aside className="h-full w-64 border-r border-black bg-white p-4">
      <div className="mb-8 flex items-center justify-between border-b border-black pb-4">
        <Link href="/admin" className="text-xl font-medium tracking-tight">
          SHOPWISE / ADMIN
        </Link>
        <button className="lg:hidden" onClick={() => setOpen(false)}>
          <X />
        </button>
      </div>

      <nav className="space-y-1">
        {nav.map(([href, label, Icon]) => {
          const isActive = path === href || (href !== "/admin" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-black text-white" : "hover:bg-zinc-100"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-black">
      <div className="hidden fixed inset-y-0 left-0 z-30 lg:block">{sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      )}

      <main className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black bg-white px-5">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <p className="text-sm font-medium uppercase tracking-wider">
            {path.split("/").filter(Boolean).join(" / ")}
          </p>
          <Link className="ml-auto text-sm underline" href="/">
            Xem cửa hàng
          </Link>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
