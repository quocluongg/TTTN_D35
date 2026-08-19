"use client";

import React, { useState, useEffect } from "react";
import { adminApi } from "@/services/admin";
import {
  MessageSquare,
  Flag,
  ShieldAlert,
  Database,
  Search,
  Loader2,
  ArrowLeft,
  Send,
} from "lucide-react";
import { notifyError, notifySuccess } from "@/components/Notify";

type Conversation = {
  id: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  status: string;
  handoffStaffName?: string;
  source: string;
  kbVersionName?: string;
  startedAt?: string;
  endedAt?: string;
  messageCount: number;
};

type Message = {
  id: string;
  role: string;
  content: string;
  intent?: string;
  confidence?: number;
  flagStatus: string;
  flagNote?: string;
  createdAt?: string;
};

type SensitiveQuestion = { id: string; pattern: string; category?: string; isActive: boolean };
type KbVersion = { id: string; name: string; description?: string; chunkingStrategy?: string; embeddingModel?: string; isActive: boolean };

type Tab = "conversations" | "sensitive" | "kb" | "analytics";

type Dashboard = {
  totalConversations: number;
  activeConversations: number;
  handoffConversations: number;
  totalMessages: number;
  flaggedMessages: number;
  avgSessionDurationSeconds: number;
  addToCartRate: number;
  orderConversionRate: number;
  totalOrdersPlaced: number;
  sensitiveQuestionCount: number;
};

type StatPoint = {
  period: string;
  conversations: number;
  uniqueUsers: number;
  avgDurationSeconds: number;
  messages: number;
  addToCartCount: number;
  orderPlacedCount: number;
  conversionRate: number;
};

type TopProductAsked = { productId: string; productName: string; mentionCount: number; orderCount: number };
type TopQuestion = { category: string; questionCount: number; percentage: number };
type KbEffect = { versionName: string; conversations: number; messages: number; avgConfidence: number; flaggedCount: number; flaggedRate: number; ordersPlaced: number; conversionRate: number };

export default function ChatAdminPage() {
  const [tab, setTab] = useState<Tab>("conversations");

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [takeoverMsg, setTakeoverMsg] = useState("");

  // Sensitive questions
  const [sensitive, setSensitive] = useState<SensitiveQuestion[]>([]);
  const [sensitivePattern, setSensitivePattern] = useState("");
  const [sensitiveCategory, setSensitiveCategory] = useState("");

  // KB versions
  const [kbVersions, setKbVersions] = useState<KbVersion[]>([]);
  const [kbName, setKbName] = useState("");
  const [kbChunking, setKbChunking] = useState("");
  const [kbEmbedding, setKbEmbedding] = useState("");

  // Analytics
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [userStats, setUserStats] = useState<StatPoint[]>([]);
  const [topProductsAsked, setTopProductsAsked] = useState<TopProductAsked[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [kbEffect, setKbEffect] = useState<KbEffect[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadConversations = async () => {
    setConvLoading(true);
    try {
      const res: any = await adminApi.chat.conversations({ search, size: 100 });
      const data = res?.data?.items || res?.data?.content || res?.data || [];
      setConversations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tải được danh sách hội thoại");
    } finally {
      setConvLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    setMsgLoading(true);
    try {
      const res: any = await adminApi.chat.messages(convId, { size: 100 });
      const data = res?.data?.items || res?.data?.content || res?.data || [];
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tải được tin nhắn");
    } finally {
      setMsgLoading(false);
    }
  };

  const loadSensitive = async () => {
    try {
      const res: any = await adminApi.chat.sensitiveQuestions({ size: 100 });
      setSensitive(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tải được câu hỏi nhạy cảm");
    }
  };

  const loadKbVersions = async () => {
    try {
      const res: any = await adminApi.chat.kbVersions();
      setKbVersions(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tải được phiên bản KB");
    }
  };

  useEffect(() => { loadConversations(); }, [search]);
  useEffect(() => { if (tab === "sensitive") loadSensitive(); }, [tab]);
  useEffect(() => { if (tab === "kb") loadKbVersions(); }, [tab]);
  useEffect(() => { if (tab === "analytics") loadAnalytics(); }, [tab]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [d, s, tp, tq, k] = await Promise.all([
        adminApi.chat.dashboard(),
        adminApi.chat.userStats({ groupBy: "day" }),
        adminApi.chat.topProductsAsked({ limit: 10 }),
        adminApi.chat.topQuestions({ limit: 10 }),
        adminApi.chat.kbEffectiveness(),
      ]);
      setDashboard(d?.data || null);
      setUserStats(Array.isArray(s?.data) ? s.data : []);
      setTopProductsAsked(Array.isArray(tp?.data) ? tp.data : []);
      setTopQuestions(Array.isArray(tq?.data) ? tq.data : []);
      setKbEffect(Array.isArray(k?.data) ? k.data : []);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tải được báo cáo");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
  };

  const flagMessage = async (msgId: string, flagStatus: string, note?: string) => {
    try {
      await adminApi.chat.flagMessage(msgId, { flagStatus, note });
      notifySuccess("Đã cập nhật cờ chất lượng");
      if (selectedConv) loadMessages(selectedConv.id);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không gắn cờ được");
    }
  };

  const takeover = async () => {
    if (!selectedConv || !takeoverMsg.trim()) return;
    try {
      await adminApi.chat.takeover(selectedConv.id, { message: takeoverMsg.trim() });
      notifySuccess("Đã tiếp quản hội thoại");
      setTakeoverMsg("");
      loadConversations();
      openConversation(selectedConv);
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tiếp quản được");
    }
  };

  const closeConversation = async () => {
    if (!selectedConv) return;
    try {
      await adminApi.chat.close(selectedConv.id);
      notifySuccess("Đã đóng hội thoại");
      loadConversations();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không đóng được");
    }
  };

  const addSensitive = async () => {
    if (!sensitivePattern.trim()) return;
    try {
      await adminApi.chat.createSensitiveQuestion({ pattern: sensitivePattern.trim(), category: sensitiveCategory || null });
      notifySuccess("Đã thêm câu hỏi nhạy cảm");
      setSensitivePattern("");
      setSensitiveCategory("");
      loadSensitive();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không thêm được");
    }
  };

  const deleteSensitive = async (id: string) => {
    try {
      await adminApi.chat.deleteSensitiveQuestion(id);
      notifySuccess("Đã xóa");
      loadSensitive();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không xóa được");
    }
  };

  const addKbVersion = async () => {
    if (!kbName.trim()) return;
    try {
      await adminApi.chat.createKbVersion({ name: kbName.trim(), chunkingStrategy: kbChunking || null, embeddingModel: kbEmbedding || null, isActive: true });
      notifySuccess("Đã tạo phiên bản KB");
      setKbName("");
      setKbChunking("");
      setKbEmbedding("");
      loadKbVersions();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Không tạo được");
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "conversations", label: "Hội thoại & Chất lượng", icon: MessageSquare },
    { key: "analytics", label: "Báo cáo", icon: Flag },
    { key: "sensitive", label: "Câu hỏi nhạy cảm", icon: ShieldAlert },
    { key: "kb", label: "Phiên bản KB", icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Quản trị Chatbot / RAG</h1>
        <div className="flex border border-black rounded overflow-hidden">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm ${tab === key ? "bg-black text-white" : "hover:bg-zinc-100"}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversation list */}
          <div className="border border-black rounded-lg p-4 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo email / tên / session..."
                className="w-full pl-9 pr-3 py-2 border border-black text-sm"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {convLoading && <Loader2 className="animate-spin mx-auto" />}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left border p-3 text-sm ${selectedConv?.id === c.id ? "bg-zinc-100" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.userName || c.userEmail || c.sessionId}</span>
                    <span className={`text-xs px-2 py-0.5 ${c.status === "HANDOFF" ? "bg-amber-100" : c.status === "CLOSED" ? "bg-zinc-200" : "bg-green-100"}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {c.messageCount} tin nhắn • {c.source}
                    {c.handoffStaffName ? ` • NV: ${c.handoffStaffName}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation detail */}
          <div className="border border-black rounded-lg p-4 space-y-3">
            {!selectedConv ? (
              <p className="text-sm text-zinc-500">Chọn một hội thoại để xem tin nhắn.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Hội thoại: {selectedConv.userEmail || selectedConv.sessionId}</h3>
                  <div className="flex gap-2">
                    <button onClick={closeConversation} className="px-3 py-1 border border-black text-sm">Đóng</button>
                    <button onClick={() => setSelectedConv(null)} className="px-3 py-1 border text-sm flex items-center gap-1"><ArrowLeft size={14} /> Thoát</button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[440px] overflow-y-auto">
                  {msgLoading && <Loader2 className="animate-spin mx-auto" />}
                  {messages.map((m) => (
                    <div key={m.id} className={`border p-3 text-sm ${m.role === "USER" ? "bg-zinc-50" : m.role === "STAFF" ? "bg-amber-50" : "bg-white"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase">{m.role}</span>
                        <div className="flex items-center gap-1">
                          {m.intent && <span className="text-[10px] bg-zinc-200 px-1.5 py-0.5">{m.intent}</span>}
                          {m.confidence != null && <span className="text-[10px] text-zinc-500">{Math.round(m.confidence * 100)}%</span>}
                          <button onClick={() => flagMessage(m.id, m.flagStatus === "NEEDS_REVIEW" ? "NONE" : "NEEDS_REVIEW")}
                            title="Gắn cờ cần cải thiện"
                            className={`p-1 ${m.flagStatus === "NEEDS_REVIEW" ? "text-amber-500" : "text-zinc-400 hover:text-amber-500"}`}>
                            <Flag size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <input
                    value={takeoverMsg}
                    onChange={(e) => setTakeoverMsg(e.target.value)}
                    placeholder="Tin nhắn tiếp quản (gửi tới khách)..."
                    className="flex-1 border border-black px-3 py-2 text-sm"
                  />
                  <button onClick={takeover} className="px-3 py-2 bg-black text-white text-sm flex items-center gap-1">
                    <Send size={14} /> Tiếp quản
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading && <Loader2 className="animate-spin" />}

          {/* KPI Cards */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Tổng hội thoại", value: dashboard.totalConversations },
                { label: "Hội thoại đang mở", value: dashboard.activeConversations },
                { label: "Tiếp quản bởi NV", value: dashboard.handoffConversations },
                { label: "Đơn hàng từ chatbot", value: dashboard.totalOrdersPlaced },
                { label: "Tỉ lệ thêm giỏ", value: dashboard.addToCartRate + "%" },
                { label: "Tỉ lệ chuyển đổi", value: dashboard.orderConversionRate + "%" },
                { label: "Độ dài phiên TB", value: Math.round(dashboard.avgSessionDurationSeconds) + "s" },
                { label: "Câu trả lời cần cải thiện", value: dashboard.flaggedMessages },
              ].map((k) => (
                <div key={k.label} className="border border-black rounded-lg p-4">
                  <p className="text-xs text-zinc-500">{k.label}</p>
                  <p className="text-2xl font-medium mt-1">{k.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* User stats */}
          <div className="border border-black rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Thống kê người dùng theo ngày</h3>
              <button
                onClick={() => exportCSV("chat-user-stats.csv",
                  ["Ngày", "Hội thoại", "Người dùng", "Thời gian TB(s)", "Tin nhắn", "Thêm giỏ", "Đơn hàng", "Chuyển đổi(%)"],
                  userStats.map((s) => [s.period, s.conversations, s.uniqueUsers, Math.round(s.avgDurationSeconds), s.messages, s.addToCartCount, s.orderPlacedCount, s.conversionRate]))}
                className="px-3 py-1 border border-black text-xs"
              >
                Xuất Excel
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1 pr-3">Ngày</th>
                  <th className="py-1 pr-3">Hội thoại</th>
                  <th className="py-1 pr-3">Người dùng</th>
                  <th className="py-1 pr-3">TB(s)</th>
                  <th className="py-1 pr-3">Tin nhắn</th>
                  <th className="py-1 pr-3">Thêm giỏ</th>
                  <th className="py-1 pr-3">Đơn</th>
                  <th className="py-1">Chuyển đổi</th>
                </tr>
              </thead>
              <tbody>
                {userStats.map((s) => (
                  <tr key={s.period} className="border-b">
                    <td className="py-1.5 pr-3">{s.period}</td>
                    <td className="py-1.5 pr-3">{s.conversations}</td>
                    <td className="py-1.5 pr-3">{s.uniqueUsers}</td>
                    <td className="py-1.5 pr-3">{Math.round(s.avgDurationSeconds)}</td>
                    <td className="py-1.5 pr-3">{s.messages}</td>
                    <td className="py-1.5 pr-3">{s.addToCartCount}</td>
                    <td className="py-1.5 pr-3">{s.orderPlacedCount}</td>
                    <td className="py-1.5">{s.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top products asked */}
          <div className="border border-black rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Top sản phẩm được hỏi nhiều</h3>
              <button
                onClick={() => exportCSV("chat-top-products.csv",
                  ["Sản phẩm", "Số lần hỏi", "Số đơn"],
                  topProductsAsked.map((p) => [p.productName, p.mentionCount, p.orderCount]))}
                className="px-3 py-1 border border-black text-xs"
              >
                Xuất Excel
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1 pr-3">Sản phẩm</th>
                  <th className="py-1 pr-3">Số lần hỏi</th>
                  <th className="py-1">Số đơn</th>
                </tr>
              </thead>
              <tbody>
                {topProductsAsked.map((p) => (
                  <tr key={p.productId} className="border-b">
                    <td className="py-1.5 pr-3">{p.productName}</td>
                    <td className="py-1.5 pr-3">{p.mentionCount}</td>
                    <td className="py-1.5">{p.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top questions by category */}
          <div className="border border-black rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Top câu hỏi theo danh mục</h3>
              <button
                onClick={() => exportCSV("chat-top-questions.csv",
                  ["Danh mục", "Số câu hỏi", "Tỉ lệ(%)"],
                  topQuestions.map((q) => [q.category, q.questionCount, q.percentage]))}
                className="px-3 py-1 border border-black text-xs"
              >
                Xuất Excel
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1 pr-3">Danh mục</th>
                  <th className="py-1 pr-3">Số câu hỏi</th>
                  <th className="py-1">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {topQuestions.map((q) => (
                  <tr key={q.category} className="border-b">
                    <td className="py-1.5 pr-3">{q.category}</td>
                    <td className="py-1.5 pr-3">{q.questionCount}</td>
                    <td className="py-1.5">{q.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KB effectiveness */}
          <div className="border border-black rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Hiệu quả RAG theo phiên bản KB</h3>
              <button
                onClick={() => exportCSV("chat-kb-effectiveness.csv",
                  ["Phiên bản", "Hội thoại", "Tin nhắn", "Confidence TB", "Bị gắn cờ", "Tỉ lệ cờ(%)", "Đơn", "Chuyển đổi(%)"],
                  kbEffect.map((k) => [k.versionName, k.conversations, k.messages, k.avgConfidence, k.flaggedCount, k.flaggedRate, k.ordersPlaced, k.conversionRate]))}
                className="px-3 py-1 border border-black text-xs"
              >
                Xuất Excel
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1 pr-3">Phiên bản</th>
                  <th className="py-1 pr-3">Hội thoại</th>
                  <th className="py-1 pr-3">Confidence TB</th>
                  <th className="py-1 pr-3">Bị gắn cờ</th>
                  <th className="py-1 pr-3">Đơn</th>
                  <th className="py-1">Chuyển đổi</th>
                </tr>
              </thead>
              <tbody>
                {kbEffect.map((k) => (
                  <tr key={k.versionName} className="border-b">
                    <td className="py-1.5 pr-3">{k.versionName}</td>
                    <td className="py-1.5 pr-3">{k.conversations}</td>
                    <td className="py-1.5 pr-3">{k.avgConfidence}</td>
                    <td className="py-1.5 pr-3">{k.flaggedCount}</td>
                    <td className="py-1.5 pr-3">{k.ordersPlaced}</td>
                    <td className="py-1.5">{k.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "sensitive" && (
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-2">
            <input
              value={sensitivePattern}
              onChange={(e) => setSensitivePattern(e.target.value)}
              placeholder="Pattern câu hỏi nhạy cảm (vd: mật khẩu)"
              className="flex-1 border border-black px-3 py-2 text-sm"
            />
            <input
              value={sensitiveCategory}
              onChange={(e) => setSensitiveCategory(e.target.value)}
              placeholder="Danh mục"
              className="w-40 border border-black px-3 py-2 text-sm"
            />
            <button onClick={addSensitive} className="px-4 bg-black text-white text-sm">Thêm</button>
          </div>
          <div className="border border-black rounded-lg overflow-hidden">
            {sensitive.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2 border-b text-sm">
                <span>{s.pattern} <span className="text-zinc-400 text-xs">({s.category || "chung"})</span></span>
                <button onClick={() => deleteSensitive(s.id)} className="text-red-500 text-xs">Xóa</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "kb" && (
        <div className="max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={kbName} onChange={(e) => setKbName(e.target.value)} placeholder="Tên phiên bản (vd: v2)" className="border border-black px-3 py-2 text-sm" />
            <input value={kbChunking} onChange={(e) => setKbChunking(e.target.value)} placeholder="Chunking strategy" className="border border-black px-3 py-2 text-sm" />
            <input value={kbEmbedding} onChange={(e) => setKbEmbedding(e.target.value)} placeholder="Embedding model" className="border border-black px-3 py-2 text-sm" />
          </div>
          <button onClick={addKbVersion} className="px-4 bg-black text-white text-sm">Tạo phiên bản</button>
          <div className="border border-black rounded-lg overflow-hidden">
            {kbVersions.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-2 border-b text-sm">
                <span>
                  <b>{v.name}</b> {v.isActive ? <span className="text-green-600 text-xs">(active)</span> : <span className="text-zinc-400 text-xs">(inactive)</span>}
                  <span className="text-zinc-400 text-xs ml-2">chunking: {v.chunkingStrategy || "-"} • embedding: {v.embeddingModel || "-"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}