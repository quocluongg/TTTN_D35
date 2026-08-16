"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  Filter,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Tag,
  DollarSign,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface Chunk {
  id: string;
  product_id: string;
  product_name: string;
  chunk_type: string;
  text_preview: string;
  brand: string;
  category: string;
  price: number;
}

interface ChunksResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  chunks: Chunk[];
}

async function fetchChunks(page: number, pageSize: number, chunkType?: string, brand?: string, search?: string): Promise<ChunksResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (chunkType) params.append("chunk_type", chunkType);
  if (brand) params.append("brand", brand);
  if (search) params.append("search", search);

  const res = await fetch(`${API_URL}/admin/rag/chunks?${params}`);
  if (!res.ok) throw new Error("Failed to fetch chunks");
  return res.json();
}

async function deleteChunk(chunkId: string) {
  const res = await fetch(`${API_URL}/admin/rag/chunks/${chunkId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete chunk");
  return res.json();
}

async function rebuildIndex() {
  const res = await fetch(`${API_URL}/admin/rag/chunks/rebuild`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to rebuild index");
  return res.json();
}

const CHUNK_TYPES = ["spec", "description", "faq", "policy"];
const BRANDS = ["HP", "Dell", "ASUS", "Acer", "MSI", "Lenovo", "Apple", "Samsung"];

export default function ChunksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [chunkType, setChunkType] = useState("");
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rag-chunks", page, chunkType, brand, search],
    queryFn: () => fetchChunks(page, pageSize, chunkType || undefined, brand || undefined, search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChunk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-chunks"] });
    },
  });

  const rebuildMutation = useMutation({
    mutationFn: rebuildIndex,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-chunks"] });
      alert("Rebuild index thành công!");
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getChunkTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      spec: "bg-blue-100 text-blue-800",
      description: "bg-green-100 text-green-800",
      faq: "bg-purple-100 text-purple-800",
      policy: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-zinc-100 text-zinc-800";
  };

  return (
    <section>
      {/* Header */}
      <div className="border-b border-black pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium">Quản lý Chunks</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {data?.total ?? 0} chunks trong hệ thống
          </p>
        </div>
        <button
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-zinc-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={rebuildMutation.isPending ? "animate-spin" : ""} />
          {rebuildMutation.isPending ? "Đang rebuild…" : "Rebuild Index"}
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 border border-black bg-white p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm chunks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-3 py-2 border border-zinc-300 rounded text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-zinc-100 border border-zinc-300 rounded hover:bg-zinc-200"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* Chunk Type Filter */}
          <select
            value={chunkType}
            onChange={(e) => { setChunkType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-zinc-300 rounded text-sm"
          >
            <option value="">Tất cả loại</option>
            {CHUNK_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-zinc-300 rounded text-sm"
          >
            <option value="">Tất cả hãng</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chunks List */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500">Đang tải...</div>
        ) : data?.chunks.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">Không tìm thấy chunks</div>
        ) : (
          data?.chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="border border-black bg-white p-4 hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getChunkTypeColor(chunk.chunk_type)}`}>
                      {chunk.chunk_type}
                    </span>
                    <span className="text-sm font-medium">{chunk.product_name}</span>
                    {chunk.brand && (
                      <span className="text-xs text-zinc-500">({chunk.brand})</span>
                    )}
                  </div>

                  {/* Text Preview */}
                  <p className="text-sm text-zinc-600 line-clamp-2">
                    {chunk.text_preview}
                  </p>

                  {/* Meta */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {chunk.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      {formatPrice(chunk.price)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {chunk.id.substring(0, 20)}...
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn xóa chunk này?")) {
                      deleteMutation.mutate(chunk.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                  title="Xóa chunk"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between border border-black bg-white p-4">
          <span className="text-sm text-zinc-600">
            Trang {data.page} / {data.total_pages} ({data.total} chunks)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
              className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
