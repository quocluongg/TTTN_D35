"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { FALLBACK_ARTICLES } from "@/services/strapiNewsService";
import { ArrowLeft, Calendar, Tag, Share2, Bookmark } from "lucide-react";

export default function NewsDetailPage() {
  const params = useParams();
  const slug = (params.slug as string) || "huawei-pura-90s-pro";

  const article =
    FALLBACK_ARTICLES.find((a) => a.slug === slug || a.link.includes(slug)) ||
    FALLBACK_ARTICLES[0];

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300 min-h-[calc(100vh-60px)]">
        
        {/* ARTICLE HERO BANNER */}
        <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="w-[1200px] max-w-full mx-auto p-8 lg:p-16 space-y-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách tin tức
            </Link>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#623CEA] text-white text-xs font-bold uppercase tracking-wider">
                  Strapi CMS Article
                </span>
                {article.category && (
                  <span className="px-3 py-1 bg-[#C5FA1F] text-black text-xs font-bold uppercase tracking-wider">
                    {article.category}
                  </span>
                )}
              </div>

              <h1 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold tracking-tight leading-tight">
                {article.title}
              </h1>

              <div className="flex items-center gap-6 text-sm text-zinc-500 font-medium border-y border-black/10 dark:border-white/10 py-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>Tác giả: Ban Biên Tập ShopWise</span>
                </div>
              </div>
            </div>

            {/* Main Article Image */}
            <div className="relative w-full aspect-[16/9] overflow-hidden border border-black dark:border-zinc-700">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* ARTICLE CONTENT BODY */}
        <section className="w-full py-12 lg:py-16">
          <div className="w-[900px] max-w-full mx-auto p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-800 space-y-8">
            <p className="text-[20px] sm:text-[22px] font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed italic border-l-4 border-[#C5FA1F] pl-4">
              {article.description}
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-[18px] leading-relaxed">
              <p>
                Thị trường thiết bị thông minh vừa đón nhận một bước tiến vượt bậc với việc ra mắt các dòng sản phẩm mới. Những nâng cấp về vi xử lý AI, màn hình sắc nét và khả năng tối ưu hóa pin vượt trội hứa hẹn mang đến trải nghiệm làm việc và giải trí liền mạch.
              </p>

              <h3 className="text-2xl font-bold pt-4">Thiết kế đột phá và chất lượng hoàn thiện</h3>
              <p>
                Sở hữu khung kim loại nguyên khối chống va đập cùng các đường nét hoàn thiện tinh xảo, thiết bị đáp ứng các tiêu chuẩn khắt khe nhất của người dùng công nghệ hiện đại. Màn hình thế hệ mới mang lại dải màu trung thực, giảm ánh sáng xanh bảo vệ mắt trong quá trình sử dụng lâu dài.
              </p>

              <h3 className="text-2xl font-bold pt-4">Hiệu năng ấn tượng và Thời lượng Pin</h3>
              <p>
                Nhờ vào thuật toán quản lý năng lượng thông minh từ Strapi CMS backend, thiết bị giúp kéo dài thời gian hoạt động liên tục hơn 20% so với các thế hệ tiền nhiệm.
              </p>
            </div>

            {/* Article Footer & Action Share */}
            <div className="pt-8 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Bookmark className="w-4 h-4" /> ShopWise Tech News
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 border border-black dark:border-white hover:bg-black hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
