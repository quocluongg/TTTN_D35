"use client";

import Link from "next/link";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { useTailAdminTheme } from "./TailAdminThemeProvider";
import {
  Search,
  ExternalLink,
  LogOut,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  Menu,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminJSHeader() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, toggleSidebar } = useTailAdminTheme();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/admin/products?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#2E3A47] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors">
      {/* Left Section: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-[#333A48] rounded-lg transition"
          title="Thu gọn / Mở rộng Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative w-64 md:w-80 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search resources..."
            className="w-full bg-[#F1F5F9] dark:bg-[#10172A] border border-transparent focus:border-[#3C50E0] text-xs text-[#1C2434] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg pl-9 pr-4 py-2 focus:outline-none transition"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#3C50E0] dark:text-[#80CAEE] hover:underline font-semibold bg-[#EFF4FB] dark:bg-[#24303F] px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2E3A47]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Live Storefront</span>
        </Link>

        {/* Dark Mode Toggle Switcher Button */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? "Chuyển sang Giao diện Sáng (Light)" : "Chuyển sang Giao diện Tối (Dark)"}
          className="p-2 rounded-full bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] text-slate-600 dark:text-amber-400 hover:text-[#3C50E0] transition"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Icon */}
        <button className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-[#333A48] rounded-full transition hidden sm:block">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-[#1E293B]" />
        </button>

        {/* Messages Icon */}
        <button className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-[#333A48] rounded-full transition hidden sm:block">
          <MessageSquare className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#3C50E0] absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-[#1E293B]" />
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 border-l border-[#E2E8F0] dark:border-[#2E3A47] pl-3 md:pl-4">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-[#3C50E0] text-white font-bold text-sm flex items-center justify-center border-2 border-white dark:border-[#24303F] shadow-xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-[#1C2434] dark:text-white block tracking-tight">
                {user?.fullName || "Quản trị viên"}
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#8A99AD] font-medium block">
                {user?.role || "Administrator"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
