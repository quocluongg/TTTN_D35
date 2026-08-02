"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";

type InventoryItem = {
  variantId: number;
  sku: string;
  productName: string;
  stock: number;
  price: number;
};

export default function AdminInventoryPage() {
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { data: inventory, isLoading, refetch } = useQuery<InventoryItem[]>({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const res = await http.get("/admin/inventory");
      return (res as any).data;
    },
  });

  const MOCK_INVENTORY: InventoryItem[] = inventory || [
    { variantId: 101, sku: "KYOR-1009-STD", productName: "Đồng hồ vạn năng Kyoritsu 1009", stock: 45, price: 1450000 },
    { variantId: 102, sku: "HIOKI-3280-STD", productName: "Ampe kìm Hioki 3280-10F", stock: 28, price: 1250000 },
    { variantId: 103, sku: "FLUKE-1507-STD", productName: "Máy đo điện trở cách điện Fluke 1507", stock: 3, price: 11200000 },
  ];

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVariant) return;
      return http.post(`/admin/inventory/${selectedVariant.variantId}/adjust`, {
        quantityDelta: delta,
        reason,
      });
    },
    onSuccess: () => {
      notifySuccess("Điều chỉnh tồn kho thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      setSelectedVariant(null);
      setDelta(0);
      setReason("");
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || "Không thể điều chỉnh tồn kho");
    },
  });

  const columns: Column<InventoryItem>[] = [
    {
      header: "Mã SKU Variant",
      accessor: "sku",
      render: (item) => <span className="font-mono font-bold text-slate-800">{item.sku}</span>,
    },
    {
      header: "Sản Phẩm",
      accessor: "productName",
      render: (item) => <span className="font-bold text-slate-900">{item.productName}</span>,
    },
    {
      header: "Giá Bán Ниêm Yết",
      render: (item) => (
        <span className="font-mono text-slate-700">
          {new Intl.NumberFormat("vi-VN").format(item.price)}đ
        </span>
      ),
    },
    {
      header: "Số Lượng Tồn Kho",
      render: (item) => (
        <AdminJSPillTag variant={item.stock <= 5 ? "danger" : item.stock <= 15 ? "warning" : "success"}>
          {item.stock} sản phẩm
        </AdminJSPillTag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Quản Lý Tồn Kho & Kiểm Kê (Inventory Resource)"
        resourceName="Inventory"
        count={MOCK_INVENTORY.length}
        description="Theo dõi số lượng tồn kho của từng SKU biến thể và điều chỉnh kho."
        onRefresh={() => refetch()}
      />

      <AdminJSResourceTable<InventoryItem>
        columns={columns}
        data={MOCK_INVENTORY}
        keyExtractor={(item) => String(item.variantId)}
        isLoading={isLoading}
        onEdit={(item) => setSelectedVariant(item)}
      />

      {/* Adjust Inventory Dialog */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Điều chỉnh Tồn Kho (Adjust Stock)</h3>
            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-700">
              <p>Sản phẩm: <strong>{selectedVariant.productName}</strong></p>
              <p>SKU: <strong className="font-mono">{selectedVariant.sku}</strong></p>
              <p>Tồn hiện tại: <strong className="text-purple-700 font-bold">{selectedVariant.stock}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Số lượng điều chỉnh (+ tăng / - giảm)
              </label>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Lý do điều chỉnh kho (Kiểm kê/Nhập hàng/Hỏng)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Đợt kiểm kê định kỳ..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedVariant(null)}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={() => adjustMutation.mutate()}
                disabled={!delta || !reason}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded text-xs font-bold shadow-sm"
              >
                Cập Nhật Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
