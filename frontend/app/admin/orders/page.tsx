"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminOrderService } from "@/services/admin/adminOrderService";
import StatusBadge from "@/components/StatusBadge";
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
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  FileText,
  Search,
  RefreshCw,
  ChevronRight,
  Filter,
  ArrowRight,
  PackageCheck
} from "lucide-react";

type OrderRow = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

// Cấu hình các bước luồng xử lý đơn hàng
const ORDER_STEPS = [
  {
    key: "PENDING",
    label: "Chờ xác nhận",
    desc: "Khách vừa tạo đơn hàng",
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    key: "PROCESSING",
    label: "Đang đóng gói",
    desc: "Đang kiểm kho & chuẩn bị hàng",
    icon: ShoppingBag,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "SHIPPED",
    label: "Đang vận chuyển",
    desc: "Đã bàn giao đơn vị vận chuyển",
    icon: Truck,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    key: "COMPLETED",
    label: "Hoàn tất",
    desc: "Giao thành công & kích hoạt bảo hành",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả đơn hàng" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "PROCESSING", label: "Đang đóng gói" },
  { key: "SHIPPED", label: "Đang giao hàng" },
  { key: "COMPLETED", label: "Hoàn tất" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");

  // Fetch danh sách đơn hàng
  const ordersQuery = useQuery({
    queryKey: ["admin-orders-list"],
    queryFn: () => adminOrderService.list({ page: 0, size: 100 }),
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
    if (res?.data && typeof res.data === "object") {
      const inner = res.data;
      if (Array.isArray(inner.content)) return inner.content;
      if (Array.isArray(inner.items)) return inner.items;
      if (Array.isArray(inner.data)) return inner.data;
    }
    return [];
  };

  const rawOrders = extractArray(ordersQuery.data);

  // Filtered orders
  const filteredOrders = rawOrders.filter((order: any) => {
    const matchStatus = selectedStatusTab === "ALL" || order.status === selectedStatusTab;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      order.id?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.customerPhone?.includes(q);
    return matchStatus && matchQuery;
  });

  // Fetch chi tiết đơn hàng được chọn
  const orderDetailQuery = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: () => adminOrderService.get(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const orderDetail: any = unwrap(orderDetailQuery.data) || {};

  // Mutation cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber }: { id: string; status: string; trackingNumber?: string }) =>
      adminOrderService.status(id, { status, trackingNumber }),
    onSuccess: () => {
      notifySuccess("Đã cập nhật tiến độ đơn hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders-list"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["admin-order-detail", selectedOrderId] });
      }
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể cập nhật trạng thái đơn hàng.");
    },
  });

  const handleOpenDetail = (order: OrderRow) => {
    setSelectedOrderId(order.id);
    setTrackingNumberInput(order.trackingNumber || "");
    setDetailModalOpen(true);
  };

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
    <div className="space-y-6 font-sans pb-10">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Quản Lý & Xử Lý Đơn Hàng</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Theo dõi tiến độ đơn hàng thời gian thực, bàn giao vận chuyển GHN/GHTK & tự động kích hoạt bảo hành điện tử
          </p>
        </div>

        <button
          onClick={() => ordersQuery.refetch()}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-700 shadow-xs transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={`text-zinc-500 ${ordersQuery.isFetching ? "animate-spin" : ""}`} />
          Làm mới danh sách
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? rawOrders.length
                  : rawOrders.filter((o) => o.status === tab.key).length;
              const isActive = selectedStatusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatusTab(tab.key)}
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

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã đơn, Khách hàng, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Orders Main Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {ordersQuery.isLoading ? (
          <div className="p-16 text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" /> Đang tải danh sách đơn hàng...
          </div>
        ) : ordersQuery.isError ? (
          <div className="p-12 text-center text-xs text-rose-600 bg-rose-50/50 space-y-2">
            <p className="font-bold text-sm">Không thể tải danh sách đơn hàng từ Server</p>
            <p className="text-zinc-500 font-mono">
              {(ordersQuery.error as any)?.message || "Vui lòng kiểm tra quyền truy cập tài khoản (ORDER_VIEW) hoặc kết nối mạng."}
            </p>
            <button
              onClick={() => ordersQuery.refetch()}
              className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
                  <th className="p-4">Mã Đơn Hàng</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Số Điện Thoại</th>
                  <th className="p-4">Phương Thức</th>
                  <th className="p-4 text-right">Tổng Tiền</th>
                  <th className="p-4 text-center">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => {
                  const rawAmount = Number(order.totalAmount || 0);
                  const shortId = order.id?.substring(0, 8).toUpperCase() || order.id;

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-900">
                        #{shortId}
                        <span className="block text-[10px] text-zinc-400 font-normal">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : ""}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-zinc-800">
                        {order.customerName || order.user?.fullName || "Khách vãng lai"}
                      </td>
                      <td className="p-4 font-mono text-zinc-600">
                        {order.customerPhone || order.shippingPhone || "—"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 font-mono text-[10px] font-semibold border border-zinc-200">
                          {order.paymentMethod || "COD"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-zinc-900 text-sm">
                        {rawAmount.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} /> Xử Lý Đơn
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advanced Order Fulfillment Modal */}
      {detailModalOpen && selectedOrderId && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-full border border-zinc-200 rounded-3xl bg-white p-0 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <DialogHeader className="p-6 border-b border-zinc-200 bg-zinc-50 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                    ĐƠN HÀNG #{orderDetail.id?.substring(0, 8).toUpperCase() || selectedOrderId.substring(0, 8).toUpperCase()}
                  </DialogTitle>
                  <StatusBadge status={orderDetail.status} />
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Mã ID: {selectedOrderId} · Thời gian đặt: {orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
            </DialogHeader>

            {orderDetailQuery.isLoading ? (
              <div className="p-16 text-center text-zinc-500 font-medium flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-zinc-400" /> Đang tải chi tiết đơn hàng...
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 p-6 space-y-6 text-zinc-900">

                {/* 1. VISUAL WORKFLOW TRACKER (E-COMMERCE STEPS) */}
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
                      <Clock size={16} className="text-zinc-500" /> Tiến Độ Luồng Xử Lý Đơn Hàng
                    </h3>
                    <span className="text-xs font-bold font-mono px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-800">
                      Phương thức: {orderDetail.paymentMethod || "COD"}
                    </span>
                  </div>

                  {/* Flow Steps Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ORDER_STEPS.map((step) => {
                      const state = getStepState(step.key, orderDetail.status);
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.key}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                            state === "current"
                              ? "bg-white border-2 border-zinc-900 shadow-sm"
                              : state === "completed"
                              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                              : "bg-white border-dashed border-zinc-200 opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={`p-1.5 rounded-lg ${state === "current" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                              <Icon size={16} />
                            </div>
                            {state === "completed" && <CheckCircle2 size={16} className="text-emerald-600" />}
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
                <div className="p-5 rounded-2xl border border-zinc-200 bg-amber-50/30 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-600" /> Thao Tác Cập Nhật Trạng Thái Bàn Giao
                  </h3>

                  {orderDetail.status === "CANCELLED" || orderDetail.status === "COMPLETED" ? (
                    <div className="p-3 bg-white rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 flex items-center gap-2">
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
                            className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                          >
                            <ShoppingBag size={15} /> 1. Xác Nhận & Chuyển Đóng Gói (PROCESSING)
                          </button>
                        )}

                        {orderDetail.status === "PROCESSING" && (
                          <div className="w-full space-y-3 bg-white p-4 rounded-xl border border-zinc-200">
                            <label className="block text-xs font-bold text-zinc-700">Mã vận đơn / Vận chuyển (Tracking Number):</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Ví dụ: GHN-892310243 hoặc GHTK-102938"
                                value={trackingNumberInput}
                                onChange={(e) => setTrackingNumberInput(e.target.value)}
                                className="flex-1 border border-zinc-200 px-3.5 py-2 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                              >
                                2. Bàn Giao Vận Chuyển (SHIPPED)
                              </button>
                            </div>
                          </div>
                        )}

                        {orderDetail.status === "SHIPPED" && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: selectedOrderId, status: "COMPLETED" })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={16} /> 3. Xác Nhận Giao Thành Công & Hoàn Tất (COMPLETED)
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
                          className="border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/50 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <XCircle size={15} /> Hủy Đơn Hàng (CANCELLED)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. CUSTOMER & SHIPPING INFORMATION GRID */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2 flex items-center gap-2">
                      <User size={15} /> Thông Tin Khách Hàng
                    </h4>
                    <div className="text-xs space-y-2">
                      <p className="flex justify-between"><span className="text-zinc-500">Họ tên:</span> <strong>{orderDetail.customerName || orderDetail.user?.fullName}</strong></p>
                      <p className="flex justify-between items-center"><span className="text-zinc-500">SĐT:</span> <strong className="font-mono">{orderDetail.customerPhone || orderDetail.shippingPhone || "—"}</strong></p>
                      <p className="flex justify-between items-center"><span className="text-zinc-500">Email:</span> <strong>{orderDetail.customerEmail || orderDetail.user?.email || "N/A"}</strong></p>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2 flex items-center gap-2">
                      <MapPin size={15} /> Địa Chỉ Giao Nhận & Thanh Toán
                    </h4>
                    <div className="text-xs space-y-2">
                      <p className="flex justify-between"><span className="text-zinc-500">Địa chỉ giao:</span> <strong className="text-right max-w-xs">{orderDetail.shippingAddress}</strong></p>
                      <p className="flex justify-between"><span className="text-zinc-500">Mã vận đơn:</span> <strong className="font-mono text-indigo-600">{orderDetail.trackingNumber || "Chưa cập nhật"}</strong></p>
                      <p className="flex justify-between"><span className="text-zinc-500">Thanh toán:</span> <strong className="uppercase font-mono">{orderDetail.paymentStatus}</strong></p>
                    </div>
                  </div>
                </div>

                {/* 4. ITEMS & FINANCIAL SUMMARY TABLE */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <FileText size={15} /> Chi Tiết Sản Phẩm Trong Đơn ({orderDetail.items?.length || 0} món)
                  </h4>

                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-zinc-50/80 border-b border-zinc-200 font-semibold text-zinc-500 uppercase text-[11px]">
                          <th className="p-3.5">Sản Phẩm / Cấu Hình</th>
                          <th className="p-3.5 text-center">Số Lượng</th>
                          <th className="p-3.5 text-right">Đơn Giá</th>
                          <th className="p-3.5 text-right">Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {orderDetail.items?.map((item: any, i: number) => {
                          const unitPrice = Number(item.priceAtPurchase ?? item.price ?? 0);
                          const lineTotal = Number(item.lineTotal ?? (unitPrice * Number(item.quantity || 1)));

                          return (
                            <tr key={item.id || i} className="hover:bg-zinc-50/60">
                              <td className="p-3.5">
                                <p className="font-semibold text-sm text-zinc-900">{item.productName}</p>
                                {item.variantName && (
                                  <p className="text-xs text-zinc-500 font-mono">Cấu hình: {item.variantName}</p>
                                )}
                              </td>
                              <td className="p-3.5 text-center font-bold text-sm">{item.quantity}</td>
                              <td className="p-3.5 text-right font-mono">{unitPrice.toLocaleString("vi-VN")} ₫</td>
                              <td className="p-3.5 text-right font-bold font-mono text-sm text-zinc-900">{lineTotal.toLocaleString("vi-VN")} ₫</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Total Summary */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex justify-between items-center text-sm">
                    <div className="text-xs text-zinc-500">
                      {orderDetail.voucherCode && (
                        <p>Áp dụng Voucher: <strong className="font-mono text-zinc-900">{orderDetail.voucherCode}</strong> (-{Number(orderDetail.discountAmount || 0).toLocaleString("vi-VN")} ₫)</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase font-bold text-zinc-500 mr-2">Tổng tiền thanh toán:</span>
                      <strong className="text-xl font-bold text-zinc-900 font-mono">
                        {Number(orderDetail.totalAmount || 0).toLocaleString("vi-VN")} ₫
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

