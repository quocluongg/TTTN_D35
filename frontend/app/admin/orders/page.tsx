"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";
import AdminJSFilterDrawer from "@/components/adminjs/AdminJSFilterDrawer";

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery<OrderItem[]>({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      const res = await http.get("/admin/orders", {
        params: { status: statusFilter || undefined },
      });
      return (res as any).data;
    },
  });

  const MOCK_ORDERS: OrderItem[] = orders || [
    { id: "ORD-001", orderCode: "SW-89412", customerName: "Nguyễn Văn Hùng", status: "DELIVERED", paymentStatus: "PAID", totalAmount: 2700000, createdAt: "2024-05-10" },
    { id: "ORD-002", orderCode: "SW-89413", customerName: "Trần Thị Mai", status: "SHIPPING", paymentStatus: "PAID", totalAmount: 1450000, createdAt: "2024-05-11" },
    { id: "ORD-003", orderCode: "SW-89414", customerName: "Phạm Quốc Cường", status: "PENDING", paymentStatus: "UNPAID", totalAmount: 11200000, createdAt: "2024-05-12" },
  ];

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

  const getStatusVariant = (s: string) => {
    switch (s) {
      case "DELIVERED":
        return "success";
      case "SHIPPING":
      case "PROCESSING":
        return "purple";
      case "PENDING":
      case "CONFIRMED":
        return "warning";
      case "CANCELLED":
      case "REFUNDED":
        return "danger";
      default:
        return "neutral";
    }
  };

  const columns: Column<OrderItem>[] = [
    {
      header: "Mã Đơn Hàng",
      render: (o) => (
        <div>
          <p className="font-mono font-bold text-slate-900">{o.orderCode}</p>
          <p className="text-[11px] text-slate-400">ID: {o.id}</p>
        </div>
      ),
    },
    {
      header: "Khách Hàng",
      accessor: "customerName",
      render: (o) => <span className="font-bold text-slate-800">{o.customerName}</span>,
    },
    {
      header: "Tổng Giá Trị",
      render: (o) => (
        <span className="font-mono font-bold text-slate-900">
          {new Intl.NumberFormat("vi-VN").format(o.totalAmount)}đ
        </span>
      ),
    },
    {
      header: "Trạng Thái Đơn",
      render: (o) => (
        <AdminJSPillTag variant={getStatusVariant(o.status)}>{o.status}</AdminJSPillTag>
      ),
    },
    {
      header: "Thanh Toán",
      render: (o) => (
        <AdminJSPillTag variant={o.paymentStatus === "PAID" ? "success" : "warning"}>
          {o.paymentStatus}
        </AdminJSPillTag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Quản Lý Đơn Hàng (Orders Resource)"
        resourceName="Orders"
        count={MOCK_ORDERS.length}
        description="Xử lý quy trình giao nhận đơn hàng, thay đổi trạng thái và xác nhận thanh toán."
        onFilterToggle={() => setIsFilterOpen(true)}
        onRefresh={() => refetch()}
      />

      <AdminJSResourceTable<OrderItem>
        columns={columns}
        data={MOCK_ORDERS}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        onView={(o) => {
          setSelectedOrder(o);
          setNewStatus(o.status);
        }}
        onEdit={(o) => {
          setSelectedOrder(o);
          setNewStatus(o.status);
        }}
      />

      {/* Filter Drawer */}
      <AdminJSFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => refetch()}
        onReset={() => setStatusFilter("")}
      >
        <div>
          <label className="block font-bold text-slate-800 mb-1">Trạng thái đơn hàng</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">-- Tất cả trạng thái --</option>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </AdminJSFilterDrawer>

      {/* Action Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cập nhật Trạng Thái Đơn Hàng</h3>
            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-700">
              <p>Mã đơn: <strong>{selectedOrder.orderCode}</strong></p>
              <p>Khách hàng: <strong>{selectedOrder.customerName}</strong></p>
              <p>Tổng tiền: <strong>{new Intl.NumberFormat("vi-VN").format(selectedOrder.totalAmount)}đ</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Trạng thái mới</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Ghi chú xử lý (Notes)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đã bàn giao cho đơn vị vận chuyển..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={() => updateStatusMutation.mutate()}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold shadow-sm"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
