"use client";

import React, { useState, useEffect } from "react";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { productService, ProductListItem } from "@/services/productServices";
import { newsService } from "@/services/newsService";
import { homeService } from "@/services/homeService";
import { HomeLayoutSection } from "@/types/home";

import HomepageSkeleton from "@/components/home/HomepageSkeleton";
import HeroSection from "@/components/home/HeroSection";
import MarqueeTickerSection from "@/components/home/MarqueeTickerSection";
import ProductShowcaseSection from "@/components/home/ProductShowcaseSection";
import BuyByNeedSection from "@/components/home/BuyByNeedSection";
import CategoryGridSection from "@/components/home/CategoryGridSection";
import NewsJournalSection from "@/components/home/NewsJournalSection";
import BrandLogosSection from "@/components/home/BrandLogosSection";

const unwrap = (x: any) => x?.data ?? x;

export default function HomePage() {
  const [layoutSections, setLayoutSections] = useState<HomeLayoutSection[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingLayout, setLoadingLayout] = useState(true);

  // 1. Fetch Dynamic Homepage Layout from Backend API
  useEffect(() => {
    homeService
      .getLayout()
      .then((res: any) => {
        const payload = unwrap(res);
        if (Array.isArray(payload) && payload.length > 0) {
          setLayoutSections(payload);
        }
      })
      .catch((err) => console.error("Lỗi load layout trang chủ:", err))
      .finally(() => setLoadingLayout(false));
  }, []);

  // 2. Load banners
  useEffect(() => {
    homeService
      .banners()
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data)) setBanners(data);
      })
      .catch(() => {});
  }, []);

  // 3. Load brands
  useEffect(() => {
    homeService
      .brands()
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(() => {});
  }, []);

  // 4. Load sản phẩm nổi bật
  useEffect(() => {
    productService
      .getProducts({ size: 10, sortBy: "createdAt" })
      .then((res: any) => {
        const payload = unwrap(res) || {};
        const items = payload.items || payload.content || (Array.isArray(payload) ? payload : []);
        if (items.length > 0) {
          setBestSellers(items);
        }
      })
      .catch((err) => console.error("Lỗi load sản phẩm trang chủ:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  // 5. Load tin tức mới nhất
  useEffect(() => {
    newsService
      .recent(3)
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      })
      .catch((err) => console.error("Lỗi load tin tức trang chủ:", err));
  }, []);

  // Helper to render individual section by sectionKey
  const renderSectionComponent = (section: HomeLayoutSection) => {
    if (!section || !section.enabled) return null;

    switch (section.sectionKey) {
      case "HERO_BANNER":
        return <HeroSection key={section.id || "hero"} section={section} banners={banners} />;
      case "MARQUEE_TICKER":
        return <MarqueeTickerSection key={section.id || "ticker"} section={section} />;
      case "FEATURED_PRODUCTS": {
        let limit = 10;
        try {
          const config = section.configJson ? JSON.parse(section.configJson) : {};
          if (config.limit) limit = config.limit;
        } catch {}
        const limitedProducts = bestSellers.slice(0, limit);
        return (
          <ProductShowcaseSection
            key={section.id || "products"}
            section={section}
            products={limitedProducts}
            loading={loadingProducts}
          />
        );
      }
      case "BUY_BY_NEED":
        return <BuyByNeedSection key={section.id || "buy-need"} section={section} />;
      case "FEATURED_CATEGORIES":
        return <CategoryGridSection key={section.id || "categories"} section={section} />;
      case "NEWS_JOURNAL":
        return <NewsJournalSection key={section.id || "news"} section={section} articles={articles} />;
      case "BRAND_LOGOS":
        return <BrandLogosSection key={section.id || "brands"} section={section} brands={brands} />;
      default:
        return null;
    }
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
        {loadingLayout ? (
          <HomepageSkeleton />
        ) : layoutSections.length > 0 ? (
          // Render sections in order returned by API
          layoutSections.map((section) => renderSectionComponent(section))
        ) : (
          // Fallback Default Order if API response is empty or unreached
          <>
            <HeroSection banners={banners} />
            <MarqueeTickerSection />
            <ProductShowcaseSection products={bestSellers} loading={loadingProducts} />
            <BuyByNeedSection />
            <CategoryGridSection />
            <NewsJournalSection articles={articles} />
            <BrandLogosSection brands={brands} />
          </>
        )}
      </div>
    </PublicLayout>
  );
}
