"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import { AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";

type RoleItem = {
  id: number;
  name: string;
  description: string;
  system: boolean;
  permissions: string[];
};

export default function AdminRolesPage() {
  const { data: roles, isLoading, refetch } = useQuery<RoleItem[]>({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await http.get("/admin/roles");
      return (res as any).data;
    },
  });

  const MOCK_ROLES: RoleItem[] = roles || [
    {
      id: 1,
      name: "ADMIN",
      description: "Quản trị viên toàn quyền hệ thống ShopWise",
      system: true,
      permissions: ["USER_MANAGEMENT", "PRODUCT_WRITE", "ORDER_MANAGEMENT", "INVENTORY_WRITE", "SYSTEM_CONFIG", "RAG_ADMIN"],
    },
    {
      id: 2,
      name: "STAFF",
      description: "Nhân viên vận hành, đơn hàng và hỗ trợ khách hàng",
      system: true,
      permissions: ["PRODUCT_READ", "ORDER_MANAGEMENT", "INVENTORY_READ", "WARRANTY_UPDATE"],
    },
    {
      id: 3,
      name: "CUSTOMER",
      description: "Tài khoản người mua hàng",
      system: false,
      permissions: ["PROFILE_READ", "ORDER_CREATE", "REVIEW_WRITE"],
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Quản Lý Vai Trò & Phân Quyền (Roles Resource)"
        resourceName="Roles"
        count={MOCK_ROLES.length}
        description="Xem danh sách vai trò hệ thống và ma trận phân quyền truy cập chức năng."
        onRefresh={() => refetch()}
        onAddNew={() => alert("Thêm vai trò mới (New Role Action)")}
        addNewLabel="Tạo Vai Trò Mới"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_ROLES.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{role.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
              </div>
              {role.system && <AdminJSPillTag variant="purple">SYSTEM ROLE</AdminJSPillTag>}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Danh Sách Quyền Được Gán ({role.permissions.length}):
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[11px] font-mono border border-slate-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
