"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HomeLayoutSection } from "@/types/home";

interface CategoryGridSectionProps {
  section?: HomeLayoutSection;
}

export default function CategoryGridSection({ section }: CategoryGridSectionProps) {
  const title = section?.title || "Danh mục nổi bật";

  return (
    <section className="w-full border-b border-black dark:border-zinc-800">
      <div className="w-[1920px] max-w-full mx-auto">
        {/* Header Title */}
        <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
            {title}
          </h2>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black dark:divide-zinc-800">
          {/* Category 1: Điện thoại */}
          <div className="relative group aspect-[4/5] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end">
            <Image
              src="/figma/cat_phone.png"
              alt="Điện thoại"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="relative z-10">
              <Link
                href="/shop?categorySlug=dien-thoai"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors shadow-md"
              >
                Điện thoại Smartphone
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Category 2: Máy tính xách tay */}
          <div className="relative group aspect-[4/5] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end">
            <Image
              src="/figma/cat_laptop.png"
              alt="Máy tính xách tay"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="relative z-10">
              <Link
                href="/shop?categorySlug=laptop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors shadow-md"
              >
                Máy tính Laptop
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Category 3: Phụ kiện */}
          <div className="relative group aspect-[4/5] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end">
            <Image
              src="/figma/cat_acc.png"
              alt="Phụ kiện"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="relative z-10">
              <Link
                href="/shop?categorySlug=phu-kien"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors shadow-md"
              >
                Phụ kiện công nghệ
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
