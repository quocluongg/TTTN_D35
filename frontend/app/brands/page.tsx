"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Truck,
  RefreshCw,
  ShoppingCart,
  CreditCard,
  Package,
  Zap,
  Award,
  CheckCircle,
  Star,
  ArrowUpRight,
  Laptop,
  Smartphone,
  Headphones,
  Sparkles,
  Search,
  Check,
  Cpu,
  Monitor
} from "lucide-react";
import PublicLayout from "@/shared/layouts/PublicLayout";

const TECH_BRANDS = [
  {
    name: "Apple",
    logoText: "APPLE",
    category: "Mobile & Laptop",
    categoryKey: "mobile_laptop",
    tag: "Chính Hãng VN/A",
    count: "45+ sản phẩm",
    popularProducts: "iPhone 15/16 Pro Max, MacBook Pro M3/M4, iPad Pro, AirPods Pro, Apple Watch",
    description: "Đỉnh cao công nghệ thế giới với hệ sinh thái iOS, macOS, iPadOS đỉnh cao và mượt mà nhất.",
    color: "from-zinc-900 to-zinc-700 text-white"
  },
  {
    name: "ASUS",
    logoText: "ASUS / ROG",
    category: "Laptop & Gaming",
    categoryKey: "laptop",
    tag: "ROG & ZenBook",
    count: "60+ sản phẩm",
    popularProducts: "ROG Strix SCAR, TUF Gaming, ZenBook Duo, Vivobook OLED, ROG Phone",
    description: "Thương hiệu laptop hàng đầu thế giới về hiệu năng gaming, thiết kế sáng tạo và độ bền chuẩn quân đội.",
    color: "from-red-900 to-zinc-900 text-white"
  },
  {
    name: "Dell",
    logoText: "DELL",
    category: "Laptop Doanh Nhân",
    categoryKey: "laptop",
    tag: "XPS & Alienware",
    count: "50+ sản phẩm",
    popularProducts: "Dell XPS 13/16, Alienware m16, Inspiron 14, Latitude, Trạm đồ họa Precision",
    description: "Chuẩn mực laptop doanh nhân cao cấp và máy tính trạm đồ họa chuyên nghiệp siêu bền bỉ.",
    color: "from-blue-900 to-zinc-900 text-white"
  },
  {
    name: "Lenovo",
    logoText: "LENOVO",
    category: "Laptop & Workstation",
    categoryKey: "laptop",
    tag: "ThinkPad & Legion",
    count: "55+ sản phẩm",
    popularProducts: "ThinkPad X1 Carbon, Legion 5/7 Pro, Yoga Slim, IdeaPad Gaming",
    description: "Huyền thoại ThinkPad với bàn phím gõ sướng nhất và dòng Legion đứng đầu thị phần laptop gaming.",
    color: "from-red-800 to-zinc-900 text-white"
  },
  {
    name: "Samsung",
    logoText: "SAMSUNG",
    category: "Mobile & Screen",
    categoryKey: "mobile",
    tag: "Galaxy Ecosystem",
    count: "70+ sản phẩm",
    popularProducts: "Galaxy S24 Ultra, Z Fold6/Flip6, Galaxy Tab S9, Màn hình Odyssey OLED",
    description: "Tập đoàn công nghệ tiên phong màn hình gập, camera AI zoom 100x và màn hình OLED xuất sắc.",
    color: "from-blue-800 to-indigo-950 text-white"
  },
  {
    name: "MSI",
    logoText: "MSI",
    category: "Laptop Gaming & GPU",
    categoryKey: "laptop",
    tag: "Gaming & Creator",
    count: "40+ sản phẩm",
    popularProducts: "MSI Titan GT, Raider GE, Stealth GS, Cyborg 15, Modern 14",
    description: "Thương hiệu phần cứng & laptop gaming hàng đầu với tản nhiệt Cooler Boost độc quyền.",
    color: "from-red-950 to-zinc-900 text-white"
  },
  {
    name: "HP",
    logoText: "HP",
    category: "Laptop Mỏng Nhẹ",
    categoryKey: "laptop",
    tag: "Spectre & OMEN",
    count: "45+ sản phẩm",
    popularProducts: "HP Spectre x360, OMEN 16, Envy 14, Pavilion Plus, ProBook",
    description: "Thiết kế hợp kim nhôm mỏng nhẹ sang trọng, âm thanh Bang & Olufsen và bảo mật HP Wolf Security.",
    color: "from-cyan-950 to-zinc-900 text-white"
  },
  {
    name: "Acer",
    logoText: "ACER",
    category: "Laptop & Gaming",
    categoryKey: "laptop",
    tag: "Predator & Nitro",
    count: "50+ sản phẩm",
    popularProducts: "Acer Predator Helios 16, Nitro V 15, Swift Go OLED, Aspire 5",
    description: "Sự lựa chọn quốc dân cho game thủ và học sinh sinh viên với cấu hình khủng trên giá thành.",
    color: "from-emerald-950 to-zinc-900 text-white"
  },
  {
    name: "Sony",
    logoText: "SONY",
    category: "Audio & Entertainment",
    categoryKey: "audio",
    tag: "Hi-Res Audio",
    count: "35+ sản phẩm",
    popularProducts: "Tai nghe WH-1000XM5, WF-1000XM5, PlayStation 5 Slim, Loa Bluetooth SRS",
    description: "Đỉnh cao âm thanh chống ồn thế giới, máy chơi game Console PS5 và hệ thống hình ảnh chuyên nghiệp.",
    color: "from-zinc-900 to-neutral-900 text-white"
  },
  {
    name: "Xiaomi",
    logoText: "XIAOMI",
    category: "Smartphone & Smart Home",
    categoryKey: "mobile",
    tag: "Xiaomi Flagship",
    count: "65+ sản phẩm",
    popularProducts: "Xiaomi 14 Ultra, Redmi Note 13 Pro, Mi Pad 6, Smart Band 8",
    description: "Điện thoại ống kính Leica đẳng cấp, sạc siêu tốc 120W và hệ sinh thái đồ gia dụng thông minh.",
    color: "from-orange-950 to-zinc-900 text-white"
  },
];

const FILTER_TABS = [
  { key: "all", label: "Tất Cả Thương Hiệu" },
  { key: "laptop", label: "💻 Laptop & Máy Tính Bảng" },
  { key: "mobile", label: "📱 Điện Thoại & Smartphone" },
  { key: "audio", label: "🎧 Âm Thanh & Phụ Kiện" },
];

export default function BrandsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = TECH_BRANDS.filter((b) => {
    const matchCategory =
      selectedCategory === "all" ||
      b.categoryKey === selectedCategory ||
      (selectedCategory === "laptop" && b.categoryKey === "mobile_laptop") ||
      (selectedCategory === "mobile" && b.categoryKey === "mobile_laptop");

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.popularProducts.toLowerCase().includes(q);

    return matchCategory && matchQuery;
  });

  return (
    <PublicLayout fullWidth>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        {/* ===== HERO TECH SECTION ===== */}
        <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white p-8 lg:p-16">
          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wider uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đối Tác Công Nghệ Chính Hãng 100%</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase leading-[1.05] mb-6">
              Thương Hiệu Đẳng Cấp <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Laptop, Phone & Công Nghệ
              </span>
            </h1>

            <p className="text-base md:text-xl text-zinc-300 max-w-3xl leading-relaxed mb-10">
              Khám phá và trải nghiệm các thiết bị điện tử chính hãng từ Apple, ASUS, Dell, Lenovo, Samsung, Sony, Xiaomi... Bảo hành 100% chính hãng, đền 10 lần nếu phát hiện hàng không chuẩn.
            </p>

            {/* Key Value Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-zinc-800/80 bg-zinc-950/80 p-4 md:p-6 rounded-2xl backdrop-blur-md">
              {[
                { value: "100%", label: "Cam Kết Chính Hãng VN/A", desc: "Đền x10 nếu phát hiện hàng giả" },
                { value: "24 THÁNG", label: "Bảo Hành Nhà Sản Xuất", desc: "1 đổi 1 siêu tốc 30 ngày" },
                { value: "0% TRẢ GÓP", label: "Thủ Tục Online Duyệt 5Ph", desc: "Không cần chứng minh thu nhập" },
                { value: "MIỄN PHÍ", label: "Giao Hàng Toàn Quốc", desc: "Kiểm tra hàng trước khi thanh toán" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 md:p-4 text-left border-r last:border-r-0 border-zinc-800/80 space-y-1">
                  <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-400 font-mono">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold uppercase text-zinc-200">{stat.label}</p>
                  <p className="text-[11px] text-zinc-400 hidden md:block">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FILTER TABS & SEARCH BAR ===== */}
        <section className="p-6 md:p-10 max-w-[1920px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase flex items-center gap-2">
                <Cpu className="text-emerald-500" /> Hệ Sinh Thái Thương Hiệu
              </h2>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Lựa chọn sản phẩm theo hãng sản xuất uy tín thế giới
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm hãng, dòng SP (ROG, XPS...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <span className="text-xs font-mono text-zinc-500 self-center">
                Hiển thị {filteredBrands.length} / {TECH_BRANDS.length} hãng
              </span>
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {FILTER_TABS.map((tab) => {
              const isActive = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ===== BRANDS CATALOG GRID ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.name}
                href={`/shop?brand=${encodeURIComponent(brand.name)}`}
                className="group relative flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-xl dark:hover:shadow-emerald-950/30 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Top Bar: Brand Logo Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block text-2xl font-black font-mono tracking-widest text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {brand.logoText}
                      </span>
                      <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">{brand.category}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                      {brand.tag}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {brand.description}
                  </p>

                  {/* Popular Product Lines Highlight */}
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      🔥 Dòng SP Nổi Bật:
                    </span>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono line-clamp-2">
                      {brand.popularProducts}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <span className="font-mono font-bold text-zinc-500">{brand.count}</span>
                  <span className="font-bold text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                    Xem sản phẩm <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
    </PublicLayout>
  );
}
