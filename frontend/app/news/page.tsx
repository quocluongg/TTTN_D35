"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { getStrapiArticles, FALLBACK_ARTICLES, Article } from "@/services/strapiNewsService";
import { ArrowUpRight, Search, Newspaper } from "lucide-react";

export default function NewsListingPage() {
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(FALLBACK_ARTICLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isStrapiLive, setIsStrapiLive] = useState(false);

  useEffect(() => {
    getStrapiArticles().then((data) => {
      if (data && data.length > 0) {
        setArticles(data);
        setFilteredArticles(data);
        setIsStrapiLive(true);
      }
    });
  }, []);

  useEffect(() => {
    let result = articles;
    if (selectedCategory !== "all") {
      result = result.filter(
        (a) => a.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }
    setFilteredArticles(result);
  }, [searchQuery, selectedCategory, articles]);

  const categories = ["all", "Điện thoại", "Máy tính", "Tư vấn"];

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300 min-h-[calc(100vh-60px)]">
        
        {/* PAGE HEADER BANNER */}
        <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-16 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#623CEA] text-white text-xs font-bold uppercase tracking-wider">
                Strapi CMS
              </span>
              <span className="px-3 py-1 bg-[#C5FA1F] text-black text-xs font-bold uppercase tracking-wider">
                Tin Tức & Công Nghệ
              </span>
              {isStrapiLive && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                  Connected
                </span>
              )}
            </div>

            <h1 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight leading-none">
              Stories that Move
            </h1>

            <p className="text-[18px] sm:text-[22px] text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Cập nhật những xu hướng công nghệ mới nhất, đánh giá sản phẩm chuyên sâu và mẹo sử dụng thiết bị hiệu quả được phát hành trực tiếp qua hệ thống Strapi CMS.
            </p>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-6">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 text-sm font-bold border border-black dark:border-white transition-colors cursor-pointer capitalize ${
                      selectedCategory === cat
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black"
                    }`}
                  >
                    {cat === "all" ? "Tất cả bài viết" : cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin tức..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[46px] pl-12 pr-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ARTICLES GRID */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-16">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Newspaper className="w-16 h-16 text-zinc-400 mx-auto" />
                <h3 className="text-2xl font-bold">Không tìm thấy bài viết nào</h3>
                <p className="text-zinc-500">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc danh mục.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="group bg-white dark:bg-zinc-900 border border-black dark:border-zinc-800 flex flex-col justify-between p-6 lg:p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="space-y-6">
                      <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block">
                          {article.date}
                        </span>
                        {article.category && (
                          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                            {article.category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-[22px] font-bold leading-tight group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>

                      <p className="text-[16px] text-zinc-600 dark:text-zinc-300 font-normal line-clamp-3 leading-relaxed">
                        {article.description}
                      </p>
                    </div>

                    <div className="pt-8">
                      <Link
                        href={article.link}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#F2F2F2] dark:bg-zinc-800 border border-black dark:border-zinc-700 text-black dark:text-white text-[16px] font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        Đọc bài viết
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
