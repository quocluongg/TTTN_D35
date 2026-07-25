"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";

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
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [lockReason, setLockReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<UserPageResponse>({
    queryKey: ["admin-users", search, page],
    queryFn: async () => {
      const res = await http.get("/admin/users", {
        params: { search: search || undefined, page, size: 10 },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-500">Xem danh sách, tìm kiếm, phân quyền và khóa/mở khóa tài khoản.</p>
        </div>
        <input
          type="text"
          placeholder="Tìm theo tên, email, sđt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Họ và tên</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Vai trò</th>
              <th className="px-6 py-3">Xác thực Email</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td>
              </tr>
            ) : data?.content?.length ? (
              data.content.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{user.fullName}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <span className="text-emerald-600 font-semibold">✓ Đã xác thực</span>
                    ) : (
                      <span className="text-amber-600">Chưa xác thực</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setLockReason(user.lockReason || "");
                      }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                    >
                      {user.active ? "Khóa tài khoản" : "Mở khóa"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Không tìm thấy người dùng phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lock/Unlock Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {selectedUser.active ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
            </h3>
            <p className="text-sm text-slate-600">
              Tài khoản: <strong>{selectedUser.email}</strong> ({selectedUser.fullName})
            </p>

            {selectedUser.active && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do khóa tài khoản</label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Nhập lý do khóa..."
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded text-sm text-slate-600 hover:bg-slate-100"
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
                className={`px-4 py-2 rounded text-sm text-white font-medium ${
                  selectedUser.active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
