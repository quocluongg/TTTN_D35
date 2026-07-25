"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { notifySuccess, notifyError } from "@/components/Notify";

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

  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const res = await http.get("/admin/inventory");
      return (res as any).data;
    },
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Tồn kho & Kiểm kê</h1>
          <p className="text-sm text-slate-500">Theo dõi số lượng tồn của từng SKU biến thể và thực hiện điều chỉnh kho.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Sản phẩm</th>
              <th className="px-6 py-3">Mã SKU</th>
              <th className="px-6 py-3">Giá bán</th>
              <th className="px-6 py-3">Số lượng Tồn</th>
              <th className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải tồn kho...</td></tr>
            ) : inventory?.length ? (
              inventory.map((item) => (
                <tr key={item.variantId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.productName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.sku}</td>
                  <td className="px-6 py-4">{new Intl.NumberFormat("vi-VN").format(item.price)} VNĐ</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded font-bold text-xs ${item.stock <= 5 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {item.stock} sản phẩm
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedVariant(item)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Điều chỉnh Kho
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Không có biến thể tồn kho.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedVariant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Điều chỉnh Tồn Kho</h3>
            <p className="text-sm text-slate-600">
              Sản phẩm: <strong>{selectedVariant.productName}</strong> ({selectedVariant.sku})<br/>
              Tồn kho hiện tại: <span className="font-bold">{selectedVariant.stock}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng điều chỉnh (+ tăng / - giảm)</label>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do điều chỉnh (nhập/xuất/kiểm kê/hỏng)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Đợt kiểm kê tháng 7..."
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedVariant(null)} className="px-4 py-2 rounded text-sm text-slate-600 hover:bg-slate-100">
                Hủy
              </button>
              <button
                onClick={() => adjustMutation.mutate()}
                disabled={!delta || !reason}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-sm font-medium"
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
