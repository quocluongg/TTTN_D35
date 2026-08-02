"use client";

import AdminJSSidebar from "./AdminJSSidebar";
import AdminJSHeader from "./AdminJSHeader";
import { TailAdminThemeProvider } from "./TailAdminThemeProvider";

export default function AdminJSLayout({ children }: { children: React.ReactNode }) {
  return (
    <TailAdminThemeProvider>
      <div className="min-h-screen flex bg-[#F1F5F9] dark:bg-[#10172A] text-[#1C2434] dark:text-[#8A99AD] font-sans transition-colors">
        {/* TailAdmin Collapsible Sidebar */}
        <AdminJSSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* TailAdmin Header */}
          <AdminJSHeader />

          {/* Content Body */}
          <main className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TailAdminThemeProvider>
  );
}
