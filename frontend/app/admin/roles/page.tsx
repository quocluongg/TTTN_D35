"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { notifyError, notifySuccess } from "@/components/Notify";
import { ShieldCheck, CheckSquare, Square, Save } from "lucide-react";

interface Permission {
  id?: string;
  code: string;
  name: string;
  group?: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions?: Permission[] | string[];
}

const PERMISSION_GROUPS: Record<string, { label: string; icon: string; prefixes: string[] }> = {
  PRODUCT: { label: "Sản phẩm", icon: "📦", prefixes: ["PRODUCT_"] },
  CATEGORY: { label: "Danh mục", icon: "🏷️", prefixes: ["CATEGORY_"] },
  PROMOTION: { label: "Khuyến mãi", icon: "🎯", prefixes: ["CAMPAIGN_", "VOUCHER_"] },
  ORDER: { label: "Đơn hàng", icon: "📋", prefixes: ["ORDER_"] },
  USER: { label: "Người dùng", icon: "👥", prefixes: ["USER_"] },
  ROLE: { label: "Vai trò & Quyền", icon: "🔐", prefixes: ["ROLE_"] },
  REPORT: { label: "Báo cáo", icon: "📊", prefixes: ["REPORT_"] },
  NEWS: { label: "Tin tức", icon: "📰", prefixes: ["NEWS_"] },
  SYSTEM: { label: "Hệ thống", icon: "🔧", prefixes: ["SYSTEM_CONFIG_"] },
  CMS: { label: "Homepage CMS", icon: "🏠", prefixes: ["HOMEPAGE_"] },
  INVENTORY: { label: "Kho hàng", icon: "📦", prefixes: ["INVENTORY_"] },
  WARRANTY: { label: "Bảo hành", icon: "🛡️", prefixes: ["WARRANTY_"] },
  AUDIT: { label: "Audit Log", icon: "📝", prefixes: ["AUDIT_"] },
};

const getPermissionGroup = (code: string): string => {
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    if (group.prefixes.some((p) => code.startsWith(p))) {
      return key;
    }
  }
  return "OTHER";
};

const unwrap = (x: any) => x?.data ?? x;

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Fetch Roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => adminApi.roles.list(),
  });

  // Fetch All Available Permissions
  const { data: permissionsData } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () => adminApi.roles.permissions(),
  });

  const roles: Role[] = unwrap(rolesData) || [];
  const rawPermissions = unwrap(permissionsData) || [];
  const allPermissions: Permission[] = Array.isArray(rawPermissions)
    ? rawPermissions.map((p) => (typeof p === "string" ? { code: p, name: p } : p))
    : [];

  // Group permissions for matrix display
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const groupKey = perm.group || getPermissionGroup(perm.code);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      adminApi.roles.updatePermissions(roleId, { permissions }),
    onSuccess: () => {
      notifySuccess("Cập nhật quyền thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật quyền.");
    },
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.id);
    const permCodes = new Set<string>();
    if (Array.isArray(role.permissions)) {
      role.permissions.forEach((p) => {
        permCodes.add(typeof p === "string" ? p : p.code);
      });
    }
    setSelectedPermissions(permCodes);
  };

  const togglePermission = (code: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedPermissions(next);
  };

  const toggleGroup = (groupPerms: Permission[]) => {
    const allCodes = groupPerms.map((p) => p.code);
    const hasAll = allCodes.every((c) => selectedPermissions.has(c));
    const next = new Set(selectedPermissions);

    if (hasAll) {
      allCodes.forEach((c) => next.delete(c));
    } else {
      allCodes.forEach((c) => next.add(c));
    }
    setSelectedPermissions(next);
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissions: Array.from(selectedPermissions),
    });
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Tên vai trò",
      cell: (row) => (
        <div>
          <p className="font-medium text-black">{row.name}</p>
          <span className="text-xs text-zinc-500 font-mono">{row.code}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      cell: (row) => <span className="text-sm text-zinc-600">{row.description || "—"}</span>,
    },
    {
      key: "permissionsCount",
      header: "Số lượng quyền",
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 border border-black text-xs font-medium">
          {Array.isArray(row.permissions) ? row.permissions.length : 0} quyền
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (row) => (
        <button
          onClick={() => handleSelectRole(row)}
          className={`border px-3 py-1.5 text-xs font-medium rounded-none transition-colors ${
            selectedRoleId === row.id
              ? "bg-black text-white border-black"
              : "border-black bg-white text-black hover:bg-zinc-100"
          }`}
        >
          {selectedRoleId === row.id ? "Đang chỉnh sửa" : "Phân quyền"}
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-8">
      <div className="border-b border-black pb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Vai trò & Phân quyền</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Quản lý danh sách vai trò và thiết lập ma trận phân quyền chi tiết cho nhân viên.
        </p>
      </div>

      {/* Roles List Table */}
      <div className="space-y-3">
        <h2 className="text-xl font-medium flex items-center gap-2">
          <ShieldCheck size={20} /> Danh sách vai trò
        </h2>
        <DataTable
          columns={columns}
          rows={roles}
          loading={rolesLoading}
          rowKey={(row) => row.id}
          empty="Chưa có vai trò nào."
        />
      </div>

      {/* Permission Matrix Grid */}
      {selectedRole && (
        <div className="border border-black bg-white p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
            <div>
              <h3 className="text-xl font-medium">
                Cấu hình quyền cho: <span className="underline">{selectedRole.name}</span>
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">Code: {selectedRole.code}</p>
            </div>
            <button
              onClick={handleSavePermissions}
              disabled={updatePermissionsMutation.isPending}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-sm font-medium rounded-none hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save size={16} />
              {updatePermissionsMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedPermissions).map(([groupKey, groupPerms]) => {
              const meta = PERMISSION_GROUPS[groupKey] || {
                label: groupKey,
                icon: "⚡",
              };
              const groupCodes = groupPerms.map((p) => p.code);
              const isAllSelected = groupCodes.every((c) => selectedPermissions.has(c));

              return (
                <div key={groupKey} className="border border-black p-4 space-y-3 bg-zinc-50/50">
                  <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <span>{meta.icon}</span> {meta.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupPerms)}
                      className="text-xs underline text-zinc-600 hover:text-black font-medium"
                    >
                      {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {groupPerms.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.code);
                      return (
                        <label
                          key={perm.code}
                          onClick={() => togglePermission(perm.code)}
                          className="flex items-start gap-2.5 cursor-pointer text-xs p-1.5 hover:bg-zinc-100 rounded-none transition-colors"
                        >
                          <button type="button" className="mt-0.5 shrink-0 text-black">
                            {isChecked ? (
                              <CheckSquare size={16} className="fill-black text-white" />
                            ) : (
                              <Square size={16} className="text-zinc-400" />
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-zinc-900">{perm.name || perm.code}</p>
                            <span className="font-mono text-[10px] text-zinc-500">{perm.code}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
