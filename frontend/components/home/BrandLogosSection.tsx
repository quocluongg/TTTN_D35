"use client";

import React from "react";
import Image from "next/image";
import { HomeLayoutSection } from "@/types/home";

interface BrandItem {
  id?: string;
  name?: string;
  logoUrl?: string;
  isActive?: boolean;
}

interface BrandLogosSectionProps {
  section?: HomeLayoutSection;
  brands?: BrandItem[];
}

export default function BrandLogosSection({ section, brands = [] }: BrandLogosSectionProps) {
  const title = section?.title || "Thương hiệu đối tác";
  const subtitle = section?.subtitle || "Đối tác chính hãng";

  const activeBrands = brands.filter((b) => b.isActive !== false);

  if (activeBrands.length === 0) return null;

  return (
    <section className="w-full border-b border-black dark:border-zinc-800">
      <div className="w-[1920px] max-w-full mx-auto">
        {/* Header Title */}
        <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
              {subtitle}
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
              {title}
            </h2>
          </div>
        </div>

        {/* Brand Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y divide-black dark:divide-zinc-800">
          {activeBrands.map((brand) => (
            <div
              key={brand.id || brand.name}
              className="group relative flex items-center justify-center p-8 bg-white dark:bg-zinc-900 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-colors aspect-square"
            >
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={brand.name || "Brand"}
                  fill
                  className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <span className="text-sm font-bold text-zinc-400">{brand.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
