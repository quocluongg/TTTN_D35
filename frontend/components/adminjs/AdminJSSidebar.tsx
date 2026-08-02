"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTailAdminTheme } from "./TailAdminThemeProvider";
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  ShoppingCart,
  Boxes,
  ShieldCheck,
  Users,
  KeyRound,
  Newspaper,
  Percent,
  Bot,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Database,
  Server
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: any;
  badge?: string;
};

type NavGroup = {
  groupName: string;
  items: NavItem[];
};

const navigationGroups: NavGroup[] = [
  {
    groupName: "MENU CHÍNH",
    items: [
      { label: "Dashboard Analytics", href: "/admin", icon: LayoutDashboard }
    ]
  },
  {
    groupName: "SẢN PHẨM & DANH MỤC",
    items: [
      { label: "Quản Lý Sản Phẩm", href: "/admin/products", icon: Package },
      { label: "Danh Mục Sản Phẩm", href: "/admin/categories", icon: Layers },
      { label: "Thương Hiệu Đối Tác", href: "/admin/brands", icon: Tag }
    ]
  },
  {
    groupName: "ĐƠN HÀNG & BẢO HÀNH",
    items: [
      { label: "Quản Lý Đơn Hàng", href: "/admin/orders", icon: ShoppingCart },
      { label: "Tồn Kho & Kiểm Kê", href: "/admin/inventory", icon: Boxes },
      { label: "Phiếu Bảo Hành", href: "/admin/warranties", icon: ShieldCheck }
    ]
  },
  {
    groupName: "TÀI KHOẢN & PHÂN QUYỀN",
    items: [
      { label: "Quản Lý Người Dùng", href: "/admin/users", icon: Users },
      { label: "Vai Trò & Quyền Hạn", href: "/admin/roles", icon: KeyRound }
    ]
  },
  {
    groupName: "TIN TỨC & KHUYẾN MÃI",
    items: [
      { label: "Chương Trình Khuyến Mãi", href: "/admin/promotions", icon: Percent },
      { label: "Bài Viết & Tin Tức", href: "/admin/news", icon: Newspaper }
    ]
  },
  {
    groupName: "QUẢN LÝ DỮ LIỆU & PIPELINE",
    items: [
      { label: "Quản Lý Dữ Liệu Data", href: "/admin/data", icon: Database, badge: "NEW" },
      { label: "Live Crawler & Ingest", href: "/admin/operations", icon: Server }
    ]
  },
  {
    groupName: "HỆ THỐNG & AI ENGINE",
    items: [
      { label: "AI RAG Console", href: "/admin/rag", icon: Bot, badge: "PRO" },
      { label: "Báo Cáo Doanh Thu", href: "/admin/reports/business", icon: BarChart3 },
      { label: "Nhật Ký Audit Logs", href: "/admin/audit-logs", icon: FileText },
      { label: "Cấu Hình Hệ Thống", href: "/admin/system-config", icon: Settings }
    ]
  }
];

export default function AdminJSSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useTailAdminTheme();

  return (
    <aside
      className={`bg-white dark:bg-[#1C2434] text-[#1C2434] dark:text-slate-300 flex flex-col border-r border-[#E2E8F0] dark:border-[#2E3A47] shrink-0 h-screen sticky top-0 transition-all duration-300 z-40 select-none ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 p-4 border-b border-[#E2E8F0] dark:border-[#2E3A47] flex items-center justify-between bg-white dark:bg-[#1C2434]">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3C50E0] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#3C50E0]/30 shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <span className="font-extrabold text-[#1C2434] dark:text-white text-lg tracking-tight block">TailAdmin</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase block -mt-1">
                ShopWise Portal
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button */}
        <button
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#1C2434] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] transition border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2E3A47]"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Resource Navigation */}
      <nav className="p-3 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
        {navigationGroups.map((group) => (
          <div key={group.groupName}>
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">
                {group.groupName}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                      active
                        ? "bg-[#3C50E0] text-white shadow-md shadow-[#3C50E0]/30"
                        : "text-[#64748B] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-[#333A48] hover:text-[#1C2434] dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? "text-white"
                            : "text-[#64748B] dark:text-slate-400 group-hover:text-[#1C2434] dark:group-hover:text-white"
                        }`}
                      />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isSidebarCollapsed && item.badge && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#80CAEE] text-[#1C2434]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer info */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] bg-white dark:bg-[#1C2434] text-center text-[11px] text-slate-500 dark:text-slate-400">
          TailAdmin UI Engine <strong className="text-[#1C2434] dark:text-white">v2.1</strong>
        </div>
      )}
    </aside>
  );
}
