"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HomeLayoutSection } from "@/types/home";

interface BuyByNeedSectionProps {
  section?: HomeLayoutSection;
}

export default function BuyByNeedSection({ section }: BuyByNeedSectionProps) {
  const title = section?.title || "Mua theo nhu cầu sử dụng";

  return (
    <section className="w-full border-b border-black dark:border-zinc-800">
      <div className="w-[1920px] max-w-full mx-auto">
        {/* Header Title */}
        <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
            {title}
          </h2>
        </div>

        {/* Row 1: 2 Cards (Làm việc & Gaming) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black dark:divide-zinc-800 border-b border-black dark:border-zinc-800">
          {/* Card 1: Làm việc */}
          <Link 
            href="/shop?search=v%C4%83n%20ph%C3%B2ng" 
            className="relative group aspect-[16/10] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end cursor-pointer"
          >
            <Image
              src="/figma/work_sec4.png"
              alt="Laptop Làm việc văn phòng"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </Link>

          {/* Card 2: Gaming */}
          <Link 
            href="/shop?search=gaming" 
            className="relative group aspect-[16/10] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end cursor-pointer"
          >
            <Image
              src="/figma/gaming_sec4.png"
              alt="Laptop Gaming & Đồ họa"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </Link>
        </div>

        {/* Row 2: Image Card + High Impact Copywriting Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black dark:divide-zinc-800">
          {/* Left Banner Image */}
          <div className="relative group min-h-[350px] lg:min-h-[480px] overflow-hidden bg-white dark:bg-zinc-900">
            <Image
              src="/figma/upgrade_sec4.png"
              alt="Thiết kế cho mọi nâng cấp"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Right Content Block */}
          <div className="p-8 lg:p-14 flex flex-col justify-between bg-white dark:bg-zinc-900 space-y-6">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider inline-block">
                Hệ sinh thái ShopWise
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                THIẾT KẾ CHO MỌI NÂNG CẤP DẪN ĐẦU.
              </h3>
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed">
                Từ lúc khởi động máy đến khi hoàn thành deadline hay chiến game mượt mà nhất, thiết bị công nghệ tại ShopWise luôn đồng hành cùng trải nghiệm đỉnh cao của bạn.
              </p>
            </div>

            <div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white dark:bg-white dark:text-black border border-black text-base font-bold uppercase tracking-wider hover:bg-[#C5FA1F] hover:text-black transition-colors"
              >
                Khám phá phụ kiện chính hãng
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
