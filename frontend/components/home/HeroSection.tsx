"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HomeLayoutSection } from "@/types/home";

interface HeroSectionProps {
  section?: HomeLayoutSection;
}

export default function HeroSection({ section }: HeroSectionProps) {
  const title = section?.title || "HIỆU NĂNG ĐỈNH CAO. THIẾT KẾ ĐỘT PHÁ.";
  const subtitle = section?.subtitle || "Bộ sưu tập công nghệ 2026";

  return (
    <section className="relative w-full border-b border-black dark:border-zinc-800 overflow-hidden">
      <div className="w-[1920px] max-w-full mx-auto min-h-[550px] md:min-h-[700px] lg:min-h-[800px] relative flex flex-col justify-end p-6 md:p-12 lg:p-16">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/figma/hero_bg.png"
            alt="ShopWise Hero Banner"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 space-y-4 max-w-3xl text-white">
          <span className="px-3.5 py-1 bg-[#C5FA1F] text-black text-xs font-black uppercase tracking-wider inline-block">
            {subtitle}
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-balance">
            {title}
          </h1>
          <p className="text-base sm:text-xl text-zinc-200 line-clamp-2">
            Khám phá các dòng Laptop AI, MacBook M5 và điện thoại cao cấp chính hãng với ưu đãi đặc quyền từ ShopWise.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="px-8 py-4 bg-black text-white font-bold text-base hover:bg-[#C5FA1F] hover:text-black transition-all border border-white dark:border-black flex items-center gap-2 uppercase tracking-wider"
            >
              Khám phá Cửa Hàng <ArrowUpRight size={20} />
            </Link>
            <Link
              href="/shop?categorySlug=laptop"
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold text-base hover:bg-white hover:text-black transition-all border border-white/30 flex items-center gap-2 uppercase tracking-wider"
            >
              Xem Laptop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
