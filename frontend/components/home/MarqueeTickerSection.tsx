"use client";

import React from "react";
import { HomeLayoutSection } from "@/types/home";

interface MarqueeTickerSectionProps {
  section?: HomeLayoutSection;
}

export default function MarqueeTickerSection({ section }: MarqueeTickerSectionProps) {
  const text = section?.subtitle || "⚡ MUA HÀNG CHÍNH HÃNG HỎA TỐC 2H • MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC DÀNH CHO ĐƠN HÀNG TRÊN 1 TRIỆU • BẢO HÀNH ĐIỆN TỬ 1 ĐỔI 1 TRONG 30 NGÀY";

  return (
    <section className="w-full bg-[#C5FA1F] border-b border-black text-black overflow-hidden py-4">
      <div className="animate-marquee whitespace-nowrap text-lg md:text-2xl font-black uppercase tracking-wider flex items-center">
        {Array.from({ length: 8 }).map((_, idx) => (
          <span key={idx} className="inline-flex items-center gap-6 mx-4">
            <span>{text}</span>
            <span>•</span>
          </span>
        ))}
      </div>
    </section>
  );
}
