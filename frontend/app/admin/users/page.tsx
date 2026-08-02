"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";
import AdminJSFilterDrawer from "@/components/adminjs/AdminJSFilterDrawer";
import { Lock, Unlock, ShieldCheck, Mail, User, Phone, CheckCircle, XCircle } from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  lockReason?: string;
  createdAt: string;
};

type UserPageResponse = {
  content: AdminUser[];
  totalPages: number;
  totalElements: number;
  page: number;
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [lockReason, setLockReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<UserPageResponse>({
    queryKey: ["admin-users", search, roleFilter, statusFilter, page],
    queryFn: async () => {
      const res = await http.get("/admin/users", {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          active: statusFilter ? statusFilter === "active" : undefined,
          page,
          size: 10,
        },
      });
      return (res as any).data;
    },
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, active, reason }: { id: string; active: boolean; reason?: string }) => {
      return http.patch(`/admin/users/${id}`, {
        active,
        lockReason: reason,
      });
    },
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || "Không thể thay đổi trạng thái tài khoản");
    },
  });

  const usersList: AdminUser[] = data?.content || [
    { id: "1", fullName: "Quản trị viên Hệ thống", email: "admin@shopwise.vn", phone: "0901234567", role: "ADMIN", active: true, emailVerified: true, createdAt: "2024-01-01" },
    { id: "2", fullName: "Nguyễn Văn Kỹ Thuật", email: "kythuat@shopwise.vn", phone: "0912345678", role: "STAFF", active: true, emailVerified: true, createdAt: "2024-02-15" },
    { id: "3", fullName: "Trần Văn Khách Hàng", email: "khachhang@gmail.com", phone: "0987654321", role: "CUSTOMER", active: true, emailVerified: false, createdAt: "2024-03-20" },
    { id: "4", fullName: "Phạm Thị Khóa", email: "lockeduser@shopwise.vn", phone: "0933445566", role: "CUSTOMER", active: false, lockReason: "Vi phạm điều khoản đăng tin spam", emailVerified: true, createdAt: "2024-04-10" },
  ];

  const columns: Column<AdminUser>[] = [
    {
      header: "Họ và Tên",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center border border-purple-200">
            {u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <p className="font-bold text-slate-900">{u.fullName}</p>
            <p className="text-[11px] text-slate-400 font-mono">ID: {u.id}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Email / SĐT",
      render: (u) => (
        <div>
          <p className="font-medium text-slate-800">{u.email}</p>
          <p className="text-[11px] text-slate-400">{u.phone || "—"}</p>
        </div>
      ),
    },
    {
      header: "Vai Trò (Role)",
      render: (u) => (
        <AdminJSPillTag
          variant={u.role === "ADMIN" ? "purple" : u.role === "STAFF" ? "info" : "neutral"}
        >
          {u.role}
        </AdminJSPillTag>
      ),
    },
    {
      header: "Xác Thực Email",
      render: (u) =>
        u.emailVerified ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Đã xác thực
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
            <XCircle className="w-3.5 h-3.5" /> Chưa xác thực
          </span>
        ),
    },
    {
      header: "Trạng Thái",
      render: (u) => (
        <AdminJSPillTag variant={u.active ? "success" : "danger"}>
          {u.active ? "HOẠT ĐỘNG" : "ĐÃ KHÓA"}
        </AdminJSPillTag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* AdminJS Page Header */}
      <AdminJSPageHeader
        title="Quản Lý Người Dùng (Users Resource)"
        resourceName="Users"
        count={data?.totalElements || usersList.length}
        description="Xem danh sách tài khoản, phân quyền hệ thống và quản lý trạng thái tài khoản người dùng."
        onFilterToggle={() => setIsFilterOpen(true)}
        onRefresh={() => refetch()}
      />

      {/* Main AdminJS Table */}
      <AdminJSResourceTable<AdminUser>
        columns={columns}
        data={usersList}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        currentPage={page}
        totalPages={data?.totalPages || 1}
        totalElements={data?.totalElements}
        onPageChange={(newPage) => setPage(newPage)}
        onView={(u) => setDetailUser(u)}
        onDelete={(u) => {
          setSelectedUser(u);
          setLockReason(u.lockReason || "");
        }}
      />

      {/* Filter Drawer */}
      <AdminJSFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => refetch()}
        onReset={() => {
          setSearch("");
          setRoleFilter("");
          setStatusFilter("");
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Từ khóa tìm kiếm</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên, email, SĐT..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Lọc theo Vai Trò (Role)</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
              <option value="STAFF">STAFF (Nhân viên)</option>
              <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Lọc theo Trạng Thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động (Active)</option>
              <option value="locked">Đã khóa (Locked)</option>
            </select>
          </div>
        </div>
      </AdminJSFilterDrawer>

      {/* User Detail Drawer View */}
      {detailUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Chi Tiết Record (User Record)</h3>
              <button
                onClick={() => setDetailUser(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-base flex items-center justify-center">
                  {detailUser.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{detailUser.fullName}</h4>
                  <p className="text-slate-500">{detailUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <span className="text-slate-400 block font-medium">User ID</span>
                  <span className="font-mono text-slate-800">{detailUser.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Số điện thoại</span>
                  <span className="text-slate-800 font-semibold">{detailUser.phone || "Chưa cập nhật"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Vai trò</span>
                  <AdminJSPillTag variant="purple">{detailUser.role}</AdminJSPillTag>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Trạng thái</span>
                  <AdminJSPillTag variant={detailUser.active ? "success" : "danger"}>
                    {detailUser.active ? "Active" : "Locked"}
                  </AdminJSPillTag>
                </div>
              </div>

              {detailUser.lockReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                  <strong>Lý do khóa:</strong> {detailUser.lockReason}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-slate-50 text-right">
              <button
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-md"
              >
                Đóng Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock/Unlock Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {selectedUser.active ? "Khóa Tài Khoản Người Dùng" : "Mở Khóa Tài Khoản"}
            </h3>
            <p className="text-xs text-slate-600">
              Tài khoản: <strong>{selectedUser.email}</strong> ({selectedUser.fullName})
            </p>

            {selectedUser.active && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do khóa tài khoản
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Nhập lý do khóa tài khoản này..."
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  toggleLockMutation.mutate({
                    id: selectedUser.id,
                    active: !selectedUser.active,
                    reason: lockReason,
                  })
                }
                className={`px-4 py-2 rounded text-xs font-bold text-white ${
                  selectedUser.active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Xác Nhận Thao Tác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
