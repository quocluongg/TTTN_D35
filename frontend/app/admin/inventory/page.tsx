"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { notifyError, notifySuccess } from "@/components/Notify";
import { Warehouse, History, Edit3, X, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface InventoryItem {
  id: string; // variantId
  variantId?: string;
  sku: string;
  productName: string;
  variantLabel?: string;
  attributes?: Record<string, string> | string;
  stock: number;
  updatedAt?: string;
}

interface StockHistory {
  id: string;
  variantId: string;
  quantityChange: number;
  reason: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "RETURN";
  note?: string;
  createdAt: string;
  createdBy?: string;
}

const REASONS = [
  { value: "STOCK_IN", label: "Nhập kho (+)" },
  { value: "STOCK_OUT", label: "Xuất kho (-)" },
  { value: "ADJUSTMENT", label: "Điều chỉnh (+/-)" },
  { value: "RETURN", label: "Hàng trả (+)" },
];

const unwrap = (x: any) => x?.data ?? x;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [historyVariantId, setHistoryVariantId] = useState<string | null>(null);

  // Form state for stock adjustment
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState<string>("STOCK_IN");
  const [note, setNote] = useState<string>("");

  // Fetch Inventory
  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory", page, lowStockOnly],
    queryFn: () =>
      adminApi.inventory.list({
        page,
        size: 15,
        ...(lowStockOnly ? { lowStock: true } : {}),
      }),
  });

  // Fetch History side panel
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["admin-inventory-history", historyVariantId],
    queryFn: () => adminApi.inventory.history(historyVariantId!),
    enabled: !!historyVariantId,
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, delta, reason, note }: { id: string; delta: number; reason: string; note: string }) =>
      adminApi.inventory.updateStock(id, { quantityChange: delta, reason, note }),
    onSuccess: () => {
      notifySuccess("Cập nhật kho hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      if (historyVariantId) {
        queryClient.invalidateQueries({ queryKey: ["admin-inventory-history", historyVariantId] });
      }
      setAdjustItem(null);
      setQuantityChange(0);
      setNote("");
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật tồn kho.");
    },
  });

  const payload: any = unwrap(data) || {};
  const rows: InventoryItem[] = Array.isArray(payload) ? payload : payload.content || [];
  const totalPages = payload.totalPages || 0;

  const historyRows: StockHistory[] = unwrap(historyData) || [];

  const columns: Column<InventoryItem>[] = [
    {
      key: "sku",
      header: "SKU / Biến thể",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-black">{row.sku}</span>
          <p className="text-sm font-medium">{row.productName}</p>
          {row.variantLabel && <p className="text-xs text-zinc-500">{row.variantLabel}</p>}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Tồn kho hiện tại",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`text-base font-bold px-2 py-0.5 border ${
              row.stock <= 5
                ? "border-red-600 bg-red-50 text-red-700"
                : row.stock <= 15
                ? "border-yellow-600 bg-yellow-50 text-yellow-800"
                : "border-black bg-white text-black"
            }`}
          >
            {row.stock}
          </span>
          {row.stock <= 5 && <StatusBadge status="LOCKED" />}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Cập nhật lần cuối",
      cell: (row) => (
        <span className="text-xs text-zinc-500">
          {row.updatedAt ? new Date(row.updatedAt).toLocaleString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdjustItem(row)}
            className="flex items-center gap-1 border border-black bg-white px-2.5 py-1 text-xs font-medium rounded-none hover:bg-zinc-100"
          >
            <Edit3 size={13} /> Điều chỉnh
          </button>
          <button
            onClick={() => setHistoryVariantId(row.variantId || row.id)}
            className="flex items-center gap-1 border border-black bg-black text-white px-2.5 py-1 text-xs font-medium rounded-none hover:bg-zinc-800"
          >
            <History size={13} /> Lịch sử
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black pb-5">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight">Quản lý Kho hàng</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Theo dõi tồn kho theo SKU biến thể, điều chỉnh kho và truy xuất lịch sử xuất nhập.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer border border-black px-3 py-2 bg-white">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(0);
              }}
              className="accent-black"
            />
            Chỉ xem tồn kho thấp (≤ 10)
          </label>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        rowKey={(row) => row.id || row.sku}
        empty="Không tìm thấy biến thể sản phẩm trong kho."
      />

      {/* Stock Adjustment Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateStockMutation.mutate({
                id: adjustItem.variantId || adjustItem.id,
                delta: Number(quantityChange),
                reason,
                note,
              });
            }}
            className="w-full max-w-md border border-black bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-xl font-medium">Điều chỉnh tồn kho</h3>
              <button type="button" onClick={() => setAdjustItem(null)}>
                <X size={20} />
              </button>
            </div>

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">{adjustItem.sku}</p>
              <p className="font-medium text-base">{adjustItem.productName}</p>
              <p className="mt-1 text-sm">
                Tồn kho hiện tại: <strong className="text-black underline">{adjustItem.stock}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Loại điều chỉnh
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 rounded-none bg-white text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Số lượng (+ tăng / - giảm)
                <input
                  required
                  type="number"
                  value={quantityChange || ""}
                  onChange={(e) => setQuantityChange(Number(e.target.value))}
                  placeholder="Ví dụ: 10 hoặc -5"
                  className="mt-1 block w-full border border-black px-3 py-2 rounded-none text-sm"
                />
              </label>

              <label className="block text-sm font-medium">
                Ghi chú
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Lý do nhập/xuất kho..."
                  className="mt-1 block w-full border border-black px-3 py-2 rounded-none text-sm"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black">
              <button
                type="button"
                onClick={() => setAdjustItem(null)}
                className="border border-black px-4 py-2 text-sm rounded-none"
              >
                Hủy
              </button>
              <button
                disabled={updateStockMutation.isPending}
                className="bg-black text-white px-5 py-2 text-sm rounded-none hover:bg-zinc-800 disabled:opacity-50"
              >
                {updateStockMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Side Panel */}
      {historyVariantId && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-black bg-white p-6 shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between border-b border-black pb-4">
            <div className="flex items-center gap-2">
              <History size={20} />
              <h3 className="text-xl font-medium">Lịch sử xuất nhập kho</h3>
            </div>
            <button onClick={() => setHistoryVariantId(null)} className="p-1 hover:bg-zinc-100">
              <X size={20} />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {historyLoading ? (
              <p className="text-sm text-zinc-500">Đang tải lịch sử...</p>
            ) : Array.isArray(historyRows) && historyRows.length ? (
              historyRows.map((h) => (
                <div key={h.id} className="border border-black p-4 space-y-2 bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-sm font-bold">
                      {h.quantityChange > 0 ? (
                        <span className="text-green-700 flex items-center">
                          <ArrowUpRight size={16} /> +{h.quantityChange}
                        </span>
                      ) : (
                        <span className="text-red-700 flex items-center">
                          <ArrowDownRight size={16} /> {h.quantityChange}
                        </span>
                      )}
                    </span>
                    <StatusBadge status={h.reason} />
                  </div>
                  {h.note && <p className="text-xs text-zinc-700 italic">"{h.note}"</p>}
                  <div className="flex justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200 font-mono">
                    <span>Người thực hiện: {h.createdBy || "System"}</span>
                    <span>{new Date(h.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Chưa có lịch sử điều chỉnh cho biến thể này.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
