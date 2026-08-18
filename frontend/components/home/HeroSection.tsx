"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { HomeLayoutSection } from "@/types/home";

export interface HomeBannerItem {
  id?: string;
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface HeroSectionProps {
  section?: HomeLayoutSection;
  banners?: HomeBannerItem[];
}

export default function HeroSection({ section, banners = [] }: HeroSectionProps) {
  const activeBanners = banners.filter((b) => b.isActive !== false);

  // Fallback slide list if no active banners exist
  const defaultSlides: HomeBannerItem[] = [
    {
      id: "default-1",
      title: section?.title || "HIỆU NĂNG ĐỈNH CAO. THIẾT KẾ ĐỘT PHÁ.",
      imageUrl: "/figma/hero_bg.png",
      linkUrl: "/shop",
    },
  ];

  const slides = activeBanners.length > 0 ? activeBanners : defaultSlides;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Autoplay slideshow every 5s if more than 1 slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];
  const title = currentSlide?.title || section?.title || "HIỆU NĂNG ĐỈNH CAO. THIẾT KẾ ĐỘT PHÁ.";
  const subtitle = section?.subtitle || "Bộ sưu tập công nghệ 2026";
  const linkUrl = currentSlide?.linkUrl || "/shop";
  const bgImg = currentSlide?.imageUrl || "/figma/hero_bg.png";

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative w-full border-b border-black dark:border-zinc-800 overflow-hidden group select-none">
      <div className="w-[1920px] max-w-full mx-auto min-h-[480px] sm:min-h-[580px] md:min-h-[680px] relative flex flex-col justify-end p-6 md:p-12 lg:p-16 transition-all">
        {/* Background Image / Slide */}
        <div className="absolute inset-0 z-0 bg-zinc-900">
          {bgImg ? (
            <img
              key={bgImg + currentIndex}
              src={bgImg}
              alt={title}
              className="w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out"
            />
          ) : (
            <Image
              src="/figma/hero_bg.png"
              alt="ShopWise Hero Banner"
              fill
              priority
              className="object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Next / Prev Arrow Controls (visible when > 1 slide) */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black hover:scale-110 backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Slide trước"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black hover:scale-110 backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Slide kế tiếp"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 space-y-4 max-w-3xl text-white">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 bg-[#C5FA1F] text-black text-xs font-black uppercase tracking-wider inline-block rounded-xs">
              {subtitle}
            </span>
            {slides.length > 1 && (
              <span className="px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[10px] font-mono font-bold rounded border border-white/20">
                SLIDE {currentIndex + 1} / {slides.length}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-balance transition-all">
            {title}
          </h1>

          <p className="text-sm sm:text-lg text-zinc-200 line-clamp-2">
            Khám phá các dòng Laptop AI, MacBook M5 và điện thoại cao cấp chính hãng với ưu đãi đặc quyền từ ShopWise.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href={linkUrl}
              className="px-7 py-3.5 bg-black text-white font-bold text-sm sm:text-base hover:bg-[#C5FA1F] hover:text-black transition-all border border-white dark:border-black flex items-center gap-2 uppercase tracking-wider rounded-lg"
            >
              Khám phá Cửa Hàng <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>

        {/* Slide Pagination Dots Indicator */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "w-8 bg-[#C5FA1F]"
                    : "w-2 bg-white/50 hover:bg-white"
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

