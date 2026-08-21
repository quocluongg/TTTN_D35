"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminUserService } from "@/services/admin/adminUserService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import ConfirmDialog from "@/components/ConfirmDialog";

type UserRow = Record<string, any>;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [lockConfirmItem, setLockConfirmItem] = useState<UserRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // Form states for creating/editing staff/admin accounts
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("STAFF");

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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

  const customUserActions = (row: UserRow) => (
    <button
      onClick={() => setLockConfirmItem(row)}
      className={`border px-2 py-1 text-xs font-semibold ${
        row.isActive !== false
          ? "border-red-600 text-red-600 hover:bg-red-50"
          : "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
      }`}
    >
      {row.isActive !== false ? "Khóa" : "Kích hoạt"}
    </button>
  );

  return (
    <div className="space-y-6">
      <ResourcePage
        title="Quản lý Người dùng"
        description="Quản lý thông tin tài khoản, vai trò và trạng thái khóa/mở khóa của toàn bộ người dùng trong hệ thống."
        queryKey="admin-users"
        fetcher={adminUserService.list}
        fields={[
          { key: "fullName", label: "Họ và tên" },
          { key: "email", label: "Email" },
          { key: "phoneNumber", label: "Số điện thoại" },
          { key: "roleName", label: "Vai trò" },
          { key: "authProvider", label: "Đăng nhập qua" },
          { key: "isActive", label: "Trạng thái" },
        ]}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        customActions={customUserActions}
      />

      {/* Create/Edit Staff Modal */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
          <DialogContent className="max-w-md border-2 border-black bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider">
                {editingUser ? "Chỉnh sửa người dùng" : "Tạo tài khoản mới"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">
                Họ và tên <span className="text-red-500">*</span>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </label>

              {!editingUser && (
                <>
                  <label className="block text-sm font-semibold">
                    Email <span className="text-red-500">*</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      placeholder="email@shopwise.com"
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      placeholder="Mật khẩu"
                    />
                  </label>
                </>
              )}

              <label className="block text-sm font-semibold">
                Số điện thoại
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="09xxxxxxxx"
                />
              </label>

              <label className="block text-sm font-semibold">
                Vai trò hệ thống
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                >
                  <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
                  <option value="STAFF">STAFF (Nhân viên vận hành)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên tối cao)</option>
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-black px-4 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Lock Confirmation */}
      <ConfirmDialog
        open={!!lockConfirmItem}
        onOpenChange={(v) => !v && setLockConfirmItem(null)}
        title={lockConfirmItem?.isActive !== false ? "Khóa tài khoản người dùng?" : "Kích hoạt lại tài khoản?"}
        description={`Hành động này sẽ ${
          lockConfirmItem?.isActive !== false ? "chặn truy cập" : "mở khóa quyền truy cập"
        } của người dùng "${lockConfirmItem?.fullName}" (${lockConfirmItem?.email}) trên hệ thống.`}
        confirmText="Xác nhận"
        onConfirm={() => {
          if (lockConfirmItem) lockMutation.mutate(lockConfirmItem);
        }}
      />
    </div>
  );
}
