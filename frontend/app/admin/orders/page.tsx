"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminOrderService } from "@/services/admin/adminOrderService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import { ShoppingBag, Eye, CreditCard, Calendar, Truck, User } from "lucide-react";

type OrderRow = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch single order details when modal opens
  const orderDetailQuery = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: () => adminOrderService.get(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const orderDetail: any = unwrap(orderDetailQuery.data) || {};

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminOrderService.status(id, { status }),
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái đơn hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["admin-order-detail", selectedOrderId] });
      }
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật trạng thái đơn hàng.");
    },
  });

  const handleOpenDetail = (row: OrderRow) => {
    setSelectedOrderId(row.id);
    setDetailModalOpen(true);
  };

  const customOrderActions = (row: OrderRow) => (
    <button
      onClick={() => handleOpenDetail(row)}
      className="border border-black px-2 py-1 text-xs hover:bg-zinc-100 flex items-center gap-1 font-semibold"
    >
      <Eye size={12} /> Chi tiết
    </button>
  );

  return (
    <div className="space-y-6">
      <ResourcePage
        title="Quản lý Đơn hàng"
        description="Theo dõi danh sách đơn hàng toàn hệ thống, kiểm tra chi tiết thanh toán và cập nhật trạng thái vận chuyển."
        queryKey="admin-orders"
        fetcher={adminOrderService.list}
        fields={[
          { key: "id", label: "Mã đơn hàng (ID)" },
          { key: "customerName", label: "Khách hàng" },
          { key: "customerPhone", label: "Số điện thoại" },
          { key: "totalAmount", label: "Tổng tiền" },
          { key: "paymentMethod", label: "Thanh toán" },
          { key: "status", label: "Trạng thái đơn" },
        ]}
        customActions={customOrderActions}
      />

      {/* Order Detail Modal */}
      {detailModalOpen && selectedOrderId && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-3xl border-2 border-black bg-white p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Chi tiết Đơn hàng</span>
              </DialogTitle>
            </DialogHeader>

            {orderDetailQuery.isLoading ? (
              <p className="text-sm text-zinc-500 py-10 text-center">Đang tải chi tiết đơn hàng...</p>
            ) : (
              <div className="mt-4 space-y-6 text-sm text-black">
                {/* Order Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 border border-black/10">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">MÃ ĐƠN HÀNG</span>
                    <strong className="font-mono text-xs">{orderDetail.id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">TRẠNG THÁI HIỆN TẠI</span>
                    <strong className="uppercase">{orderDetail.status || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">NGÀY ĐẶT HÀNG</span>
                    <strong>
                      {orderDetail.createdAt
                        ? new Date(orderDetail.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">TỔNG GIÁ TRỊ</span>
                    <strong className="text-indigo-700 font-mono">
                      {Number(orderDetail.totalAmount || 0).toLocaleString("vi-VN")} ₫
                    </strong>
                  </div>
                </div>

                {/* Customer & Shipping Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-black/10 p-4 space-y-2">
                    <h4 className="font-bold flex items-center gap-1.5 border-b border-black/10 pb-1.5 mb-2">
                      <User className="w-4 h-4" /> Thông tin người đặt
                    </h4>
                    <p>Họ tên: <strong>{orderDetail.customerName || orderDetail.fullName}</strong></p>
                    <p>Điện thoại: <strong>{orderDetail.customerPhone || orderDetail.phoneNumber}</strong></p>
                    <p>Email: <strong>{orderDetail.email || "—"}</strong></p>
                  </div>

                  <div className="border border-black/10 p-4 space-y-2">
                    <h4 className="font-bold flex items-center gap-1.5 border-b border-black/10 pb-1.5 mb-2">
                      <Truck className="w-4 h-4" /> Địa chỉ giao hàng
                    </h4>
                    <p>Người nhận: <strong>{orderDetail.shippingName || orderDetail.customerName}</strong></p>
                    <p>Điện thoại: <strong>{orderDetail.shippingPhone || orderDetail.customerPhone}</strong></p>
                    <p>Địa chỉ: <strong>{orderDetail.shippingAddress || "Tại cửa hàng"}</strong></p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider mb-2">Sản phẩm trong đơn</h4>
                  <div className="border border-black overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-black font-mono">
                          <th className="p-2.5">Sản phẩm / Biến thể</th>
                          <th className="p-2.5 text-center">Số lượng</th>
                          <th className="p-2.5 text-right">Đơn giá</th>
                          <th className="p-2.5 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {orderDetail.items?.map((item: any, i: number) => (
                          <tr key={item.id || i}>
                            <td className="p-2.5">
                              <p className="font-bold">{item.productName}</p>
                              {item.variantName && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  SKU: {item.sku} - {item.variantName}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono">
                              {Number(item.price || 0).toLocaleString("vi-VN")} ₫
                            </td>
                            <td className="p-2.5 text-right font-bold font-mono">
                              {Number((item.price || 0) * (item.quantity || 1)).toLocaleString("vi-VN")} ₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Update Control Section */}
                <div className="border border-black p-4 space-y-3 bg-zinc-50">
                  <h4 className="font-bold uppercase tracking-wider text-xs">Cập nhật trạng thái xử lý đơn</h4>
                  <div className="flex flex-wrap gap-2">
                    {["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => updateStatusMutation.mutate({ id: selectedOrderId, status: st })}
                        disabled={orderDetail.status === st || updateStatusMutation.isPending}
                        className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                          orderDetail.status === st
                            ? "bg-black text-white border-black"
                            : "border-black bg-white text-black hover:bg-zinc-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="border border-black bg-black text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
