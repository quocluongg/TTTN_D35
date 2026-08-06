"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  ShoppingBag,
  ShieldCheck,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Check,
  Sliders,
  Sparkles,
  Layers,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { productService, ProductVariant } from "@/services/productServices";
import { useCart } from "@/hooks/useCart";

export default function ProductDetailPage() {
  const params = useParams();
  const slugOrId = (params.id as string) || "";
  const { addToCart, isAddingToCart } = useCart();

  // TanStack Query: Fetch detail product from backend
  const { data: detailRes, isLoading, isError } = useQuery({
    queryKey: ["product-detail", slugOrId],
    queryFn: () => productService.getProductBySlugOrId(slugOrId),
    enabled: !!slugOrId,
  });

  // Extract unwrapped data or envelope data
  const product: any = (detailRes as any)?.data ?? detailRes;

  // TanStack Query: Fetch related products from backend
  const { data: relatedRes } = useQuery({
    queryKey: ["related-products", product?.brand],
    queryFn: () => productService.getProducts({ brand: product?.brand, size: 5 }),
    enabled: !!product?.brand,
  });

  const relatedProducts: any[] = (relatedRes as any)?.data?.items || (relatedRes as any)?.data?.content || (relatedRes as any)?.items || [];

  // Selected Variant State
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "description" | "custom">("specs");

  // Set default variant when product loads
  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  const galleryImages = React.useMemo(() => {
    const list: string[] = [];
    if (selectedVariant?.image) {
      list.push(selectedVariant.image);
    }
    if (product?.thumbnail && !list.includes(product.thumbnail)) {
      list.push(product.thumbnail);
    }
    if (product?.images && product.images.length > 0) {
      product.images.forEach((img: any) => {
        const url = typeof img === "string" ? img : img.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list.length > 0
      ? list
      : ["https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"];
  }, [product, selectedVariant]);

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    const targetVariant = selectedVariant || product?.variants?.[0];
    const variantId = targetVariant?.id;

    if (!variantId) {
      return;
    }

    // Gọi API Backend qua hook React Query
    addToCart(
      { variantId, quantity: 1 },
      {
        onSuccess: () => {
          setAddedToCart(true);
          setIsFlying(true);
          setTimeout(() => {
            setAddedToCart(false);
            setIsFlying(false);
          }, 2500);
        },
      }
    );
  };

  const formatCurrency = (val?: number) => {
    if (!val) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  if (isLoading) {
    return (
      <PublicLayout fullWidth>
        <div className="p-32 text-center text-xl font-bold text-black dark:text-white bg-[#F2F2F2] dark:bg-zinc-950">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black dark:border-white border-t-transparent mb-4"></div>
          <p>Đang tải thông tin chi tiết sản phẩm...</p>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !product || !product.name) {
    return (
      <PublicLayout fullWidth>
        <div className="p-24 text-center space-y-4 bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white">
          <h2 className="text-3xl font-bold">Không tìm thấy sản phẩm</h2>
          <p className="text-zinc-500">Sản phẩm này có thể đã bị ngưng kinh doanh hoặc đường dẫn không khả dụng.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:bg-zinc-800 transition-colors"
          >
            Quay lại Cửa Hàng
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const currentPrice = selectedVariant?.price || product.variants?.[0]?.price || product.priceFrom;

  // Variant attributes object
  const variantAttributes: Record<string, string> = selectedVariant?.attributes || product.variants?.[0]?.attributes || {};

  // Build comprehensive specs combining attributes + defaults
  const detailedSpecsList = [
    { key: "Bộ vi xử lý (CPU)", value: variantAttributes["CPU"] || variantAttributes["cpu"] || "Intel Core Ultra 7 155H / Ultra 5 / AMD Ryzen 7" },
    { key: "Bộ nhớ RAM", value: variantAttributes["RAM"] || variantAttributes["ram"] || "16GB LPDDR5X 7467MHz (Onboard)" },
    { key: "Ổ cứng lưu trữ", value: variantAttributes["SSD"] || variantAttributes["ssd"] || variantAttributes["Storage"] || "512GB PCIe 4.0 NVMe M.2 SSD" },
    { key: "Card đồ họa (VGA)", value: variantAttributes["VGA"] || variantAttributes["vga"] || "Intel Arc Graphics tích hợp" },
    { key: "Màn hình", value: variantAttributes["Screen"] || variantAttributes["screen"] || "14.0 inch 3K (2880 x 1800) OLED 16:10, 120Hz, 100% DCI-P3" },
    { key: "Màu sắc (Color)", value: variantAttributes["Color"] || variantAttributes["color"] || "Xanh Trầm (Ponder Blue) / Xám" },
    { key: "Hệ điều hành", value: "Windows 11 Home Bản Quyền" },
    { key: "Bàn phím & Touchpad", value: "Bàn phím ErgoSense tích hợp đèn nền LED, Touchpad phủ kính rộng rãi" },
    { key: "Cổng kết nối", value: "2x Thunderbolt™ 4, 1x USB 3.2 Gen 1 Type-A, 1x HDMI 2.1 TMDS, 1x Jack 3.5mm Combo Audio" },
    { key: "Kết nối không dây", value: "Wi-Fi 6E (802.11ax) + Bluetooth® 5.3" },
    { key: "Pin & Sạc", value: "75WHrs, 4-cell Li-ion, Sạc nhanh Type-C 65W" },
    { key: "Trọng lượng & Kích thước", value: "1.2 kg · 31.24 x 22.01 x 1.49 cm (Siêu mỏng nhẹ)" },
    { key: "Âm thanh", value: "Hệ thống loa Harman Kardon kép, Dolby Atmos, Smart Amp" },
    { key: "Bảo mật", value: "Camera IR FHD với nhận diện khuôn mặt Windows Hello & Nắp che camera vật lý" },
  ];

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
        
        {/* BREADCRUMB */}
        {product.categoryBreadcrumb && product.categoryBreadcrumb.length > 0 && (
          <div className="w-full border-b border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 py-3">
            <div className="w-[1920px] max-w-full mx-auto flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <Link href="/" className="hover:text-black dark:hover:text-white">Trang chủ</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-black dark:hover:text-white">Cửa hàng</Link>
              {product.categoryBreadcrumb.map((cat: any) => (
                <React.Fragment key={cat.id || cat.slug}>
                  <span>/</span>
                  <Link href={`/shop?category=${cat.slug}`} className="hover:text-black dark:hover:text-white">
                    {cat.name}
                  </Link>
                </React.Fragment>
              ))}
              <span>/</span>
              <span className="text-black dark:text-white font-bold truncate max-w-xs">{product.name}</span>
            </div>
          </div>
        )}

        {/* HERO SECTION - REVERTED TO ORIGINAL EDGE-TO-EDGE SPLIT DESIGN SYSTEM */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black dark:divide-zinc-800">
            
            {/* LEFT COLUMN: IMAGE GALLERY SLIDER */}
            <div className="relative p-8 lg:p-12 bg-white dark:bg-zinc-900 flex flex-col justify-between min-h-[500px] lg:min-h-[650px]">
              <div className="flex items-center justify-between w-full z-10">
                {product.brand && (
                  <span className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}
                {product.origin && (
                  <span className="text-xs font-semibold text-zinc-500">Xuất xứ: {product.origin}</span>
                )}
              </div>

              {/* Main Image View */}
              <div className="relative w-full h-[380px] sm:h-[460px] my-auto flex items-center justify-center">
                <Image
                  src={galleryImages[currentImageIdx] || "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"}
                  alt={product.name}
                  fill
                  className="object-contain p-4 transition-all duration-300"
                  priority
                />
              </div>

              {/* Gallery Thumbnails & Arrows */}
              <div className="w-full space-y-4 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevImage}
                      className="w-10 h-10 border border-black dark:border-white flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="w-10 h-10 border border-black dark:border-white flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
                    {galleryImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIdx(idx)}
                        className={`relative w-12 h-12 border transition-all overflow-hidden ${
                          currentImageIdx === idx
                            ? "border-black dark:border-white ring-2 ring-indigo-500"
                            : "border-zinc-200 dark:border-zinc-700 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={imgUrl} alt="Thumbnail" fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PRODUCT INFO & VARIANTS */}
            <div className="p-8 lg:p-12 bg-white dark:bg-zinc-900 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                
                {/* Title */}
                <div>
                  <h1 className="text-[28px] sm:text-[40px] font-bold tracking-tight leading-tight">
                    {product.name}
                  </h1>
                  <p className="mt-1 text-xs text-zinc-500 font-mono">SKU: {selectedVariant?.sku || product.slug}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[16px] font-semibold text-black dark:text-white">
                    {product.ratingAvg ? Number(product.ratingAvg).toFixed(1) : "5.0"}
                  </span>
                  <span className="text-zinc-500">({product.reviewCount || 0} đánh giá)</span>
                </div>

                {/* Price Display Box */}
                <div className="p-4 bg-[#F2F2F2] dark:bg-zinc-800/60 border border-black/10 dark:border-white/10 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Giá sản phẩm</span>
                    <span className="text-[32px] sm:text-[40px] font-extrabold text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(currentPrice)}
                    </span>
                  </div>
                  {product.warrantyMonths && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Bảo hành {product.warrantyMonths} tháng</span>
                    </div>
                  )}
                </div>

                {/* LAPTOP KEY HIGHLIGHTS QUICK CARDS */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 border border-black/20 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2.5">
                    <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Vi xử lý</span>
                      <span className="font-bold text-black dark:text-white truncate block">
                        {variantAttributes["CPU"] || variantAttributes["cpu"] || "Intel Core Ultra 7"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 border border-black/20 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2.5">
                    <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">RAM</span>
                      <span className="font-bold text-black dark:text-white truncate block">
                        {variantAttributes["RAM"] || variantAttributes["ram"] || "16GB LPDDR5X"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 border border-black/20 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2.5">
                    <HardDrive className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Ổ cứng</span>
                      <span className="font-bold text-black dark:text-white truncate block">
                        {variantAttributes["SSD"] || variantAttributes["ssd"] || "512GB NVMe SSD"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 border border-black/20 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2.5">
                    <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Màn hình</span>
                      <span className="font-bold text-black dark:text-white truncate block">
                        {variantAttributes["Screen"] || variantAttributes["screen"] || "14\" OLED 120Hz"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VARIANTS SELECTOR */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                      <span>Tùy chọn cấu hình / Phiên bản:</span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {selectedVariant?.stock ? `Còn ${selectedVariant.stock} sản phẩm` : "Hết hàng"}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.variants.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            selectedVariant?.id === v.id
                              ? "bg-black text-white border-black dark:bg-white dark:text-black font-bold"
                              : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-black"
                          }`}
                        >
                          <span className="text-sm font-bold">{v.variantName || v.sku}</span>
                          <span className="text-xs opacity-80 mt-1">{formatCurrency(v.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Cart Action & Flying Cart Animation */}
              <div className="pt-4 relative">
                {isFlying && (
                  <div className="absolute left-1/2 -top-12 -translate-x-1/2 z-50 pointer-events-none animate-bounce flex items-center gap-2 bg-[#C5FA1F] text-black px-4 py-2 font-extrabold text-xs shadow-2xl border border-black">
                    <ShoppingBag className="w-4 h-4 animate-spin" />
                    <span>Đang bay vào giỏ hàng...</span>
                  </div>
                )}
                <button
                  onClick={handleAddToCart}
                  disabled={selectedVariant?.stock === 0}
                  className={`w-full h-[58px] text-[18px] sm:text-[20px] font-bold border border-black flex items-center justify-center gap-3 transition-all cursor-pointer ${
                    selectedVariant?.stock === 0
                      ? "bg-zinc-300 text-zinc-500 border-zinc-300 cursor-not-allowed"
                      : addedToCart
                      ? "bg-[#1CCA00] text-white scale-[0.99]"
                      : "bg-black text-white dark:bg-white dark:text-black hover:bg-[#C5FA1F] hover:text-black active:scale-[0.98]"
                  }`}
                >
                  {selectedVariant?.stock === 0 ? (
                    "Tạm Hết Hàng"
                  ) : addedToCart ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 animate-pulse" /> Đã Thêm Vào Giỏ Hàng!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-6 h-6" /> Thêm vào giỏ hàng
                    </>
                  )}
                </button>
              </div>
            </div>


          </div>
        </section>

        {/* =========================================================================
            SECTION 2: FULL DETAILED LAPTOP SPECIFICATIONS TABLE
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-8">
            
            {/* TAB NAVIGATION */}
            <div className="flex border-b border-black dark:border-zinc-800 gap-6">
              <button
                onClick={() => setActiveTab("specs")}
                className={`pb-4 text-lg font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === "specs"
                    ? "border-black dark:border-white text-black dark:text-white"
                    : "border-transparent text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Thông số kỹ thuật chi tiết
              </button>
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 text-lg font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === "description"
                    ? "border-black dark:border-white text-black dark:text-white"
                    : "border-transparent text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Đánh giá & Mô tả sản phẩm
              </button>
            </div>

            {/* TAB 1: FULL LAPTOP SPECIFICATIONS TABLE */}
            {activeTab === "specs" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sliders size={20} /> Bảng thông số kỹ thuật đầy đủ
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">Thông tin chính hãng từ ShopWise</span>
                </div>

                <div className="overflow-x-auto border border-black dark:border-zinc-800">
                  <table className="w-full text-left text-sm border-collapse">
                    <tbody>
                      {detailedSpecsList.map((item, idx) => (
                        <tr
                          key={item.key}
                          className={`border-b border-zinc-200 dark:border-zinc-800 ${
                            idx % 2 === 0 ? "bg-zinc-50 dark:bg-zinc-800/40" : "bg-white dark:bg-zinc-900"
                          }`}
                        >
                          <td className="p-4 font-bold w-1/3 text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800">
                            {item.key}
                          </td>
                          <td className="p-4 font-semibold text-black dark:text-white">
                            {item.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: DESCRIPTION */}
            {activeTab === "description" && (
              <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4">
                {product.description ? (
                  <p className="whitespace-pre-line text-base">{product.description}</p>
                ) : (
                  <p className="text-zinc-500">Chưa có thông tin mô tả chi tiết cho sản phẩm này.</p>
                )}
              </div>
            )}

          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="w-full border-b border-black dark:border-zinc-800">
            <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-8">
              <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight">
                Sản phẩm cùng thương hiệu ({product.brand})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {relatedProducts.map((relProd) => (
                  <Link
                    key={relProd.id}
                    href={`/product/${relProd.slug || relProd.id}`}
                    className="group flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center p-6 border-b border-black/10 dark:border-zinc-800 overflow-hidden">
                      <Image
                        src={relProd.thumbnail || "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"}
                        alt={relProd.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-5 flex flex-col justify-between text-black dark:text-white flex-1 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {relProd.categoryName}
                        </span>
                        <h3 className="text-base font-bold line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {relProd.name}
                        </h3>
                      </div>
                      <div className="pt-2 border-t border-black/10 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500 font-medium">Giá từ: </span>
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
                          {formatCurrency(relProd.priceFrom)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </PublicLayout>
  );
}
