"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import {
  Database,
  Layers,
  Sparkles,
  Server,
  FileJson,
  Cpu,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Bot,
  Search,
  Zap,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Tag,
  SlidersHorizontal,
  BarChart3,
  BookOpen,
  Terminal,
  Play,
  RotateCw
} from "lucide-react";

type SampleEntity = {
  text: string;
  label?: string;
  entity_type?: string;
  start?: number;
  end?: number;
  start_char?: number;
  end_char?: number;
};

type NLUSample = {
  text: string;
  intent: string;
  entities: SampleEntity[];
};

export default function AdminDataManagementPage() {
  const [activeTab, setActiveTab] = useState<"TESTER" | "DATASET" | "MEDALLION">("TESTER");

  // NLU Live Tester State
  const [nluQuery, setNluQuery] = useState("So sánh laptop Asus TUF Gaming RAM 16GB với Dell XPS 13 giá dưới 25 triệu");
  const [nluResult, setNluResult] = useState<any>(null);
  const [isParsingNlu, setIsParsingNlu] = useState(false);

  // Dataset Explorer State
  const [datasetItems, setDatasetItems] = useState<NLUSample[]>([]);
  const [totalSamples, setTotalSamples] = useState(1620);
  const [filteredCount, setFilteredCount] = useState(1620);
  const [intentStats, setIntentStats] = useState<Record<string, number>>({});
  const [selectedIntentFilter, setSelectedIntentFilter] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);

  // Fetch Dataset from API
  const fetchDataset = async (page: number, intent: string, search: string) => {
    setIsLoadingDataset(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "12",
        intent,
        search,
      });
      const res = await fetch(`/api/admin/nlu/dataset?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDatasetItems(data.items || []);
        setTotalSamples(data.totalSamples || 1620);
        setFilteredCount(data.filteredCount || 0);
        setTotalPages(data.totalPages || 1);
        setIntentStats(data.intentStats || {});
      }
    } catch (e) {
      console.error("Lỗi khi tải NLU dataset:", e);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  useEffect(() => {
    fetchDataset(currentPage, selectedIntentFilter, searchKeyword);
  }, [currentPage, selectedIntentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDataset(1, selectedIntentFilter, searchKeyword);
  };

  const handleTestNlu = async (queryText?: string) => {
    const textToTest = queryText || nluQuery;
    if (!textToTest.trim()) return;

    setIsParsingNlu(true);
    setNluResult(null);

    try {
      const res = await fetch(`/api/admin/nlu?q=${encodeURIComponent(textToTest)}`);
      if (res.ok) {
        const data = await res.json();
        setNluResult(data);
      }
    } catch (e) {
      console.error("Lỗi parse NLU:", e);
    } finally {
      setIsParsingNlu(false);
    }
  };

  // Run initial test query
  useEffect(() => {
    handleTestNlu(nluQuery);
  }, []);

  const samplePresets = [
    "So sánh laptop Asus TUF Gaming RAM 16GB với Dell XPS 13 giá dưới 25 triệu",
    "Cấu hình chi tiết của Macbook Air M2 như thế nào?",
    "Tầm giá dưới 15 triệu nên mua laptop HP nào mượt chơi game?",
    "Máy Dell vừa mua bị trầy xước màn hình đổi trả trong bao lâu?",
    "Giá Asus ROG Strix bao nhiêu tiền vậy shop?",
    "Mua chiếc Asus Vivobook có được quà khuyến mãi gì không?",
    "Hướng dẫn mình thanh toán và mua chiếc Lenovo Legion 5"
  ];

  const getIntentBadgeColor = (intent: string) => {
    switch (intent) {
      case "compare_products":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "ask_specs":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "ask_price":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "ask_warranty":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "purchase_consultation":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "ask_promotion":
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
      case "order_product":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "complain":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  const getIntentVietnameseName = (intent: string) => {
    switch (intent) {
      case "compare_products":
        return "So sánh sản phẩm";
      case "ask_specs":
        return "Hỏi thông số kỹ thuật";
      case "ask_price":
        return "Hỏi giá sản phẩm";
      case "ask_warranty":
        return "Hỏi chính sách bảo hành";
      case "purchase_consultation":
        return "Tư vấn chọn mua";
      case "ask_promotion":
        return "Hỏi ưu đãi khuyến mãi";
      case "order_product":
        return "Đặt hàng & Thanh toán";
      case "complain":
        return "Khiếu nại & Báo lỗi";
      default:
        return "Hỏi đáp chung";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminJSPageHeader
        title="Quản Lý Dữ Liệu Data & NLU Intent Engine Console"
        resourceName="Data & NLU"
        count={totalSamples}
        description="Bảng điều khiển kết nối trực tiếp NLU Engine Tiếng Việt (PhoBERT 8 Intent & Product NER Slots), bộ dữ liệu 1,620 mẫu gán nhãn và Medallion Data Pipeline."
      />

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-1">
        <button
          onClick={() => setActiveTab("TESTER")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === "TESTER"
              ? "bg-[#3C50E0] text-white shadow-md shadow-[#3C50E0]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Live NLU & Intent Tester</span>
        </button>

        <button
          onClick={() => setActiveTab("DATASET")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === "DATASET"
              ? "bg-[#3C50E0] text-white shadow-md shadow-[#3C50E0]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Dataset Explorer (1,620 Mẫu Train)</span>
        </button>

        <button
          onClick={() => setActiveTab("MEDALLION")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === "MEDALLION"
              ? "bg-[#3C50E0] text-white shadow-md shadow-[#3C50E0]/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Medallion Pipeline & Supabase DB</span>
        </button>
      </div>

      {/* TAB 1: LIVE NLU & INTENT TESTER */}
      {activeTab === "TESTER" && (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1C2434] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Mẫu truy vấn nhanh kiểm thử Intent Điện tử:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">PhoBERT Joint Model Active</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNluQuery(preset);
                    handleTestNlu(preset);
                  }}
                  className="px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] hover:border-[#3C50E0] rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-[#3C50E0] transition text-left"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Tester Input Box */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={nluQuery}
                  onChange={(e) => setNluQuery(e.target.value)}
                  placeholder="Nhập câu hỏi tiếng Việt đồ điện tử cần phân tích..."
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl text-xs font-medium text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
                  onKeyDown={(e) => e.key === "Enter" && handleTestNlu()}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              <button
                onClick={() => handleTestNlu()}
                disabled={isParsingNlu}
                className="px-6 py-3 bg-[#3C50E0] text-white text-xs font-bold rounded-xl hover:bg-[#3C50E0]/90 transition shrink-0 inline-flex items-center gap-2 shadow-md shadow-[#3C50E0]/20"
              >
                <Zap className={`w-4 h-4 fill-white ${isParsingNlu ? "animate-spin" : ""}`} />
                <span>{isParsingNlu ? "Đang phân tích..." : "Chạy NLU Engine"}</span>
              </button>
            </div>

            {/* Results Display */}
            {nluResult && (
              <div className="space-y-4 pt-2">
                {/* Intent Summary Box */}
                <div className="p-5 bg-[#0D1117] rounded-xl border border-slate-800 text-slate-200 font-mono text-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Intent Nhận Dạng Hàng Đầu (Top Intent):</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-md text-xs font-extrabold border ${getIntentBadgeColor(nluResult.intent)}`}>
                          {nluResult.intent} ({getIntentVietnameseName(nluResult.intent)})
                        </span>
                        <span className="text-emerald-400 font-bold text-xs">
                          Confidence: {(nluResult.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <span>Engine Source:</span>
                      <div className="text-slate-200 font-bold">{nluResult.source || "PhoBERT Engine"}</div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Độ tin cậy phân loại Intent:</span>
                      <span className="text-emerald-400 font-bold">{(nluResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, nluResult.confidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Extracted Entities */}
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-2">
                      Thực Thể Sản Phẩm Bóc Tách ({nluResult.entities?.length || 0} Slots):
                    </span>

                    {nluResult.entities?.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {nluResult.entities.map((ent: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold text-[10px] uppercase border border-purple-700/50">
                                {ent.entity_type || ent.label}
                              </span>
                              <div className="text-white font-bold mt-1 text-xs">"{ent.text}"</div>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              char {ent.start_char ?? ent.start}-{ent.end_char ?? ent.end}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-500 text-[11px]">
                        Không tìm thấy thực thể sản phẩm (BRAND, MODEL, SPEC, PRICE) trong truy vấn này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DATASET EXPLORER (1,620 LABELED SAMPLES) */}
      {activeTab === "DATASET" && (
        <div className="space-y-6">
          {/* Intent Breakdown Stats Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(intentStats).map(([intentKey, count]) => (
              <div
                key={intentKey}
                onClick={() => {
                  setSelectedIntentFilter(intentKey);
                  setCurrentPage(1);
                }}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedIntentFilter === intentKey
                    ? "bg-[#3C50E0]/10 border-[#3C50E0] shadow-sm"
                    : "bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#2E3A47] hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1C2434] dark:text-white truncate">
                    {getIntentVietnameseName(intentKey)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold">
                    {count}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">{intentKey}</div>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm mẫu câu hoặc thực thể (VD: Asus, 20 triệu, RAM 16GB)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl text-xs font-medium text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#3C50E0] text-white text-xs font-bold rounded-xl hover:bg-[#3C50E0]/90 transition"
              >
                Tìm kiếm
              </button>
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedIntentFilter}
                onChange={(e) => {
                  setSelectedIntentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2.5 bg-[#F8FAFC] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl text-xs font-bold text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
              >
                <option value="ALL">Tất cả Intent ({totalSamples} mẫu)</option>
                <option value="compare_products">So sánh sản phẩm</option>
                <option value="ask_specs">Hỏi thông số kỹ thuật</option>
                <option value="ask_price">Hỏi giá sản phẩm</option>
                <option value="ask_warranty">Hỏi chính sách bảo hành</option>
                <option value="purchase_consultation">Tư vấn chọn mua</option>
                <option value="ask_promotion">Hỏi khuyến mãi</option>
                <option value="order_product">Đặt hàng & Thanh toán</option>
                <option value="complain">Khiếu nại & Báo lỗi</option>
                <option value="general_query">Hỏi đáp chung</option>
              </select>
            </div>
          </div>

          {/* Dataset Grid */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
              <span className="font-bold text-[#1C2434] dark:text-white">
                Danh sách Mẫu Dữ Liệu Train ({filteredCount} mẫu thỏa điều kiện):
              </span>
              <span className="text-slate-500 font-mono">
                Trang {currentPage} / {totalPages}
              </span>
            </div>

            {isLoadingDataset ? (
              <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-[#3C50E0]" />
                <span>Đang tải danh sách mẫu dữ liệu NLU...</span>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {datasetItems.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F8FAFC] dark:bg-[#10172A] rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] space-y-2.5 flex flex-col justify-between hover:border-[#3C50E0] transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getIntentBadgeColor(sample.intent)}`}>
                          {sample.intent}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sample.entities?.length || 0} entities
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C2434] dark:text-white leading-relaxed">
                        "{sample.text}"
                      </p>
                    </div>

                    {sample.entities?.length > 0 && (
                      <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex flex-wrap gap-1">
                        {sample.entities.map((e, eIdx) => (
                          <span
                            key={eIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                          >
                            <strong className="text-purple-600 dark:text-purple-400">{e.entity_type || e.label}:</strong> "{e.text}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold rounded-lg disabled:opacity-50 transition"
              >
                Trang trước
              </button>

              <span className="font-mono text-slate-500">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold rounded-lg disabled:opacity-50 transition"
              >
                Trang tiếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDALLION PIPELINE & SUPABASE DB */}
      {activeTab === "MEDALLION" && (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47]">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 font-extrabold text-[11px]">
                Bronze Stage (Raw)
              </span>
              <h3 className="text-base font-bold mt-2">Raw Data Lake</h3>
              <p className="text-xs text-slate-500 mt-1">Dữ liệu cào thô từ CellphoneS, TGDD chưa qua làm sạch.</p>
              <div className="mt-4 pt-2 border-t font-mono text-xs text-slate-400">300+ Raw Items</div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47]">
              <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-600 font-extrabold text-[11px]">
                Silver Stage (Relational)
              </span>
              <h3 className="text-base font-bold mt-2">Supabase PostgreSQL</h3>
              <p className="text-xs text-slate-500 mt-1">Chuẩn hóa 300 sản phẩm, biến thể và ảnh WebP.</p>
              <div className="mt-4 pt-2 border-t font-mono text-xs text-emerald-600 font-bold">300 SP Synced 100%</div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2E3A47]">
              <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-600 font-extrabold text-[11px]">
                Platinum Stage (AI)
              </span>
              <h3 className="text-base font-bold mt-2">BGE-M3 & PhoBERT NLU</h3>
              <p className="text-xs text-slate-500 mt-1">Chỉ số Vector Embeddings & 1,620 mẫu gán nhãn NLU.</p>
              <div className="mt-4 pt-2 border-t font-mono text-xs text-purple-600 font-bold">1,620 Samples Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
