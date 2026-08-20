"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import { notifyError, notifySuccess } from "@/components/Notify";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageSquare, RefreshCw, Clock, ChevronLeft, ChevronRight,
  Brain, Zap, AlertCircle, Flag, Eye, UserCheck, X, CheckCircle2,
  ArrowRightCircle, User, Bot,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";
const unwrap = (x: any) => x?.data ?? x;

interface ChatLog { timestamp: string; query: string; intent: string; confidence: number; response_preview: string; sources_count: number; latency_ms: number; }
interface SyncLog { timestamp: string; product_id: string; product_name: string; action: string; chunks_created: number; status: string; duration_ms: number; }

async function fetchSyncLogs(page: number) {
  const res = await fetch(`${API_URL}/admin/logs/sync?page=${page}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  HANDOFF: "bg-amber-50 text-amber-700",
  CLOSED: "bg-zinc-100 text-zinc-600",
};

const FLAG_COLORS: Record<string, string> = {
  NONE: "text-zinc-300",
  NEEDS_REVIEW: "text-amber-500",
  APPROVED: "text-emerald-500",
  REJECTED: "text-red-500",
};

const INTENT_COLORS: Record<string, string> = {
  ask_specs: "bg-blue-50 text-blue-700",
  ask_price: "bg-green-50 text-green-700",
  compare_products: "bg-purple-50 text-purple-700",
  ask_warranty: "bg-orange-50 text-orange-700",
  purchase_consultation: "bg-pink-50 text-pink-700",
  ask_promotion: "bg-yellow-50 text-yellow-700",
  order_product: "bg-indigo-50 text-indigo-700",
  complain: "bg-red-50 text-red-700",
  general_query: "bg-zinc-100 text-zinc-600",
  out_of_scope: "bg-gray-100 text-gray-500",
};

const INTENTS = ["ask_specs","ask_price","compare_products","ask_warranty","purchase_consultation","ask_promotion","order_product","complain","general_query","out_of_scope"];

export default function LogsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"conversations" | "sync">("conversations");
  const [statusFilter, setStatusFilter] = useState("");
  const [convPage, setConvPage] = useState(0);
  const [syncPage, setSyncPage] = useState(1);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Conversations from Spring Boot
  const convQuery = useQuery({
    queryKey: ["admin-chat-conversations", statusFilter, convPage],
    queryFn: () => adminApi.chat.conversations({ status: statusFilter || undefined, page: convPage, size: 15 }),
    enabled: activeTab === "conversations",
    refetchInterval: 15000,
  });

  // Messages for selected conversation
  const msgQuery = useQuery({
    queryKey: ["admin-chat-messages", selectedConv?.id],
    queryFn: () => adminApi.chat.messages(selectedConv!.id, { page: 0, size: 50 }),
    enabled: !!selectedConv?.id && detailOpen,
  });

  // Sync logs from Python AI
  const syncQuery = useQuery({
    queryKey: ["rag-sync-logs", syncPage],
    queryFn: () => fetchSyncLogs(syncPage),
    enabled: activeTab === "sync",
    refetchInterval: 15000,
  });

  const takeoverMutation = useMutation({
    mutationFn: (id: string) => adminApi.chat.takeover(id, { note: "Nhân viên tiếp quản từ trang Admin" }),
    onSuccess: () => { notifySuccess("Đã tiếp quản hội thoại"); qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] }); },
    onError: () => notifyError("Tiếp quản thất bại"),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => adminApi.chat.close(id),
    onSuccess: () => { notifySuccess("Đã đóng hội thoại"); qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] }); setDetailOpen(false); },
    onError: () => notifyError("Đóng thất bại"),
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, flag, note }: { id: string; flag: string; note?: string }) =>
      adminApi.chat.flagMessage(id, { flagStatus: flag, flagNote: note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-chat-messages", selectedConv?.id] }); },
    onError: () => notifyError("Gắn cờ thất bại"),
  });

  const conversations = (() => {
    const raw = unwrap(convQuery.data);
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.content ?? [];
  })();
  const messages = (() => {
    const raw = unwrap(msgQuery.data);
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.content ?? [];
  })();
  const syncLogs = syncQuery.data?.logs || [];

  const fmt = (s: string) => s ? new Date(s).toLocaleString("vi-VN") : "—";
  const fmtDuration = (s: string, e: string) => {
    if (!s || !e) return "—";
    const ms = new Date(e).getTime() - new Date(s).getTime();
    return `${Math.floor(ms / 60000)} phút`;
  };

  const openDetail = (conv: any) => { setSelectedConv(conv); setDetailOpen(true); };

  const tabs = [
    { key: "conversations", label: "Hội thoại Chatbot", icon: MessageSquare },
    { key: "sync", label: "Sync Logs", icon: RefreshCw },
  ];

  const statusTabs = [
    { value: "", label: "Tất cả" },
    { value: "ACTIVE", label: "Đang chat" },
    { value: "HANDOFF", label: "Chờ tiếp quản" },
    { value: "CLOSED", label: "Đã đóng" },
  ];

  return (
    <section className="space-y-6">
      <div className="pb-5 border-b border-zinc-200">
        <h1 className="text-[26px] font-semibold text-zinc-900">Logs & Hội thoại</h1>
        <p className="mt-1 text-sm text-zinc-500">Xem lịch sử hội thoại chatbot, tiếp quản và gắn cờ chất lượng</p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors">
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Conversations Tab */}
      {activeTab === "conversations" && (
        <div className="space-y-4">
          {/* Status filter chips */}
          <div className="flex gap-2 flex-wrap">
            {statusTabs.map((s) => (
              <button key={s.value} onClick={() => { setStatusFilter(s.value); setConvPage(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                {s.label}
                {s.value === "HANDOFF" && conversations.filter((c: any) => c.status === "HANDOFF").length > 0 && !statusFilter && (
                  <span className="ml-1.5 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                    {conversations.filter((c: any) => c.status === "HANDOFF").length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversations list */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            {convQuery.isLoading ? (
              <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto" /><p className="mt-3 text-sm text-zinc-500">Đang tải...</p></div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center"><MessageSquare size={40} className="text-zinc-300 mx-auto mb-3" /><p className="text-zinc-500 text-sm">Không có dữ liệu</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-zinc-600">Khách hàng</th>
                    <th className="text-left px-5 py-3 font-medium text-zinc-600">Trạng thái</th>
                    <th className="text-left px-5 py-3 font-medium text-zinc-600 hidden md:table-cell">Bắt đầu</th>
                    <th className="text-left px-5 py-3 font-medium text-zinc-600 hidden lg:table-cell">Thời lượng</th>
                    <th className="text-right px-5 py-3 font-medium text-zinc-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {conversations.map((conv: any) => (
                    <tr key={conv.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-800">{conv.userFullName || conv.userEmail || "Khách ẩn danh"}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{conv.sessionId?.slice(0, 20)}...</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {conv.status === "ACTIVE" ? "Đang chat" : conv.status === "HANDOFF" ? "Chờ tiếp quản" : "Đã đóng"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs hidden md:table-cell">{fmt(conv.startedAt)}</td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs hidden lg:table-cell">{fmtDuration(conv.startedAt, conv.endedAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDetail(conv)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                            <Eye size={13} />Xem
                          </button>
                          {conv.status === "HANDOFF" && (
                            <button onClick={() => takeoverMutation.mutate(conv.id)} disabled={takeoverMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">
                              <UserCheck size={13} />Tiếp quản
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-2">
            <button onClick={() => setConvPage((p) => Math.max(0, p - 1))} disabled={convPage === 0}
              className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40">
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 py-2 text-sm text-zinc-600">Trang {convPage + 1}</span>
            <button onClick={() => setConvPage((p) => p + 1)} disabled={conversations.length < 15}
              className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Sync Logs Tab */}
      {activeTab === "sync" && (
        <div className="space-y-3">
          {syncQuery.isLoading ? (
            <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto" /></div>
          ) : syncLogs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-sm">Chưa có sync logs</div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 shadow-sm">
              {syncLogs.map((log: SyncLog, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={14} className="text-zinc-400 shrink-0" />
                    <div>
                      <div className="font-medium text-sm text-zinc-800">{log.product_name}</div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
                        <span>{log.action}</span><span>{log.chunks_created} chunks</span><span>{log.duration_ms}ms</span><span>{fmt(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full">{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversation Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={(o) => !o && setDetailOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={18} />
              Chi tiết hội thoại
              {selectedConv && (
                <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {selectedConv.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedConv && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* Conv info */}
              <div className="grid grid-cols-2 gap-3 text-sm bg-zinc-50 rounded-lg p-3">
                <div><span className="text-zinc-500">Khách:</span> <span className="font-medium">{selectedConv.userFullName || selectedConv.userEmail || "Ẩn danh"}</span></div>
                <div><span className="text-zinc-500">Bắt đầu:</span> <span>{fmt(selectedConv.startedAt)}</span></div>
                <div><span className="text-zinc-500">Thời lượng:</span> <span>{fmtDuration(selectedConv.startedAt, selectedConv.endedAt)}</span></div>
                <div><span className="text-zinc-500">KB Version:</span> <span>{selectedConv.kbVersionName || "—"}</span></div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedConv.status === "HANDOFF" && (
                  <button onClick={() => { takeoverMutation.mutate(selectedConv.id); setDetailOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    <UserCheck size={13} />Tiếp quản
                  </button>
                )}
                {selectedConv.status !== "CLOSED" && (
                  <button onClick={() => closeMutation.mutate(selectedConv.id)}
                    className="flex items-center gap-2 px-3 py-2 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600">
                    <X size={13} />Đóng hội thoại
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {msgQuery.isLoading ? (
                  <div className="text-center py-6 text-zinc-400 text-sm">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-sm">Không có tin nhắn</div>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                        {msg.role === "USER" ? <User size={13} className="text-zinc-600" /> : <Bot size={13} className="text-white" />}
                      </div>
                      <div className="flex-1 max-w-[80%]">
                        <div className="rounded-xl px-3 py-2.5 text-sm">
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {msg.intent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded">
                              {msg.intent}
                            </span>
                          )}
                          {msg.flagStatus && msg.flagStatus !== "NONE" && (
                            <span className="text-[10px] font-medium">
                              🚩 {msg.flagStatus}
                            </span>
                          )}
                          {/* Flag actions for assistant messages */}
                          {msg.role === "ASSISTANT" && (
                            <div className="flex gap-1 ml-1">
                              <button onClick={() => flagMutation.mutate({ id: msg.id, flag: "NEEDS_REVIEW", note: "Cần xem xét" })}
                                title="Gắn cờ cần xem xét" className="text-[10px] text-amber-500 hover:text-amber-600">🚩</button>
                              {msg.flagStatus === "NEEDS_REVIEW" && (
                                <>
                                  <button onClick={() => flagMutation.mutate({ id: msg.id, flag: "APPROVED" })} title="Duyệt" className="text-[10px] text-emerald-500 hover:text-emerald-600">✓</button>
                                  <button onClick={() => flagMutation.mutate({ id: msg.id, flag: "REJECTED" })} title="Từ chối" className="text-[10px] text-red-500 hover:text-red-600">✗</button>
                                </>
                              )}
                            </div>
                          )}
                          <span className="text-[10px] text-zinc-400">{new Date(msg.createdAt).toLocaleTimeString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
