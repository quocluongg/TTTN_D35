"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { productService, ProductListItem } from "@/services/productServices";
import { newsService } from "@/services/newsService";
import { useCart } from "@/hooks/useCart";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star, ShoppingBag, Check } from "lucide-react";
import { notifySuccess } from "@/components/Notify";

const unwrap = (x: any) => x?.data ?? x;

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart } = useCart();

  // Load sản phẩm bán chạy / nổi bật từ Backend API thật
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

  // Load bài viết tin tức mới nhất từ Backend API thật
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
  };

  const handlePrevSlide = () => {
    setSliderIndex((prev) => (prev === 0 ? Math.max(0, bestSellers.length - 5) : prev - 1));
  };

  const handleNextSlide = () => {
    setSliderIndex((prev) => (prev >= bestSellers.length - 5 ? 0 : prev + 1));
  };

  const handleAddToCart = (product: ProductListItem) => {
    // Chuyển sang trang chi tiết sản phẩm để chọn biến thể (RAM / SSD / Màu sắc)
    window.location.href = `/product/${product.slug || product.id}`;
  };

  const visibleProducts = bestSellers.slice(sliderIndex, sliderIndex + 5);

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
        
        {/* =========================================================================
            SECTION 1: HERO BANNER SECTION (DYNAMIC PRODUCT LINK)
           ========================================================================= */}
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

            {/* Content overlay */}
            <div className="relative z-10 space-y-4 max-w-3xl text-white">
              <span className="px-3.5 py-1 bg-[#C5FA1F] text-black text-xs font-black uppercase tracking-wider inline-block">
                Bộ sưu tập công nghệ 2026
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-balance">
                HIỆU NĂNG ĐỈNH CAO. THIẾT KẾ ĐỘT PHÁ.
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

        {/* =========================================================================
            SECTION 2: MARQUEE TICKER BANNER (#C5FA1F)
           ========================================================================= */}
        <section className="w-full bg-[#C5FA1F] border-b border-black text-black overflow-hidden py-4">
          <div className="animate-marquee whitespace-nowrap text-lg md:text-2xl font-black uppercase tracking-wider flex items-center">
            {Array.from({ length: 8 }).map((_, idx) => (
              <span key={idx} className="inline-flex items-center gap-6 mx-4">
                <span>⚡ MUA HÀNG CHÍNH HÃNG HỎA TỐC 2H</span>
                <span>•</span>
                <span>MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC DÀNH CHO ĐƠN HÀNG TRÊN 1 TRIỆU</span>
                <span>•</span>
                <span>BẢO HÀNH ĐIỆN TỬ 1 ĐỔI 1 TRONG 30 NGÀY</span>
                <span>•</span>
              </span>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: BEST SELLERS PRODUCT SHOWCASE (DYNAMIC FROM BACKEND API)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
                  Sản phẩm nổi bật
                </span>
                <h2 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
                  Sản phẩm được yêu thích nhất
                </h2>
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-[#C5FA1F] hover:text-black transition-colors self-start md:self-auto uppercase tracking-wider"
              >
                Xem tất cả {bestSellers.length} sản phẩm
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Desktop Product Grid (Dynamic Items from API) */}
            {loadingProducts ? (
              <div className="py-24 text-center text-zinc-500 font-medium">Đang tải danh sách sản phẩm từ hệ thống…</div>
            ) : bestSellers.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 font-medium">Không tìm thấy sản phẩm nào khả dụng.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-black dark:divide-zinc-800 border-b border-black dark:border-zinc-800">
                {(visibleProducts.length ? visibleProducts : bestSellers.slice(0, 5)).map((product) => {
                  const isJustAdded = addedProductId === product.id;
                  const price = Number(product.priceFrom || 0);

                  return (
                    <div
                      key={product.id}
                      className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 p-6 lg:p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-all duration-300"
                    >
                      {/* Badges Overlay */}
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2.5 py-1 bg-[#623CEA] text-white text-[10px] font-black uppercase tracking-wider">
                          {product.brand || "CHÍNH HÃNG"}
                        </span>
                        {product.categoryName && (
                          <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider ml-auto">
                            {product.categoryName}
                          </span>
                        )}
                      </div>

                      {/* Product Dynamic Image Container */}
                      <Link href={`/product/${product.slug || product.id}`} className="block relative w-full aspect-square my-6 overflow-hidden flex items-center justify-center">
                        <Image
                          src={product.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                          alt={product.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{product.ratingAvg || 5.0}</span>
                          <span className="text-zinc-400">({product.reviewCount || 12})</span>
                        </div>

                        <h3 className="text-base font-bold group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[48px]">
                          <Link href={`/product/${product.slug || product.id}`}>
                            {product.name}
                          </Link>
                        </h3>

                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-xl font-extrabold font-mono text-black dark:text-white">
                            {formatCurrency(price)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`mt-4 w-full py-3 font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 border border-black transition-all cursor-pointer ${
                            isJustAdded
                              ? "bg-green-600 text-white border-green-600"
                              : "bg-black dark:bg-white text-white dark:text-black hover:bg-[#C5FA1F] hover:text-black"
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check size={14} /> Đã thêm vào giỏ
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={14} /> Thêm vào giỏ
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Slider Controls Bar */}
            {bestSellers.length > 5 && (
              <div className="p-6 flex items-center justify-between bg-[#F2F2F2] dark:bg-zinc-900">
                <div className="text-xs font-bold font-mono text-zinc-500">
                  Hiển thị {sliderIndex + 1} - {Math.min(sliderIndex + 5, bestSellers.length)} trên {bestSellers.length} sản phẩm
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevSlide}
                    className="p-2.5 border border-black bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    aria-label="Sản phẩm trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="p-2.5 border border-black bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    aria-label="Sản phẩm tiếp"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: BUY BY NEED SECTION (MUA THEO NHU CẦU CỦA BẠN)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
                Mua theo nhu cầu sử dụng
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

        {/* =========================================================================
            SECTION 5: CATEGORY GRID (DANH MỤC SẢN PHẨM TRỰC QUAN)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
                Danh mục nổi bật
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

        {/* =========================================================================
            SECTION 6: ARTICLES / STORIES THAT MOVE (DYNAMIC NEWS FROM BACKEND)
           ========================================================================= */}
        <section className="w-full">
          <div className="w-[1920px] max-w-full mx-auto">
            {/* Header Title */}
            <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
                  ShopWise Journal
                </span>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
                  Tin tức & Xu hướng
                </h2>
              </div>

              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-[#C5FA1F] hover:text-black transition-colors self-start md:self-auto uppercase tracking-wider"
              >
                Tất cả tin tức
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3 Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black dark:border-zinc-800">
              {articles.slice(0, 3).map((article) => (
                <div
                  key={article.id}
                  className="group bg-white dark:bg-zinc-900 flex flex-col justify-between p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="space-y-5">
                    {/* Thumbnail Image */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-black/10">
                      <Image
                        src={article.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <span className="text-xs font-bold text-zinc-500 font-mono block">
                      {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </span>

                    <h3 className="text-xl font-bold leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                      <Link href={`/news/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-normal line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-200">
                    <Link
                      href={`/news/${article.slug}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F2F2F2] dark:bg-zinc-800 border border-black dark:border-zinc-700 text-black dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                    >
                      Đọc bài viết
                      <ArrowUpRight className="w-3.5 h-3.5" />
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
