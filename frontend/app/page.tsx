"use client";

import React from "react";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-900 transition-colors duration-300">

        {/* --- SECTION 1: TOP 4-COLUMN ARCHITECTURAL GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 w-[1920px] max-w-full mx-auto bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white border-b border-black dark:border-zinc-800">

          {/* Column 1: Shop Categories */}
          <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-black dark:border-zinc-800 flex flex-col justify-start space-y-4">
            <Link href="/shop" className="block text-[24px] font-medium hover:underline tracking-tight">
              Shop All
            </Link>
            <Link href="/shop/smartphones" className="block text-[24px] font-medium hover:underline tracking-tight">
              Smartphones
            </Link>
            <Link href="/shop/laptops" className="block text-[24px] font-medium hover:underline tracking-tight">
              Laptops
            </Link>
            <Link href="/shop/tablets" className="block text-[24px] font-medium hover:underline tracking-tight">
              Tablets
            </Link>
            <Link href="/shop/accessories" className="block text-[24px] font-medium hover:underline tracking-tight">
              Accessories
            </Link>
          </div>

          {/* Column 2: Featured Collections */}
          <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-black dark:border-zinc-800 flex flex-col justify-start space-y-4">
            <Link href="/collections/new-arrivals" className="block text-[24px] font-medium hover:underline tracking-tight">
              New Arrivals
            </Link>
            <Link href="/collections/best-sellers" className="block text-[24px] font-medium hover:underline tracking-tight">
              Best Sellers
            </Link>
            <Link href="/collections/work-essentials" className="block text-[24px] font-medium hover:underline tracking-tight">
              Work Essentials
            </Link>
            <Link href="/collections/deals" className="block text-[24px] font-medium hover:underline tracking-tight">
              Deals of the Week
            </Link>
          </div>

          {/* Column 3: Laptop Promo Card */}
          <div className="border-b lg:border-b-0 lg:border-r border-black dark:border-zinc-800 flex flex-col justify-between group cursor-pointer">
            <div className="flex items-center justify-center bg-[#F2F2F2] dark:bg-zinc-900 h-[280px] px-6 py-4 overflow-hidden">
              <img
                src="https://www.pngall.com/wp-content/uploads/12/Macbook-PNG-Pic.png"
                alt="Laptops Collection"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-6 border-t border-black dark:border-zinc-800 flex justify-between items-start gap-4 bg-[#F2F2F2] dark:bg-zinc-900">
              <span className="text-[20px] font-medium leading-snug tracking-tight">
                Powerful performance. Sleek design. Built for work, gaming.
              </span>
              <ArrowUpRight className="w-6 h-6 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </div>

          {/* Column 4: Tablet / Lifestyle Promo Card */}
          <div className="flex flex-col justify-between group cursor-pointer">
            <div className="h-[280px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=600&auto=format&fit=crop"
                alt="Tablets Lifestyle"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6 border-t border-black dark:border-zinc-800 flex justify-between items-start gap-4 bg-[#F2F2F2] dark:bg-zinc-900">
              <span className="text-[20px] font-medium leading-snug tracking-tight">
                Explore electronics for home offices and gaming setups.
              </span>
              <ArrowUpRight className="w-6 h-6 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </div>

        </div>

        {/* --- SECTION 2: MIDDLE SPLIT HERO SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 w-[1920px] max-w-full mx-auto bg-[#F2F2F2] dark:bg-zinc-900 border-b border-black dark:border-zinc-800">

          {/* Left Split: Silver Block with "Read More" button */}
          <div className="bg-[#C5C5C5] dark:bg-zinc-800 p-12 lg:p-24 flex flex-col justify-start items-start min-h-[400px] lg:min-h-[600px] transition-colors duration-300">
            <Link
              href="/journal"
              className="bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-[20px] font-medium px-8 py-5 h-auto rounded-none border-none inline-flex items-center gap-2 group tracking-tight transition-colors"
            >
              Read More
              <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Right Split: Large Tech/Activewear Image */}
          <div className="relative h-[400px] lg:h-[600px] w-full lg:border-l border-black dark:border-zinc-800 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200&auto=format&fit=crop"
              alt="Lifestyle Showcase"
              className="w-full h-full object-cover"
            />
          </div>

        </div>

        {/* --- SECTION 3: FOOTER BAR / BOTTOM MENU --- */}
        <div className="w-[1920px] max-w-full mx-auto py-8 bg-[#C5C5C5] dark:bg-zinc-800 text-black dark:text-white border-b border-black dark:border-zinc-800 flex flex-wrap justify-center items-center gap-8 lg:gap-16 font-medium text-[20px] tracking-tight transition-colors duration-300">
          <Link href="/journal/articles" className="hover:underline">
            All Articles
          </Link>
          <Link href="/journal/press" className="hover:underline">
            Press Releases
          </Link>
          <Link href="/collections" className="hover:underline">
            Collections
          </Link>
          <Link href="/lifestyle" className="hover:underline">
            Lifestyle
          </Link>
        </div>

      </div>
    </PublicLayout>
  );
}
