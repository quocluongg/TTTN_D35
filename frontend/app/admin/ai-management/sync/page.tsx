"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Database,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowUpDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface ProductSyncStatus {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  chunk_count: number;
  status: "synced" | "not_synced";
}

interface SyncStatusResponse {
  total_products: number;
  synced_count: number;
  not_synced_count: number;
  sync_percentage: number;
  synced: ProductSyncStatus[];
  not_synced: ProductSyncStatus[];
}

async function fetchSyncStatus(): Promise<SyncStatusResponse> {
  const res = await fetch(`${API_URL}/admin/rag/sync/status`);
  if (!res.ok) throw new Error("Failed to fetch sync status");
  return res.json();
}

async function syncProduct(productId: string) {
  const res = await fetch(`${API_URL}/admin/rag/sync/product/${productId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to sync product");
  return res.json();
}

async function syncAll() {
  const res = await fetch(`${API_URL}/admin/rag/sync/all`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to sync all");
  return res.json();
}

export default function SyncManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "synced" | "not_synced">("all");
  const [showSynced, setShowSynced] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rag-sync-status"],
    queryFn: fetchSyncStatus,
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: syncProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-sync-status"] });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: syncAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-sync-status"] });
    },
  });

  if (isLoading || !data) {
    return (
      <section>
        <h1 className="text-[28px] font-medium">Quản lý Sync</h1>
        <p className="mt-4 text-zinc-500">Đang tải...</p>
      </section>
    );
  }

  // Get unique brands
  const brands = [...new Set([
    ...data.synced.map((p) => p.brand),
    ...data.not_synced.map((p) => p.brand),
  ])].filter(Boolean);

  // Filter products
  const filterProducts = (products: ProductSyncStatus[]) => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchBrand = !brandFilter || p.brand === brandFilter;
      return matchSearch && matchBrand;
    });
  };

  const filteredSynced = filterProducts(data.synced);
  const filteredNotSynced = filterProducts(data.not_synced);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <section>
      {/* Header */}
      <div className="border-b border-black pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium">Quản lý Sync</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quản lý đồng bộ sản phẩm vào RAG system
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-black rounded hover:bg-zinc-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => {
              if (confirm("Sync tất cả sản phẩm? Sẽ mất vài phút.")) {
                syncAllMutation.mutate();
              }
            }}
            disabled={syncAllMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncAllMutation.isPending ? "animate-spin" : ""} />
            {syncAllMutation.isPending ? "Đang sync…" : "Sync All"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-black bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600">Tổng sản phẩm</p>
            <Database size={20} className="text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-medium">{data.total_products}</p>
        </article>

        <article className="border border-black bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600">Đã sync</p>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-medium text-green-600">{data.synced_count}</p>
        </article>

        <article className="border border-black bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600">Chưa sync</p>
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-medium text-orange-600">{data.not_synced_count}</p>
        </article>

        <article className="border border-black bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600">Tỷ lệ sync</p>
            <Package size={20} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-medium">{data.sync_percentage}%</p>
          <div className="mt-2 w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${data.sync_percentage}%` }}
            />
          </div>
        </article>
      </div>

      {/* Filters */}
      <div className="mt-6 border border-black bg-white p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-zinc-300 rounded text-sm"
              />
            </div>
          </div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-300 rounded text-sm"
          >
            <option value="">Tất cả hãng</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-zinc-300 rounded text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="synced">Đã sync</option>
            <option value="not_synced">Chưa sync</option>
          </select>
        </div>
      </div>

      {/* Warning: Not Synced Products */}
      {data.not_synced_count > 0 && (
        <div className="mt-6 border border-orange-300 bg-orange-50 p-4 rounded">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <div>
              <h3 className="font-medium text-orange-800">
                {data.not_synced_count} sản phẩm chưa được sync vào RAG
              </h3>
              <p className="text-sm text-orange-600 mt-1">
                Các sản phẩm này sẽ không được chatbot tìm thấy. Hãy sync chúng để cải thiện kết quả tìm kiếm.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Not Synced Products */}
      {(statusFilter === "all" || statusFilter === "not_synced") && filteredNotSynced.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <XCircle className="text-orange-500" size={20} />
            Sản phẩm chưa sync ({filteredNotSynced.length})
          </h2>
          <div className="space-y-3">
            {filteredNotSynced.map((product) => (
              <div
                key={product.id}
                className="border border-orange-200 bg-white p-4 hover:bg-orange-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                        {product.brand}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {product.category} • {formatPrice(product.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => syncMutation.mutate(product.id)}
                    disabled={syncMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    Sync
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synced Products */}
      {(statusFilter === "all" || statusFilter === "synced") && (
        <div className="mt-6">
          <button
            onClick={() => setShowSynced(!showSynced)}
            className="flex items-center gap-2 mb-4"
          >
            {showSynced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <h2 className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              Sản phẩm đã sync ({filteredSynced.length})
            </h2>
          </button>

          {showSynced && (
            <div className="space-y-3">
              {filteredSynced.map((product) => (
                <div
                  key={product.id}
                  className="border border-green-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          {product.brand}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {product.chunk_count} chunks
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-zinc-600">
                        {product.category} • {formatPrice(product.price)}
                      </div>
                    </div>
                    <button
                      onClick={() => syncMutation.mutate(product.id)}
                      disabled={syncMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1 border border-zinc-300 rounded hover:bg-zinc-100 text-sm"
                    >
                      <RefreshCw size={12} />
                      Re-sync
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
