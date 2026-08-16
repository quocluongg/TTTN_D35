"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HomeLayoutSection } from "@/types/home";

interface NewsJournalSectionProps {
  section?: HomeLayoutSection;
  articles: any[];
}

export default function NewsJournalSection({ section, articles }: NewsJournalSectionProps) {
  const title = section?.title || "Tin tức & Xu hướng";
  const subtitle = section?.subtitle || "ShopWise Journal";

  if (!articles || articles.length === 0) return null;

  return (
    <section className="w-full">
      <div className="w-[1920px] max-w-full mx-auto">
        {/* Header Title */}
        <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
              {subtitle}
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
              {title}
            </h2>
          </div>

          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-[#C5FA1F] hover:text-black transition-colors self-start md:self-auto uppercase tracking-wider"
          >
            Tất cả tin tức
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black dark:border-zinc-800">
          {articles.slice(0, 3).map((article) => (
            <div
              key={article.id}
              className="group bg-white dark:bg-zinc-900 flex flex-col justify-between p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-colors"
            >
              <div className="space-y-5">
                {/* Thumbnail Image */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-black/10">
                  <Image
                    src={article.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <span className="text-xs font-bold text-zinc-500 font-mono block">
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                </span>

                <h3 className="text-xl font-bold leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                  <Link href={`/news/${article.slug}`}>
                    {article.title}
                  </Link>
                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-normal line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-200">
                <Link
                  href={`/news/${article.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F2F2F2] dark:bg-zinc-800 border border-black dark:border-zinc-700 text-black dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                >
                  Đọc bài viết
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
