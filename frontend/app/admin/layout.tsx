"use client";

import AdminJSLayout from "@/components/adminjs/AdminJSLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminJSLayout>{children}</AdminJSLayout>;
}
