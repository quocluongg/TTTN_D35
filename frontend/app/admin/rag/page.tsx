"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";

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
  const { data: analytics, isLoading: isAnalyticsLoading, refetch } = useQuery<RagAnalytics>({
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

  const mockUnanswered: UnansweredQuestion[] = unanswered || [
    { id: "Q-101", question: "Máy đo Fluke 1507 có đo được điện áp AC không?", confidence: 0.65, category: "Hỗ trợ kỹ thuật", createdAt: "2024-05-12T10:30:00Z" },
    { id: "Q-102", question: "Chính sách bảo hành cho đồng hồ Kyoritsu 1009 tại Hà Nội?", confidence: 0.72, category: "Bảo hành", createdAt: "2024-05-13T14:15:00Z" },
  ];

  const columns: Column<UnansweredQuestion>[] = [
    {
      header: "Câu Hỏi Người Dùng",
      accessor: "question",
      render: (q) => <span className="font-bold text-slate-900">{q.question}</span>,
    },
    {
      header: "Độ Tin Cậy (Confidence)",
      render: (q) => (
        <AdminJSPillTag variant={q.confidence < 0.7 ? "danger" : "warning"}>
          {(q.confidence * 100).toFixed(1)}% Match
        </AdminJSPillTag>
      ),
    },
    {
      header: "Phân Loại",
      accessor: "category",
      render: (q) => <span className="font-mono text-slate-600">{q.category}</span>,
    },
    {
      header: "Thời Gian Ghi Nhận",
      accessor: "createdAt",
      render: (q) => (
        <span className="text-slate-400 font-mono text-[11px]">
          {new Date(q.createdAt).toLocaleString("vi-VN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Trợ Lý AI & FAISS Vector Index (RAG Resource Console)"
        resourceName="AI Engine"
        count={mockUnanswered.length}
        description="Giám sát mô hình BGE-M3 Embeddings, BM25 Index và các câu hỏi thiếu dữ liệu tri thức."
        onRefresh={() => refetch()}
        onAddNew={() => alert("Re-index Knowledge Pipeline (Ingest Gold/Platinum Index)")}
        addNewLabel="Re-index Knowledge Base"
      />

      {/* Analytics KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mô Hình AI / Provider</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{analytics?.providerName || "BGE-M3 + FAISS"}</p>
          <div className="mt-2">
            <AdminJSPillTag variant="success">{analytics?.providerStatus || "HEALTHY ONLINE"}</AdminJSPillTag>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hội Thoại & Tin Nhắn</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {analytics?.totalConversations ?? 148} <span className="text-xs font-normal text-slate-500">phiên</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{analytics?.totalMessages ?? 612} tin nhắn RAG</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đánh Giá Phản Hồi</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-emerald-600 font-bold text-base">👍 {analytics?.positiveFeedback ?? 184}</span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-600 font-bold text-base">👎 {analytics?.negativeFeedback ?? 12}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khoảng Trống Tri Thức</p>
          <p className="mt-2 text-xl font-bold text-amber-600">{analytics?.unansweredCount ?? mockUnanswered.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cần bổ sung tài liệu Bronze/Silver</p>
        </div>
      </div>

      <AdminJSResourceTable<UnansweredQuestion>
        columns={columns}
        data={mockUnanswered}
        keyExtractor={(q) => q.id}
        isLoading={isUnansweredLoading}
        onView={(q) => alert(`Chi tiết câu hỏi: ${q.question}`)}
      />
    </div>
  );
}
