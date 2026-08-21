"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUserService } from "@/services/admin/adminUserService";
import StatusBadge from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Users,
  UserPlus,
  Lock,
  Unlock,
  Edit3,
  Search,
  RefreshCw,
} from "lucide-react";

type UserRow = Record<string, any>;

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả tài khoản" },
  { key: "ACTIVE", label: "🟢 Đang hoạt động" },
  { key: "LOCKED", label: "🔴 Đã bị khóa" },
  { key: "STAFF_ADMIN", label: "Quản trị & Nhân viên" },
  { key: "CUSTOMER", label: "Khách hàng" },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [lockConfirmItem, setLockConfirmItem] = useState<UserRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("STAFF");

  const usersQuery = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () => adminUserService.list({ size: 100 }),
  });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.content)) return res.content;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const rawUsers = extractArray(usersQuery.data);

  const filteredUsers = rawUsers.filter((user) => {
    const isLocked = user.isActive === false;
    let matchTab = true;

    if (selectedTab === "ACTIVE") matchTab = !isLocked;
    else if (selectedTab === "LOCKED") matchTab = isLocked;
    else if (selectedTab === "STAFF_ADMIN") matchTab = user.roleName === "ADMIN" || user.roleName === "STAFF";
    else if (selectedTab === "CUSTOMER") matchTab = user.roleName === "CUSTOMER";

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      user.fullName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.phoneNumber?.includes(q);

    return matchTab && matchQuery;
  });

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setPassword("");
    setRoleId("STAFF");
    setEditingUser(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminUserService.create(data),
    onSuccess: () => {
      notifySuccess("Tạo tài khoản quản trị thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể tạo tài khoản.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminUserService.update(id, data),
    onSuccess: () => {
      notifySuccess("Cập nhật thông tin người dùng thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật người dùng.");
    },
  });

  const lockMutation = useMutation({
    mutationFn: (user: UserRow) => {
      const nextActiveState = user.isActive === false;
      return adminUserService.lock(user.id, { isActive: nextActiveState });
    },
    onSuccess: (_, user) => {
      const actionText = user.isActive !== false ? "Khóa" : "Kích hoạt";
      notifySuccess(`${actionText} tài khoản thành công!`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setLockConfirmItem(null);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Thao tác khóa thất bại.");
    },
  });

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (row: UserRow) => {
    setEditingUser(row);
    setFullName(row.fullName || "");
    setEmail(row.email || "");
    setPhoneNumber(row.phoneNumber || "");
    setPassword("");
    setRoleId(row.roleName || "STAFF");
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: { fullName, phoneNumber, roleName: roleId },
      });
    } else {
      createMutation.mutate({ fullName, email, phoneNumber, password, roleName: roleId });
    }
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users size={24} className="text-zinc-700" /> Quản Lý Người Dùng & Phân Quyền
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Quản lý tài khoản khách hàng, nhân viên, phân quyền và giám sát trạng thái khóa / mở khóa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => usersQuery.refetch()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 shadow-xs transition-all"
          >
            <RefreshCw size={14} className={`text-zinc-500 ${usersQuery.isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus size={15} /> Tạo Tài Khoản Mới
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              let count = 0;
              if (tab.key === "ALL") count = rawUsers.length;
              else if (tab.key === "ACTIVE") count = rawUsers.filter((u) => u.isActive !== false).length;
              else if (tab.key === "LOCKED") count = rawUsers.filter((u) => u.isActive === false).length;
              else if (tab.key === "STAFF_ADMIN") count = rawUsers.filter((u) => u.roleName === "ADMIN" || u.roleName === "STAFF").length;
              else if (tab.key === "CUSTOMER") count = rawUsers.filter((u) => u.roleName === "CUSTOMER").length;

              const isActive = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                      isActive ? "bg-zinc-700 text-white" : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo Tên, Email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {usersQuery.isLoading ? (
          <div className="p-16 text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" /> Đang tải danh sách người dùng...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            Không tìm thấy người dùng phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
                  <th className="p-4">Người Dùng</th>
                  <th className="p-4">Số Điện Thoại</th>
                  <th className="p-4">Vai Trò</th>
                  <th className="p-4">Đăng Nhập Qua</th>
                  <th className="p-4 text-center">Trạng Thái Khóa</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map((user) => {
                  const isLocked = user.isActive === false;
                  const initialLetter = (user.fullName || user.email || "U").substring(0, 1).toUpperCase();

                  return (
                    <tr key={user.id} className={`hover:bg-zinc-50/80 transition-colors ${isLocked ? "bg-rose-50/20" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                            isLocked ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-700"
                          }`}>
                            {initialLetter}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 text-xs">{user.fullName || "—"}</p>
                            <p className="text-[11px] text-zinc-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-zinc-600">{user.phoneNumber || "—"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider border ${
                          user.roleName === "ADMIN"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : user.roleName === "STAFF"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-zinc-100 text-zinc-700 border-zinc-200"
                        }`}>
                          {user.roleName || "CUSTOMER"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-mono text-[10px]">
                          {user.authProvider || "LOCAL"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={isLocked ? "INACTIVE" : "ACTIVE"} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setLockConfirmItem(user)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isLocked
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                            {isLocked ? "Mở Khóa" : "Khóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
          <DialogContent className="max-w-md border border-zinc-200 rounded-3xl bg-white p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <UserPlus size={20} className="text-zinc-700" />
                {editingUser ? "Chỉnh Sửa Người Dùng" : "Tạo Tài Khoản"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Họ và tên *</label>
                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-zinc-200 px-3.5 py-2 text-xs bg-zinc-50 rounded-xl" />
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Email *</label>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-zinc-200 px-3.5 py-2 text-xs bg-zinc-50 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Mật khẩu *</label>
                    <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-zinc-200 px-3.5 py-2 text-xs bg-zinc-50 rounded-xl" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Số điện thoại</label>
                <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full border border-zinc-200 px-3.5 py-2 text-xs bg-zinc-50 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Vai trò</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full border border-zinc-200 px-3.5 py-2 text-xs bg-zinc-50 rounded-xl">
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-zinc-600 rounded-xl border border-zinc-200 hover:bg-zinc-50">Hủy</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50">Xác nhận</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!lockConfirmItem}
        onOpenChange={(v) => !v && setLockConfirmItem(null)}
        title={lockConfirmItem?.isActive !== false ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
        description={`Xác nhận thực hiện hành động này cho tài khoản "${lockConfirmItem?.fullName || lockConfirmItem?.email}"?`}
        onConfirm={() => lockConfirmItem && lockMutation.mutate(lockConfirmItem)}
        isLoading={lockMutation.isPending}
      />
    </div>
  );
}
