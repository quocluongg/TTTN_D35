"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";

type RoleItem = {
  id: number;
  name: string;
  description: string;
  system: boolean;
  permissions: string[];
};

export default function AdminRolesPage() {
  const { data: roles, isLoading } = useQuery<RoleItem[]>({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await http.get("/admin/roles");
      return (res as any).data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Vai trò & Phân quyền</h1>
        <p className="text-sm text-slate-500">Xem danh sách vai trò và bảng ma trận quyền chi tiết của từng vai trò hệ thống.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 col-span-2">Đang tải danh sách vai trò...</div>
        ) : (
          roles?.map((role) => (
            <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                  <p className="text-xs text-slate-500">{role.description || "Vai trò hệ thống"}</p>
                </div>
                {role.system && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-full">
                    System Role
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Quyền được gán ({role.permissions.length}):</h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {role.permissions.map((p) => (
                    <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs border font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
