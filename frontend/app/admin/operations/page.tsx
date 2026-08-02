"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import {
  Play,
  RotateCw,
  Terminal,
  Database,
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  StopCircle,
} from "lucide-react";

type LogEntry = {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  progress: number;
  dataExtra?: any;
};

export default function AdminOperationsCrawlerPage() {
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [targetCategory, setTargetCategory] = useState<string>("Laptop");
  const [targetCount, setTargetCount] = useState<number>(300);

  // Stats Counters
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [crawledCount, setCrawledCount] = useState<number>(0);
  const [compressedCount, setCompressedCount] = useState<number>(0);
  const [supabaseCount, setSupabaseCount] = useState<number>(0);

  const terminalRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStartCrawl = () => {
    if (isCrawling) return;

    setIsCrawling(true);
    setProgress(0);
    setLogs([]);
    setCrawledCount(0);
    setCompressedCount(0);
    setSupabaseCount(0);

    const params = new URLSearchParams({
      count: targetCount.toString(),
      category: targetCategory,
    });

    const sse = new EventSource(`/api/admin/crawler/stream?${params.toString()}`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data: LogEntry = JSON.parse(event.data);
        data.id = Math.random().toString(36).substring(2, 9);

        setLogs((prev) => [...prev, data]);
        setProgress(data.progress || 0);

        if (data.type === "SAVE_ITEM") {
          setCrawledCount((prev) => prev + 1);
        }
        if (data.type === "COMPRESS_SUCCESS") {
          setCompressedCount((prev) => prev + 1);
        }
        if (data.type === "SUPABASE_SUCCESS") {
          setSupabaseCount((prev) => prev + 1);
        }

        if (data.type === "COMPLETE" || data.type === "ERROR") {
          setIsCrawling(false);
          sse.close();
        }
      } catch (err) {
        console.error("Lỗi parse SSE:", err);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE Error:", err);
      setIsCrawling(false);
      sse.close();
    };
  };

  const handleStopCrawl = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsCrawling(false);
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        type: "STOP",
        message: "🛑 Đã dừng tiến trình Crawl theo yêu cầu của quản trị viên.",
        progress,
      },
    ]);
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case "INIT":
        return <span className="px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700 font-bold">INIT</span>;
      case "CRAWL":
        return <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 font-bold">CRAWL</span>;
      case "COMPRESS_START":
      case "COMPRESS_SUCCESS":
        return <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700 font-bold">IMAGE &lt;50KB</span>;
      case "SUPABASE_UPLOADING":
      case "SUPABASE_SUCCESS":
        return <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-bold">SUPABASE</span>;
      case "SAVE_ITEM":
        return <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700 font-bold">SILVER STORE</span>;
      case "COMPLETE":
        return <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold animate-pulse">DONE 100%</span>;
      case "ERROR":
      case "STOP":
        return <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700 font-bold">ALERT</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminJSPageHeader
        title="Bảng Điều Khiển Live Web Crawler & Supabase Image Compression"
        resourceName="Web Crawler"
        count={crawledCount}
        description="Khởi chạy cào dữ liệu sản phẩm trực tiếp từ Frontend, tự động nén ảnh sản phẩm <= 50KB và đồng bộ trực tiếp lên Supabase Storage."
      />

      {/* Control Panel Card */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#3C50E0]/10 text-[#3C50E0] dark:text-[#80CAEE] rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C2434] dark:text-white">Cấu Hình Lệnh Crawl Dữ Liệu Live</h3>
              <p className="text-xs text-[#64748B] dark:text-[#8A99AD]">
                Chọn nhóm thiết bị và số lượng để kích hoạt crawler kèm nén ảnh tự động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isCrawling ? (
              <button
                onClick={handleStartCrawl}
                className="px-5 py-2.5 bg-[#3C50E0] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#3C50E0]/90 transition inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt Đầu Crawl Dữ Liệu Live</span>
              </button>
            ) : (
              <button
                onClick={handleStopCrawl}
                className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 transition inline-flex items-center gap-2 animate-pulse"
              >
                <StopCircle className="w-4 h-4" />
                <span>Dừng Tiến Trình</span>
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div>
            <label className="block font-bold text-[#1C2434] dark:text-white mb-1">
              Nhóm Danh Mục Target:
            </label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              disabled={isCrawling}
              className="w-full p-2.5 bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-lg font-medium text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
            >
              <option value="ALL">Tất cả sản phẩm (Điện thoại, Laptop, Sound, Smartwatch...)</option>
              <option value="Điện thoại">Điện thoại</option>
              <option value="Laptop">Laptop</option>
              <option value="Âm thanh">Âm thanh</option>
              <option value="Đồng hồ thông minh">Đồng hồ thông minh</option>
              <option value="Gia dụng thông minh">Gia dụng thông minh</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1C2434] dark:text-white mb-1">
              Số Lượng Sản Phẩm Cào (SLL):
            </label>
            <select
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
              disabled={isCrawling}
              className="w-full p-2.5 bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-lg font-medium text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
            >
              <option value={10}>10 mẫu Laptop (Crawl thử nghiệm)</option>
              <option value={50}>50 mẫu Laptop (Số Lượng Lớn)</option>
              <option value={100}>100 mẫu Laptop (SLL Cao)</option>
              <option value={300}>300 mẫu Laptop (SIÊU SLL 🚀 - Toàn Bộ Catalog 300 SP)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1C2434] dark:text-white mb-1">
              Tiêu Chuẩn Nén & Storage:
            </label>
            <div className="p-2 bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-lg font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>WebP (Max Size ≤ 50KB)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Supabase Active</span>
            </div>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-[#1C2434] dark:text-white flex items-center gap-2">
              <RotateCw className={`w-3.5 h-3.5 text-[#3C50E0] ${isCrawling ? "animate-spin" : ""}`} />
              <span>Tiến Trình Thực Thi Realtime:</span>
            </span>
            <span className="font-mono text-sm text-[#3C50E0] dark:text-[#80CAEE]">{progress}%</span>
          </div>

          <div className="w-full bg-[#E2E8F0] dark:bg-[#10172A] rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-linear-to-r from-[#3C50E0] to-[#80CAEE] h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Live KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#3C50E0]/10 text-[#3C50E0] dark:text-[#80CAEE] rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sản Phẩm Đã Crawl</p>
            <h4 className="text-xl font-bold text-[#1C2434] dark:text-white font-mono mt-0.5">
              {crawledCount} SP
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <FileImage className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Ảnh Nén WebP (≤ 50KB)</p>
            <h4 className="text-xl font-bold text-[#1C2434] dark:text-white font-mono mt-0.5">
              {compressedCount} ảnh
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đã Đẩy Supabase Storage</p>
            <h4 className="text-xl font-bold text-[#1C2434] dark:text-white font-mono mt-0.5">
              {supabaseCount} URLs
            </h4>
          </div>
        </div>
      </div>

      {/* Terminal Live Stream Console Window */}
      <div className="bg-[#0D1117] rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Terminal Header */}
        <div className="bg-[#161B22] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-slate-400 font-bold ml-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>crawler-live-stream.log</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500">{logs.length} dòng log</span>
            <button
              onClick={() => setLogs([])}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition"
            >
              Xóa Console Log
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div ref={terminalRef} className="p-4 h-96 overflow-y-auto space-y-2.5 custom-scrollbar text-slate-300">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-16">
              <Terminal className="w-8 h-8 text-slate-700" />
              <p>Chưa có dữ liệu log. Nhấn nút "Bắt Đầu Crawl Dữ Liệu Live" ở trên để khởi chạy tiến trình.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 hover:bg-slate-900/50 p-1 rounded transition">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <div className="shrink-0">{getLogBadge(log.type)}</div>
                <div className="flex-1 leading-relaxed">
                  <span className="text-slate-200">{log.message}</span>
                  {log.dataExtra?.supabaseUrl && (
                    <div className="mt-1 p-2 bg-emerald-950/40 border border-emerald-800/50 rounded text-[11px] flex items-center justify-between">
                      <span className="text-emerald-300 truncate">{log.dataExtra.supabaseUrl}</span>
                      <a
                        href={log.dataExtra.supabaseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-bold shrink-0 ml-2"
                      >
                        <span>Mở Ảnh Supabase</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-[#161B22] px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine Status: {isCrawling ? "🟢 RUNNING STREAM" : "⚪ IDLE"}</span>
          <Link
            href="/admin/products"
            className="text-[#80CAEE] hover:underline font-bold flex items-center gap-1"
          >
            <span>Đi tới Kho Sản Phẩm Crawled (Products Resource)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
