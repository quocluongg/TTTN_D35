"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";

type RagAnalytics = {
  totalConversations: number;
  totalMessages: number;
  positiveFeedback: number;
  negativeFeedback: number;
  unansweredCount: number;
  providerName: string;
  providerStatus: string;
  providerDetails: string;
};

type UnansweredQuestion = {
  id: string;
  question: string;
  confidence: number;
  category: string;
  createdAt: string;
};

export default function AdminRagPage() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<RagAnalytics>({
    queryKey: ["admin-rag-analytics"],
    queryFn: async () => {
      const res = await http.get("/admin/rag/analytics");
      return (res as any).data;
    },
  });

  const { data: unanswered, isLoading: isUnansweredLoading } = useQuery<UnansweredQuestion[]>({
    queryKey: ["admin-rag-unanswered"],
    queryFn: async () => {
      const res = await http.get("/admin/rag/unanswered");
      return (res as any).data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản trị Trợ lý AI (RAG Chatbot)</h1>
        <p className="text-sm text-slate-500">
          Giám sát trạng thái Trợ lý AI, thống kê phản hồi người dùng và rà soát danh sách câu hỏi chưa trả lời đủ độ tin cậy.
        </p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Provider Active</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{analytics?.providerName || "MockRagProvider"}</p>
          <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
            {analytics?.providerStatus || "HEALTHY"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Phiên & Tin nhắn</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {analytics?.totalConversations ?? 0} <span className="text-sm text-slate-500 font-normal">hội thoại</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">{analytics?.totalMessages ?? 0} tin nhắn trao đổi</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Phản hồi Thumbs Up / Down</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-emerald-600 font-bold text-lg">👍 {analytics?.positiveFeedback ?? 0}</span>
            <span className="text-slate-300">|</span>
            <span className="text-red-600 font-bold text-lg">👎 {analytics?.negativeFeedback ?? 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Câu hỏi Low-Confidence</p>
          <p className="mt-2 text-xl font-bold text-amber-600">{analytics?.unansweredCount ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Độ tin cậy &lt; 80% cần học thêm</p>
        </div>
      </div>

      {/* Unanswered Questions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">Danh sách câu hỏi cần nạp kiến thức mới (Knowledge Gap)</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Câu hỏi người dùng</th>
              <th className="px-6 py-3">Độ tin cậy (Confidence)</th>
              <th className="px-6 py-3">Phân loại</th>
              <th className="px-6 py-3">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isUnansweredLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Đang tải...</td></tr>
            ) : unanswered?.length ? (
              unanswered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.question}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">{item.category}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Chưa có câu hỏi thiếu dữ liệu RAG.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
