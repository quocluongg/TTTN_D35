"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";

type OrderItem = {
  id: string;
  orderCode: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
};

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<OrderItem[]>({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      const res = await http.get("/admin/orders", {
        params: { status: statusFilter || undefined },
      });
      return (res as any).data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) return;
      return http.patch(`/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        note,
      });
    },
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái đơn hàng thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
      setNote("");
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Đơn hàng</h1>
          <p className="text-sm text-slate-500">Xử lý quy trình giao nhận đơn hàng, thay đổi trạng thái và hoàn tiền.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="">-- Tất cả trạng thái --</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Mã đơn hàng</th>
              <th className="px-6 py-3">Khách hàng</th>
              <th className="px-6 py-3">Tổng giá trị</th>
              <th className="px-6 py-3">Trạng thái Đơn</th>
              <th className="px-6 py-3">Thanh toán</th>
              <th className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải danh sách đơn...</td></tr>
            ) : orders?.length ? (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{o.orderCode}</td>
                  <td className="px-6 py-4">{o.customerName}</td>
                  <td className="px-6 py-4 font-semibold">{new Intl.NumberFormat("vi-VN").format(o.totalAmount)} VNĐ</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 border text-slate-800">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{o.paymentStatus}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setNewStatus(o.status);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Đổi Trạng Thái
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Không có đơn hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cập nhật Trạng Thái Đơn Hàng</h3>
            <p className="text-sm text-slate-600">
              Đơn hàng: <strong>{selectedOrder.orderCode}</strong><br/>
              Khách hàng: {selectedOrder.customerName}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái mới</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú xử lý (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đã đóng gói xong và bàn giao cho đơn vị vận chuyển..."
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 rounded text-sm text-slate-600 hover:bg-slate-100">
                Hủy
              </button>
              <button
                onClick={() => updateStatusMutation.mutate()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
