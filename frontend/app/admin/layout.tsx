"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

const menuItems = [
  { label: "Tổng quan", href: "/admin" },
  { label: "Người dùng", href: "/admin/users" },
  { label: "Vai trò & Quyền", href: "/admin/roles" },
  { label: "Sản phẩm", href: "/admin/products" },
  { label: "Tồn kho", href: "/admin/inventory" },
  { label: "Đơn hàng", href: "/admin/orders" },
  { label: "Khuyến mãi", href: "/admin/promotions" },
  { label: "Bảo hành", href: "/admin/warranties" },
  { label: "Tin tức", href: "/admin/news" },
  { label: "Trợ lý AI (RAG)", href: "/admin/rag" },
  { label: "Báo cáo Người dùng", href: "/admin/reports/users" },
  { label: "Báo cáo Kinh doanh", href: "/admin/reports/business" },
  { label: "Cấu hình Hệ thống", href: "/admin/system-config" },
  { label: "Nhật ký Hệ thống", href: "/admin/audit-logs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-lg">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
              SW
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide">ShopWise</h1>
              <p className="text-xs text-slate-400">Admin & Staff Portal</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName || "Quản trị viên"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || "admin@shopwise.vn"}</p>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold px-2 py-1 bg-slate-800 hover:bg-red-600 text-slate-200 rounded transition"
          >
            Thoát
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
          <h2 className="text-lg font-semibold text-slate-800">
            Hệ thống Quản trị & Vận hành ShopWise
          </h2>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Role: {user?.role || "ADMIN"}
            </span>
            <Link
              href="/"
              target="_blank"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Về Trang Khách Hàng ↗
            </Link>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
