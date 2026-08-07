"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminOrderService } from "@/services/admin/adminOrderService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import {
  ShoppingBag,
  Eye,
  CreditCard,
  Calendar,
  Truck,
  User,
  Clock,
  PackageCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";

type OrderRow = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

// Cấu hình các bước trong luồng xử lý đơn hàng chuẩn E-commerce (Shopify/Shopee)
const ORDER_STEPS = [
  {
    key: "PENDING",
    label: "Chờ xác nhận",
    desc: "Khách vừa tạo đơn hàng",
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-300",
  },
  {
    key: "PROCESSING",
    label: "Đang đóng gói",
    desc: "Đang kiểm kho & đóng hàng",
    icon: ShoppingBag,
    color: "bg-blue-50 text-blue-700 border-blue-300",
  },
  {
    key: "SHIPPED",
    label: "Đang vận chuyển",
    desc: "Đã bàn giao đơn vị vận chuyển",
    icon: Truck,
    color: "bg-purple-50 text-purple-700 border-purple-300",
  },
  {
    key: "COMPLETED",
    label: "Hoàn tất",
    desc: "Giao thành công & tự tạo bảo hành",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  // Fetch chi tiết đơn hàng
  const orderDetailQuery = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: () => adminOrderService.get(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const orderDetail: any = unwrap(orderDetailQuery.data) || {};

  // Mutation cập nhật trạng thái + mã vận đơn
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber }: { id: string; status: string; trackingNumber?: string }) =>
      adminOrderService.status(id, { status, trackingNumber }),
    onSuccess: () => {
      notifySuccess("Đã cập nhật tiến độ đơn hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["admin-order-detail", selectedOrderId] });
      }
      setEditingStatus(null);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể cập nhật trạng thái đơn hàng.");
    },
  });

  const handleOpenDetail = (row: OrderRow) => {
    setSelectedOrderId(row.id);
    setTrackingNumberInput(row.trackingNumber || "");
    setEditingStatus(null);
    setDetailModalOpen(true);
  };

  const customOrderActions = (row: OrderRow) => (
    <button
      onClick={() => handleOpenDetail(row)}
      className="border border-black px-3 py-1.5 text-xs hover:bg-black hover:text-white transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
    >
      <Eye size={14} /> Xử lý đơn
    </button>
  );

  const getStepState = (stepKey: string, currentStatus: string) => {
    if (currentStatus === "CANCELLED" || currentStatus === "RETURNED") return "disabled";
    const statusOrder = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="space-y-6">
      <ResourcePage
        title="Quản lý & Xử lý Đơn hàng"
        description="Quy trình xử lý đơn hàng chuyên nghiệp: Xác nhận đơn -> Đóng gói kho -> Giao hàng -> Hoàn tất & Kích hoạt bảo hành điện tử."
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

      {/* Advanced Order Fulfillment Modal */}
      {detailModalOpen && selectedOrderId && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-full border-2 border-black bg-white p-0 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <DialogHeader className="p-6 border-b border-black bg-zinc-50 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black tracking-tight">
                    ĐƠN HÀNG #{orderDetail.id?.substring(0, 8).toUpperCase() || selectedOrderId.substring(0, 8).toUpperCase()}
                  </DialogTitle>
                  <span className="px-2.5 py-0.5 border border-black text-xs font-mono font-bold bg-white">
                    {orderDetail.paymentMethod || "COD"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Mã ID đầy đủ: {selectedOrderId} · Đặt lúc: {orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
            </DialogHeader>

            {orderDetailQuery.isLoading ? (
              <div className="p-16 text-center text-zinc-500 font-medium">Đang tải chi tiết xử lý đơn hàng...</div>
            ) : (
              <div className="overflow-y-auto flex-1 p-6 space-y-6 text-black">
                
                {/* 1. VISUAL WORKFLOW TRACKER (E-COMMERCE STEPS) */}
                <div className="border border-black p-5 bg-zinc-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Clock size={16} /> Tiến độ xử lý đơn hàng
                    </h3>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-black text-white">
                      Trạng thái: {orderDetail.status}
                    </span>
                  </div>

                  {/* Flow Steps */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ORDER_STEPS.map((step) => {
                      const state = getStepState(step.key, orderDetail.status);
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.key}
                          className={`border p-3 flex flex-col justify-between transition-all ${
                            state === "current"
                              ? "border-2 border-black bg-white shadow-md font-bold"
                              : state === "completed"
                              ? "border-zinc-300 bg-zinc-100/70 text-zinc-700"
                              : "border-dashed border-zinc-300 opacity-50 bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <Icon size={18} className={state === "current" ? "text-black" : "text-zinc-500"} />
                            {state === "completed" && <CheckCircle2 size={16} className="text-green-600" />}
                          </div>
                          <div className="mt-3">
                            <p className="text-xs font-bold">{step.label}</p>
                            <p className="text-[10px] text-zinc-500 line-clamp-1">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ADVANCED FULFILLMENT ACTIONS PANEL */}
                <div className="border-2 border-black p-5 bg-amber-50/50 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={18} /> Thao tác cập nhật trạng thái
                  </h3>

                  {orderDetail.status === "CANCELLED" || orderDetail.status === "COMPLETED" ? (
                    <div className="p-3 bg-white border border-black text-xs font-medium text-zinc-600 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span>Đơn hàng đã ở trạng thái cuối (<strong>{orderDetail.status}</strong>), không thể thay đổi thêm.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Step Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {orderDetail.status === "PENDING" && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: selectedOrderId, status: "PROCESSING" })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <ShoppingBag size={15} /> 1. Xác nhận & Chuyển sang Đóng gói (PROCESSING)
                          </button>
                        )}

                        {orderDetail.status === "PROCESSING" && (
                          <div className="w-full space-y-3 bg-white p-4 border border-black">
                            <label className="block text-xs font-bold">Mã vận đơn / Vận chuyển (Tracking Number):</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Ví dụ: GHN-892310243"
                                value={trackingNumberInput}
                                onChange={(e) => setTrackingNumberInput(e.target.value)}
                                className="flex-1 border border-black px-3 py-2 text-xs font-mono"
                              />
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: selectedOrderId,
                                    status: "SHIPPED",
                                    trackingNumber: trackingNumberInput,
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="bg-purple-700 text-white px-5 py-2 text-xs font-bold hover:bg-purple-800 cursor-pointer"
                              >
                                2. Bàn giao Vận chuyển (SHIPPED)
                              </button>
                            </div>
                          </div>
                        )}

                        {orderDetail.status === "SHIPPED" && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: selectedOrderId, status: "COMPLETED" })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-emerald-600 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={16} /> 3. Xác nhận Giao thành công & Hoàn tất (COMPLETED)
                          </button>
                        )}

                        {/* Danger Cancel Action */}
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc chắn muốn HỦY đơn hàng này? Tồn kho sẽ được tự động hoàn lại.")) {
                              updateStatusMutation.mutate({ id: selectedOrderId, status: "CANCELLED" });
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="border border-red-700 text-red-700 px-4 py-2.5 text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <XCircle size={15} /> Hủy đơn hàng (CANCELLED)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. CUSTOMER & SHIPPING INFORMATION GRID */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="border border-black p-4 bg-white space-y-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider border-b border-black pb-2 flex items-center gap-2">
                      <User size={15} /> Thông tin Khách hàng
                    </h4>
                    <div className="text-xs space-y-1.5 pt-1">
                      <p><span className="text-zinc-500">Họ tên:</span> <strong>{orderDetail.customerName}</strong></p>
                      <p className="flex items-center gap-1"><Phone size={13} className="text-zinc-400" /><span className="text-zinc-500">SĐT:</span> <strong className="font-mono">{orderDetail.customerPhone}</strong></p>
                      <p className="flex items-center gap-1"><Mail size={13} className="text-zinc-400" /><span className="text-zinc-500">Email:</span> <strong>{orderDetail.customerEmail || "N/A"}</strong></p>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="border border-black p-4 bg-white space-y-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider border-b border-black pb-2 flex items-center gap-2">
                      <MapPin size={15} /> Địa chỉ giao nhận
                    </h4>
                    <div className="text-xs space-y-1.5 pt-1">
                      <p><span className="text-zinc-500">Địa chỉ:</span> <strong>{orderDetail.shippingAddress}</strong></p>
                      <p><span className="text-zinc-500">Mã vận đơn:</span> <strong className="font-mono text-purple-700">{orderDetail.trackingNumber || "Chưa cập nhật"}</strong></p>
                      <p><span className="text-zinc-500">Trạng thái thanh toán:</span> <strong className="uppercase font-mono">{orderDetail.paymentStatus}</strong></p>
                    </div>
                  </div>
                </div>

                {/* 4. ITEMS & FINANCIAL SUMMARY TABLE */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileText size={15} /> Chi tiết sản phẩm trong đơn ({orderDetail.items?.length || 0} món)
                  </h4>
                  
                  <div className="border border-black overflow-x-auto bg-white">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-black font-mono uppercase text-[11px]">
                          <th className="p-3">Sản phẩm / Cấu hình</th>
                          <th className="p-3 text-center">Số lượng</th>
                          <th className="p-3 text-right">Đơn giá</th>
                          <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {orderDetail.items?.map((item: any, i: number) => {
                          const unitPrice = Number(item.priceAtPurchase ?? item.price ?? 0);
                          const lineTotal = Number(item.lineTotal ?? (unitPrice * Number(item.quantity || 1)));

                          return (
                            <tr key={item.id || i} className="hover:bg-zinc-50">
                              <td className="p-3">
                                <p className="font-bold text-sm">{item.productName}</p>
                                {item.variantName && (
                                  <p className="text-xs text-zinc-500 font-mono">Cấu hình: {item.variantName}</p>
                                )}
                              </td>
                              <td className="p-3 text-center font-bold text-sm">{item.quantity}</td>
                              <td className="p-3 text-right font-mono">{unitPrice.toLocaleString("vi-VN")} ₫</td>
                              <td className="p-3 text-right font-bold font-mono text-sm">{lineTotal.toLocaleString("vi-VN")} ₫</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Total Summary */}
                  <div className="border border-black p-4 bg-zinc-50 flex justify-between items-center text-sm">
                    <div className="text-xs text-zinc-500">
                      {orderDetail.voucherCode && (
                        <p>Áp dụng Voucher: <strong className="font-mono text-black">{orderDetail.voucherCode}</strong> (-{Number(orderDetail.discountAmount || 0).toLocaleString("vi-VN")} ₫)</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase font-bold text-zinc-500 mr-2">Tổng tiền thanh toán:</span>
                      <strong className="text-xl font-extrabold text-black font-mono">
                        {Number(orderDetail.totalAmount || 0).toLocaleString("vi-VN")} ₫
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 border-t border-black bg-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="border border-black bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
