"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { newsService } from "@/services/newsService";
import { ArrowUpRight, Search, Newspaper, Eye, Calendar, User, Tag } from "lucide-react";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

const CATEGORY_MAP: Record<string, { label: string; bg: string }> = {
  ALL: { label: "Tất cả bài viết", bg: "bg-black text-white" },
  TECH: { label: "Công nghệ", bg: "bg-indigo-600 text-white" },
  PROMOTION: { label: "Khuyến mãi", bg: "bg-red-600 text-white" },
  GUIDE: { label: "Hướng dẫn & Mẹo", bg: "bg-emerald-600 text-white" },
  NEWS: { label: "Tin tức", bg: "bg-blue-600 text-white" },
};

export default function NewsListingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  // Fetch tin tức từ Backend API qua React Query
  const newsQuery = useQuery({
    queryKey: ["news-public", selectedCategory, searchQuery, page],
    queryFn: () =>
      newsService.list({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        page,
        size: 9,
      }),
  });

  const rawData: Any = unwrap(newsQuery.data) || {};
  const articles: Any[] = Array.isArray(rawData)
    ? rawData
    : rawData.items || rawData.content || [];
  const pagination = rawData.pagination || {};
  const totalPages = rawData.totalPages || pagination.totalPages || 1;

  const categories = [
    { key: "ALL", name: "Tất cả bài viết" },
    { key: "TECH", name: "Công nghệ" },
    { key: "PROMOTION", name: "Khuyến mãi" },
    { key: "GUIDE", name: "Hướng dẫn" },
    { key: "NEWS", name: "Tin tức" },
  ];

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F5F5F7] text-black font-sans min-h-screen">
        
        {/* HEADER SECTION */}
        <section className="w-full border-b border-black bg-white px-6 py-10 lg:px-12">
          <div className="w-[1920px] max-w-full mx-auto space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <Link href="/" className="hover:text-black">Trang chủ</Link>
              <span>/</span>
              <span className="text-black font-bold">Tin tức công nghệ</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
                  ShopWise Journal
                </span>
                <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                  Tin Tức & Công Nghệ
                </h1>
                <p className="mt-2 text-base text-zinc-600 max-w-2xl">
                  Cập nhật những xu hướng công nghệ mới nhất, đánh giá sản phẩm chuyên sâu và mẹo sử dụng thiết bị hiệu quả từ đội ngũ ShopWise.
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-zinc-200">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setPage(0);
                    }}
                    className={`px-4 py-2 text-xs font-bold border border-black transition-colors cursor-pointer ${
                      selectedCategory === cat.key
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-zinc-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="w-full h-10 pl-10 pr-4 border border-black bg-white text-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ARTICLES GRID SECTION */}
        <section className="w-full border-b border-black">
          <div className="w-[1920px] max-w-full mx-auto p-6 lg:p-12">
            {newsQuery.isLoading ? (
              <div className="py-20 text-center text-zinc-500 font-medium">Đang tải danh sách tin tức…</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 bg-white border border-black space-y-4">
                <Newspaper className="w-16 h-16 text-zinc-400 mx-auto" />
                <h3 className="text-2xl font-bold">Không có bài viết nào</h3>
                <p className="text-sm text-zinc-500">Chưa có bài viết phù hợp với tìm kiếm của bạn.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article: Any) => {
                  const catBadge = CATEGORY_MAP[article.category] || { label: article.category, bg: "bg-black text-white" };

                  return (
                    <article
                      key={article.id}
                      className="group bg-white border border-black flex flex-col justify-between p-6 hover:shadow-lg transition-all"
                    >
                      <div className="space-y-4">
                        <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-100 border border-black/10">
                          <Image
                            src={article.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${catBadge.bg}`}>
                            {catBadge.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("vi-VN") : "Mới đăng"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={13} /> {article.viewCount || 0} lượt xem
                          </span>
                        </div>

                        <h2 className="text-xl font-bold leading-snug group-hover:underline line-clamp-2">
                          <Link href={`/news/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h2>

                        <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                          {article.excerpt || "Đang cập nhật nội dung tóm tắt cho bài viết này..."}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-zinc-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                          <User size={13} /> {article.authorName || "Ban Biên Tập ShopWise"}
                        </span>
                        <Link
                          href={`/news/${article.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold uppercase underline hover:text-indigo-600 transition-colors"
                        >
                          Xem chi tiết <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="border border-black px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Trang trước
                </button>
                <span className="text-xs font-bold px-4">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="border border-black px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
