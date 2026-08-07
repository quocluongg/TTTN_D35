"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { newsService } from "@/services/newsService";
import { ArrowLeft, Calendar, Eye, User, Share2, Tag, ArrowUpRight } from "lucide-react";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function NewsDetailPage() {
  const params = useParams();
  const slug = (params.slug as string) || "";

  // Query bài viết theo slug
  const articleQuery = useQuery({
    queryKey: ["news-detail", slug],
    queryFn: () => newsService.get(slug),
    enabled: !!slug,
  });

  // Query các bài viết liên quan / mới nhất
  const recentQuery = useQuery({
    queryKey: ["news-recent"],
    queryFn: () => newsService.recent(3),
  });

  const article: Any = unwrap(articleQuery.data) || {};
  const recentArticles: Any[] = unwrap(recentQuery.data) || [];

  if (articleQuery.isLoading) {
    return (
      <PublicLayout fullWidth>
        <div className="min-h-screen grid place-items-center bg-[#F5F5F7]">
          <p className="text-zinc-500 font-medium">Đang tải nội dung bài viết…</p>
        </div>
      </PublicLayout>
    );
  }

  if (articleQuery.isError || !article || !article.title) {
    return (
      <PublicLayout fullWidth>
        <div className="min-h-screen bg-[#F5F5F7] p-12 text-center space-y-4">
          <h2 className="text-3xl font-bold">Không tìm thấy bài viết</h2>
          <p className="text-zinc-500 text-sm">Bài viết này không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link
            href="/news"
            className="inline-block border border-black bg-black px-6 py-3 text-sm text-white font-bold"
          >
            Quay lại Tin tức
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F5F5F7] text-black font-sans min-h-screen">
        
        {/* ARTICLE HERO BANNER */}
        <section className="w-full border-b border-black bg-white">
          <div className="w-[1200px] max-w-full mx-auto p-6 sm:p-12 lg:p-16 space-y-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={14} /> Quay lại danh sách tin tức
            </Link>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider inline-block">
                {article.category || "Tin tức"}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500 font-mono border-y border-zinc-200 py-3">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                </span>
                <span className="flex items-center gap-1">
                  <User size={14} /> Tác giả: {article.authorName || "Ban Biên Tập ShopWise"}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {article.viewCount || 0} lượt xem
                </span>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative w-full aspect-[16/9] border border-black overflow-hidden bg-zinc-100">
              <Image
                src={article.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* ARTICLE CONTENT BODY */}
        <section className="w-full py-12">
          <div className="w-[900px] max-w-full mx-auto p-6 sm:p-10 bg-white border border-black space-y-8">
            {article.excerpt && (
              <p className="text-lg sm:text-xl font-bold text-zinc-800 leading-relaxed italic border-l-4 border-black pl-4">
                {article.excerpt}
              </p>
            )}

            {/* Render HTML content từ Backend */}
            <div
              className="prose prose-lg max-w-none text-base sm:text-lg leading-relaxed text-zinc-800 space-y-4"
              dangerouslySetInnerHTML={{ __html: article.content || "<p>Nội dung đang được cập nhật...</p>" }}
            />

            {/* Action Footer */}
            <div className="pt-8 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                ShopWise Tech Journal
              </span>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: article.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Đã sao chép đường dẫn bài viết!");
                  }
                }}
                className="inline-flex items-center gap-1.5 border border-black px-4 py-2 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
              >
                <Share2 size={14} /> Chia sẻ bài viết
              </button>
            </div>
          </div>
        </section>

        {/* RECENT ARTICLES SECTION */}
        {recentArticles.length > 0 && (
          <section className="w-full border-t border-black bg-white py-12">
            <div className="w-[1200px] max-w-full mx-auto px-6 space-y-6">
              <h3 className="text-2xl font-bold">Bài viết mới nhất khác</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {recentArticles
                  .filter((a) => a.slug !== slug)
                  .slice(0, 3)
                  .map((rec) => (
                    <Link
                      key={rec.id}
                      href={`/news/${rec.slug}`}
                      className="group border border-black p-4 bg-[#F9F9F9] hover:bg-white transition-colors space-y-3 block"
                    >
                      <div className="relative w-full aspect-[16/10] overflow-hidden border border-black/10">
                        <Image
                          src={rec.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                          alt={rec.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-bold text-base line-clamp-2 group-hover:underline">
                        {rec.title}
                      </h4>
                      <span className="text-xs font-bold uppercase underline inline-flex items-center gap-1">
                        Đọc tiếp <ArrowUpRight size={12} />
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </PublicLayout>
  );
}
