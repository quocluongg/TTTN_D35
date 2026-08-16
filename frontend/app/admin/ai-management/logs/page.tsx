"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  MessageSquare,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap,
  AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface ChatLog {
  timestamp: string;
  query: string;
  intent: string;
  confidence: number;
  response_preview: string;
  sources_count: number;
  latency_ms: number;
}

interface SyncLog {
  timestamp: string;
  product_id: string;
  product_name: string;
  action: string;
  chunks_created: number;
  status: string;
  duration_ms: number;
}

async function fetchChatLogs(page: number, intent?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (intent) params.append("intent", intent);
  const res = await fetch(`${API_URL}/admin/rag/logs/chat?${params}`);
  if (!res.ok) throw new Error("Failed to fetch chat logs");
  return res.json();
}

async function fetchSyncLogs(page: number) {
  const res = await fetch(`${API_URL}/admin/rag/logs/sync?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch sync logs");
  return res.json();
}

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "sync">("chat");
  const [chatPage, setChatPage] = useState(1);
  const [syncPage, setSyncPage] = useState(1);
  const [intentFilter, setIntentFilter] = useState("");

  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ["rag-chat-logs", chatPage, intentFilter],
    queryFn: () => fetchChatLogs(chatPage, intentFilter || undefined),
    enabled: activeTab === "chat",
    refetchInterval: 10000,
  });

  const { data: syncData, isLoading: syncLoading } = useQuery({
    queryKey: ["rag-sync-logs", syncPage],
    queryFn: () => fetchSyncLogs(syncPage),
    enabled: activeTab === "sync",
    refetchInterval: 10000,
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("vi-VN");
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      ask_specs: "bg-blue-100 text-blue-800",
      ask_price: "bg-green-100 text-green-800",
      compare_products: "bg-purple-100 text-purple-800",
      ask_warranty: "bg-orange-100 text-orange-800",
      purchase_consultation: "bg-pink-100 text-pink-800",
      general_query: "bg-zinc-100 text-zinc-800",
      out_of_scope: "bg-red-100 text-red-800",
    };
    return colors[intent] || "bg-zinc-100 text-zinc-800";
  };

  const INTENTS = [
    "ask_specs", "ask_price", "compare_products", "ask_warranty",
    "purchase_consultation", "ask_promotion", "order_product", "complain",
    "general_query", "out_of_scope",
  ];

  return (
    <section>
      {/* Header */}
      <div className="border-b border-black pb-5">
        <h1 className="text-[28px] font-medium">Logs & History</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Lịch sử chat và sync
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-4 border-b border-black">
        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "chat"
              ? "border-black text-black"
              : "border-transparent text-zinc-500 hover:text-black"
          }`}
        >
          <MessageSquare size={16} className="inline mr-2" />
          Chat History
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sync"
              ? "border-black text-black"
              : "border-transparent text-zinc-500 hover:text-black"
          }`}
        >
          <RefreshCw size={16} className="inline mr-2" />
          Sync History
        </button>
      </div>

      {/* Chat Logs */}
      {activeTab === "chat" && (
        <div className="mt-6">
          {/* Intent Filter */}
          <div className="mb-4">
            <select
              value={intentFilter}
              onChange={(e) => { setIntentFilter(e.target.value); setChatPage(1); }}
              className="px-3 py-2 border border-zinc-300 rounded text-sm"
            >
              <option value="">Tất cả intents</option>
              {INTENTS.map((intent) => (
                <option key={intent} value={intent}>{intent}</option>
              ))}
            </select>
          </div>

          {/* Logs */}
          {chatLoading ? (
            <div className="text-center py-8 text-zinc-500">Đang tải...</div>
          ) : chatData?.logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">Chưa có chat logs</div>
          ) : (
            <div className="space-y-3">
              {chatData?.logs.map((log: ChatLog, i: number) => (
                <div key={i} className="border border-black bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Query */}
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-zinc-400" />
                        <span className="text-sm font-medium">{log.query}</span>
                      </div>

                      {/* Intent & Confidence */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getIntentColor(log.intent)}`}>
                          {log.intent}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {(log.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>

                      {/* Response Preview */}
                      <p className="text-sm text-zinc-600 line-clamp-2">
                        {log.response_preview}
                      </p>

                      {/* Meta */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(log.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap size={12} />
                          {log.latency_ms}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Brain size={12} />
                          {log.sources_count} sources
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {chatData && chatData.total > 50 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-zinc-600">
                {chatData.total} logs
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setChatPage((p) => Math.max(1, p - 1))}
                  disabled={chatPage === 1}
                  className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setChatPage((p) => p + 1)}
                  disabled={chatData.logs.length < 50}
                  className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sync Logs */}
      {activeTab === "sync" && (
        <div className="mt-6">
          {syncLoading ? (
            <div className="text-center py-8 text-zinc-500">Đang tải...</div>
          ) : syncData?.logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">Chưa có sync logs</div>
          ) : (
            <div className="space-y-3">
              {syncData?.logs.map((log: SyncLog, i: number) => (
                <div key={i} className="border border-black bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw size={14} className="text-zinc-400" />
                        <span className="text-sm font-medium">{log.product_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          log.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>{log.action}</span>
                        <span>{log.chunks_created} chunks</span>
                        <span>{log.duration_ms}ms</span>
                        <span>{formatTime(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
