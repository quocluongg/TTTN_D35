"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star } from "lucide-react";

// Mock Product Data matching Section 3 Figma specification
const BEST_SELLERS = [
  {
    id: "prod-1",
    name: "Carbon Shadow Pro",
    price: 5000000,
    originalPrice: 6000000,
    discountBadge: "-20%",
    statusBadge: "Bán chạy",
    image: "/figma/product_1.png",
    rating: 5.0,
    reviewsCount: 24,
  },
  {
    id: "prod-2",
    name: "Nimbus Drift Frost",
    price: 5000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_2.png",
    rating: 4.9,
    reviewsCount: 18,
  },
  {
    id: "prod-3",
    name: "Voltflare Spectrum",
    price: 5000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_3.png",
    rating: 4.8,
    reviewsCount: 31,
  },
  {
    id: "prod-4",
    name: "Lunar Surge Neon",
    price: 5000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_4.png",
    rating: 5.0,
    reviewsCount: 12,
  },
  {
    id: "prod-5",
    name: "Ashen Path Xtreme",
    price: 5000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_5.png",
    rating: 4.9,
    reviewsCount: 45,
  },
];

// Mock Articles matching Section 6 Figma specification
const ARTICLES = [
  {
    id: "art-1",
    title: "Huawei Pura 90s Pro và Pro Max ra mắt",
    description:
      "Camera tele 200MP cực khủng, màn hình LTPO, chip Kirin 9030S, giá từ 23.84 triệu đồng",
    image: "/figma/article_1.png",
    date: "18 Tháng 7, 2026",
    link: "/news/huawei-pura-90s-pro",
  },
  {
    id: "art-2",
    title: "ProArt P16 và ProArt PX13 tại Việt Nam",
    description:
      "ASUS mới đây vừa chính thức giới thiệu dải sản phẩm laptop đồ họa ProArt thế hệ mới thị trường Việt Nam.",
    image: "/figma/article_2.png",
    date: "15 Tháng 7, 2026",
    link: "/news/asus-proart-p16-px13",
  },
  {
    id: "art-3",
    title: "Có nên mua iPhone 14 Pro Max cũ?",
    description:
      "Có nên mua iPhone 14 Pro Max cũ? Chất lượng có tốt trong 3-4 năm tới?",
    image: "/figma/article_3.png",
    date: "10 Tháng 7, 2026",
    link: "/news/iphone-14-pro-max-review",
  },
];

import { getStrapiArticles, FALLBACK_ARTICLES, Article } from "@/services/strapiNewsService";

export default function HomePage() {
  const [sliderIndex, setSliderIndex] = useState(0);
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES);
  const [isStrapiLoaded, setIsStrapiLoaded] = useState(false);

  useEffect(() => {
    getStrapiArticles().then((fetchedArticles) => {
      if (fetchedArticles && fetchedArticles.length > 0) {
        setArticles(fetchedArticles);
        setIsStrapiLoaded(true);
      }
    });
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  const handlePrevSlide = () => {
    setSliderIndex((prev) => (prev === 0 ? BEST_SELLERS.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setSliderIndex((prev) => (prev === BEST_SELLERS.length - 1 ? 0 : prev + 1));
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
        
        {/* =========================================================================
            SECTION 1: HERO BANNER SECTION
           ========================================================================= */}
        <section className="relative w-full border-b border-black dark:border-zinc-800 overflow-hidden">
          <div className="w-[1920px] max-w-full mx-auto min-h-[600px] md:min-h-[750px] lg:min-h-[850px] relative flex flex-col justify-end p-6 md:p-12 lg:p-16">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/figma/hero_bg.png"
                alt="ShopWise Hero Background"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl space-y-6 text-white pb-6">
              <h1 className="text-[36px] sm:text-[60px] md:text-[80px] lg:text-[110px] xl:text-[128px] font-bold leading-[0.95] tracking-tight text-balance">
                Tìm kiếm công nghệ tuyệt vời, có sự hỗ trợ của AI!
              </h1>

              <div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#F2F2F2] text-black border border-black text-[20px] md:text-[24px] font-semibold hover:bg-black hover:text-white hover:border-white transition-all cursor-pointer shadow-lg"
                >
                  Mua thôi
                  <ArrowUpRight className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: MARQUEE TICKER BANNER (#C5FA1F)
           ========================================================================= */}
        <section className="w-full bg-[#C5FA1F] border-b border-black text-black overflow-hidden py-5">
          <div className="animate-marquee whitespace-nowrap text-[20px] md:text-[26px] lg:text-[32px] font-bold uppercase tracking-wider">
            {Array.from({ length: 8 }).map((_, idx) => (
              <span key={idx} className="inline-flex items-center gap-6 mx-4">
                <span>Miễn phí vận chuyển cho đơn hàng trên 1 triệu</span>
                <span className="text-[20px]">•</span>
              </span>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: BEST SELLERS PRODUCT SHOWCASE
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
              <h2 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight text-balance leading-none">
                Sản phẩm bán chạy nhất
              </h2>
            </div>

            {/* Desktop Product Grid (5 Items Architectural Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-black dark:divide-zinc-800 border-b border-black dark:border-zinc-800">
              {BEST_SELLERS.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 p-6 lg:p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-all duration-300"
                >
                  {/* Badges Overlay */}
                  <div className="flex items-center justify-between z-10">
                    {product.statusBadge && (
                      <span className="px-3 py-1 bg-[#623CEA] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow">
                        {product.statusBadge}
                      </span>
                    )}
                    {product.discountBadge && (
                      <span className="px-3 py-1 bg-[#E01715] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow ml-auto">
                        {product.discountBadge}
                      </span>
                    )}
                  </div>

                  {/* Product Image Container */}
                  <div className="relative w-full aspect-square my-6 overflow-hidden flex items-center justify-center">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{product.rating}</span>
                      <span className="text-muted-foreground">({product.reviewsCount})</span>
                    </div>

                    <h3 className="text-[20px] lg:text-[22px] font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    <div className="flex items-baseline gap-3">
                      <span className="text-[22px] lg:text-[24px] font-extrabold text-black dark:text-white">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm line-through text-zinc-400 font-medium">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/product/${product.id}`}
                      className="mt-4 w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-center block border border-black hover:bg-[#C5FA1F] hover:text-black transition-colors"
                    >
                      Thêm vào giỏ
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Controls Bar */}
            <div className="p-6 lg:p-8 flex items-center justify-between bg-[#F2F2F2] dark:bg-zinc-900">
              {/* Pagination indicators */}
              <div className="flex items-center gap-2">
                {BEST_SELLERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSliderIndex(i)}
                    className={`h-2.5 transition-all duration-300 ${
                      sliderIndex === i
                        ? "w-8 bg-black dark:bg-white"
                        : "w-2.5 bg-zinc-400 dark:bg-zinc-600 hover:bg-black"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevSlide}
                  className="p-3 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                  aria-label="Previous product"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="p-3 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                  aria-label="Next product"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: BUY BY NEED SECTION (MUA THEO NHU CẦU CỦA BẠN)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
              <h2 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight text-balance leading-none">
                Mua theo nhu cầu của bạn
              </h2>
            </div>

            {/* Row 1: 2 Cards (Làm việc & Gaming) */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black dark:divide-zinc-800 border-b border-black dark:border-zinc-800">
              {/* Card 1: Làm việc */}
              <div className="relative group aspect-[16/10] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end">
                <Image
                  src="/figma/work_sec4.png"
                  alt="Làm việc"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10">
                  <Link
                    href="/shop?use_case=work"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#F2F2F2] text-black border border-black text-[20px] lg:text-[24px] font-semibold hover:bg-black hover:text-white transition-colors shadow-md"
                  >
                    Làm việc
                    <ArrowUpRight className="w-6 h-6" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Gaming */}
              <div className="relative group aspect-[16/10] overflow-hidden bg-white dark:bg-zinc-900 p-8 flex flex-col justify-end">
                <Image
                  src="/figma/gaming_sec4.png"
                  alt="Gaming"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10">
                  <Link
                    href="/shop?use_case=gaming"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#F2F2F2] text-black border border-black text-[20px] lg:text-[24px] font-semibold hover:bg-black hover:text-white transition-colors shadow-md"
                  >
                    Gaming
                    <ArrowUpRight className="w-6 h-6" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Row 2: Image Card + High Impact Copywriting Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black dark:divide-zinc-800">
              {/* Left: Accessories Upgrade Banner Image */}
              <div className="relative group min-h-[400px] lg:min-h-[550px] overflow-hidden bg-white dark:bg-zinc-900">
                <Image
                  src="/figma/upgrade_sec4.png"
                  alt="Thiết kế cho mọi nâng cấp"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Right: Content Block */}
              <div className="p-8 lg:p-16 flex flex-col justify-between bg-white dark:bg-zinc-900 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-[36px] sm:text-[48px] lg:text-[64px] font-bold leading-[1.05] tracking-tight">
                    Thiết kế cho mọi nâng cấp.
                  </h3>
                  <p className="text-[18px] sm:text-[22px] lg:text-[24px] text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed">
                    Từ lúc bật máy đến chạy nhanh nhất, thiết bị của tụi mình luôn sẵn sàng đáp ứng nhu cầu của bạn. Khám phá món đồ không thể thiếu để làm khoảnh khắc thêm tuyệt vời.
                  </p>
                </div>

                <div>
                  <Link
                    href="/shop/accessories"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white dark:bg-white dark:text-black border border-black text-[20px] lg:text-[24px] font-semibold hover:bg-[#C5FA1F] hover:text-black transition-colors"
                  >
                    Mua phụ kiện
                    <ArrowUpRight className="w-6 h-6" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: CATEGORY GRID (DANH MỤC)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
              <h2 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight text-balance leading-none">
                Danh mục
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10">
                  <Link
                    href="/shop/smartphones"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#F2F2F2] text-black border border-black text-[20px] lg:text-[24px] font-semibold hover:bg-black hover:text-white transition-colors shadow-md"
                  >
                    Điện thoại
                    <ArrowUpRight className="w-6 h-6" />
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10">
                  <Link
                    href="/shop/laptops"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#F2F2F2] text-black border border-black text-[20px] lg:text-[24px] font-semibold hover:bg-black hover:text-white transition-colors shadow-md"
                  >
                    Máy tính xách tay
                    <ArrowUpRight className="w-6 h-6" />
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10">
                  <Link
                    href="/shop/accessories"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#F2F2F2] text-black border border-black text-[20px] lg:text-[24px] font-semibold hover:bg-black hover:text-white transition-colors shadow-md"
                  >
                    Phụ kiện
                    <ArrowUpRight className="w-6 h-6" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: ARTICLES / STORIES THAT MOVE (POWERED BY STRAPI CMS)
           ========================================================================= */}
        <section className="w-full">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#623CEA] text-white text-xs font-bold uppercase tracking-wider">
                    Strapi CMS API
                  </span>
                  {isStrapiLoaded && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                      Live Sync
                    </span>
                  )}
                </div>
                <h2 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight text-balance leading-none">
                  Stories that Move
                </h2>
              </div>

              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white dark:bg-white dark:text-black font-bold text-[18px] hover:bg-[#C5FA1F] hover:text-black transition-colors self-start md:self-auto"
              >
                Tất cả tin tức
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>

            {/* 3 Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black dark:border-zinc-800">
              {articles.slice(0, 3).map((article) => (
                <div
                  key={article.id}
                  className="group bg-white dark:bg-zinc-900 flex flex-col justify-between p-8 lg:p-10 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="space-y-6">
                    {/* Thumbnail Image */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block">
                        {article.date}
                      </span>
                      {article.category && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                          {article.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-[22px] lg:text-[26px] font-bold leading-tight group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-[16px] lg:text-[18px] text-zinc-600 dark:text-zinc-300 font-normal line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  </div>

                  <div className="pt-8">
                    <Link
                      href={article.link}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#F2F2F2] dark:bg-zinc-800 border border-black dark:border-zinc-700 text-black dark:text-white text-[18px] font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      Xem Tin Tức
                      <ArrowUpRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
