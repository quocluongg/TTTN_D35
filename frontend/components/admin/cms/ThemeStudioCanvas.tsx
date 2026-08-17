"use client";

import { HomeLayoutSection } from "@/types/home";
import HeroSection from "@/components/home/HeroSection";
import MarqueeTickerSection from "@/components/home/MarqueeTickerSection";
import ProductShowcaseSection from "@/components/home/ProductShowcaseSection";
import BuyByNeedSection from "@/components/home/BuyByNeedSection";
import CategoryGridSection from "@/components/home/CategoryGridSection";
import NewsJournalSection from "@/components/home/NewsJournalSection";
import { ViewportMode } from "./ThemeStudioHeader";
import { Edit3, Info, Monitor, Smartphone, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ThemeStudioCanvasProps {
  viewport: ViewportMode;
  onViewportChange: (vp: ViewportMode) => void;
  sections: HomeLayoutSection[];
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  previewProducts?: any[];
  previewArticles?: any[];
  banners?: any[];
  logoUrl?: string;
  desktopLogoSize?: number;
  mobileLogoSize?: number;
}

export default function ThemeStudioCanvas({
  viewport,
  onViewportChange,
  sections,
  selectedSectionId,
  onSelectSection,
  previewProducts = [],
  previewArticles = [],
  banners = [],
  logoUrl = "",
  desktopLogoSize = 140,
  mobileLogoSize = 90,
}: ThemeStudioCanvasProps) {
  const isMobile = viewport === "mobile";
  const currentLogoWidth = isMobile ? mobileLogoSize : desktopLogoSize;

  const renderSectionComponent = (sec: HomeLayoutSection) => {
    switch (sec.sectionKey) {
      case "HERO_BANNER":
        return <HeroSection key={sec.id || "hero"} section={sec} banners={banners} />;
      case "MARQUEE_TICKER":
        return <MarqueeTickerSection key={sec.id || "ticker"} section={sec} />;
      case "FEATURED_PRODUCTS":
        return (
          <ProductShowcaseSection
            key={sec.id || "products"}
            section={sec}
            products={previewProducts}
          />
        );
      case "BUY_BY_NEED":
        return <BuyByNeedSection key={sec.id || "buy-need"} section={sec} />;
      case "FEATURED_CATEGORIES":
        return <CategoryGridSection key={sec.id || "categories"} section={sec} />;
      case "NEWS_JOURNAL":
        return (
          <NewsJournalSection
            key={sec.id || "news"}
            section={sec}
            articles={previewArticles}
          />
        );
      case "BRAND_LOGOS":
        return (
          <div key={sec.id || "brands"} className="p-8 text-center bg-gray-50">
            <p className="text-sm font-bold text-gray-600">{sec.title || "Thương hiệu đối tác"}</p>
            <p className="text-xs text-gray-400 mt-1">Brand logos will display here on the live site</p>
          </div>
        );
      default:
        return (
          <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-300 rounded-xl my-2">
            Section <strong>{sec.sectionKey}</strong> — {sec.title || "Tùy chỉnh"}
          </div>
        );
    }
  };

  const activeSections = sections.filter((s) => s.enabled);

  return (
    <div className="flex-1 bg-[#ebebeb] flex flex-col overflow-hidden select-none">
      {/* Top info bar: viewport switcher + preview hint text */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-2.5 bg-[#ebebeb] border-b border-[#d8d8d8]">
        {/* Viewport Switcher — 2 small icon buttons */}
        <div className="flex items-center gap-0.5 bg-white border border-gray-300 rounded-lg p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => onViewportChange("desktop")}
            title="Máy tính"
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewport === "desktop"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Monitor size={14} />
          </button>
          <button
            type="button"
            onClick={() => onViewportChange("mobile")}
            title="Điện thoại"
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewport === "mobile"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Smartphone size={14} />
          </button>
        </div>

        {/* Info text — mirrors reference image */}
        <div className="text-center">
          <p className="text-[11px] font-medium text-gray-600 leading-tight">
            This is your visitor preview. Click any section to edit it.
          </p>
          <p className="text-[10px] text-gray-400">
            Any updates you make will instantly reflect here.
          </p>
        </div>
      </div>

      {/* Canvas Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start">
        {/* Viewport Frame */}
        <div
          className={`transition-all duration-300 bg-white text-gray-900 relative flex flex-col ${
            viewport === "desktop"
              ? "w-full max-w-[1100px] rounded-lg border border-gray-300 shadow-lg min-h-full"
              : viewport === "tablet"
              ? "w-[768px] max-w-full rounded-2xl border-4 border-gray-500 my-2 h-[820px] overflow-y-auto shadow-xl"
              : "w-[390px] max-w-full rounded-[36px] border-8 border-gray-800 my-2 h-[720px] overflow-y-auto shadow-2xl"
          }`}
        >


          {/* Live Canvas Content */}
          <div className="flex-1 space-y-0 relative">
            {activeSections.length > 0 ? (
              activeSections.map((sec) => {
                const isSelected = selectedSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    onClick={() => onSelectSection(sec.id)}
                    className={`group relative transition-all duration-200 cursor-pointer border-2 ${
                      isSelected
                        ? "border-blue-500 shadow-lg shadow-blue-100 z-10"
                        : "border-transparent hover:border-blue-300/60"
                    }`}
                  >
                    {/* Floating Edit Badge */}
                    <div
                      className={`absolute top-2 right-2 z-20 transition-all duration-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow ${
                        isSelected
                          ? "bg-blue-600 text-white opacity-100 scale-100"
                          : "bg-gray-900/80 text-white opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                      }`}
                    >
                      <Edit3 size={11} />
                      <span>{sec.title || sec.sectionKey}</span>
                    </div>

                    {renderSectionComponent(sec)}
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                <Info size={28} className="text-gray-300" />
                <p className="font-semibold text-sm text-gray-500">Chưa có Section nào được bật</p>
                <p className="text-xs text-gray-400">
                  Bật công khai các section ở sidebar bên phải.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Footer: Back + View Demo (matches reference image) */}
      <div className="shrink-0 bg-[#ebebeb] border-t border-[#d8d8d8] px-5 py-2.5 flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={13} />
          Back
        </Link>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm cursor-pointer"
        >
          View Demo
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

