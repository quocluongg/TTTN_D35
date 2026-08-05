"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminWarrantyService } from "@/services/admin/adminWarrantyService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";
import { ShieldCheck, Plus, Clock, FileText, User } from "lucide-react";

type WarrantyRow = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function AdminWarrantiesPage() {
  const queryClient = useQueryClient();
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for creating a new warranty card
  const [serialNumber, setSerialNumber] = useState("");
  const [orderItemId, setOrderItemId] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState(12);

  // Form states for adding repair history
  const [historyNotes, setHistoryNotes] = useState("");
  const [historyStatus, setHistoryStatus] = useState("RECEIVING");

  // Fetch single warranty card details
  const warrantyDetailQuery = useQuery({
    queryKey: ["admin-warranty-detail", selectedWarrantyId],
    queryFn: () => adminWarrantyService.get(selectedWarrantyId!),
    enabled: !!selectedWarrantyId,
  });

  const warranty: any = unwrap(warrantyDetailQuery.data) || {};

  // Create Warranty Card Mutation
  const createWarrantyMutation = useMutation({
    mutationFn: (data: any) => adminWarrantyService.create(data),
    onSuccess: () => {
      notifySuccess("Tạo thẻ bảo hành thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-warranties"] });
      setCreateModalOpen(false);
      setSerialNumber("");
      setOrderItemId("");
      setWarrantyMonths(12);
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể tạo thẻ bảo hành.");
    },
  });

  // Add repair history mutation
  const addHistoryMutation = useMutation({
    mutationFn: (data: any) => adminWarrantyService.addHistory(selectedWarrantyId!, data),
    onSuccess: () => {
      notifySuccess("Thêm lịch sử bảo hành thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-warranty-detail", selectedWarrantyId] });
      setHistoryNotes("");
      setHistoryStatus("RECEIVING");
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể thêm lịch sử.");
    },
  });

  // Update overall warranty status
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => adminWarrantyService.status(selectedWarrantyId!, { status }),
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái bảo hành thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-warranties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-warranty-detail", selectedWarrantyId] });
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật trạng thái.");
    },
  });

  const handleOpenDetail = (row: WarrantyRow) => {
    setSelectedWarrantyId(row.id);
    setDetailModalOpen(true);
  };

  const handleCreateWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    createWarrantyMutation.mutate({ serialNumber, orderItemId, warrantyMonths });
  };

  const handleAddHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyNotes.trim()) return;
    addHistoryMutation.mutate({ note: historyNotes, status: historyStatus });
  };

  const customActions = (row: WarrantyRow) => (
    <button
      onClick={() => handleOpenDetail(row)}
      className="border border-black px-2 py-1 text-xs hover:bg-zinc-100 flex items-center gap-1 font-semibold"
    >
      <Clock size={12} /> Lịch sử & Sửa
    </button>
  );

  return (
    <div className="space-y-6">
      <ResourcePage
        title="Quản lý Bảo hành"
        description="Kiểm tra thời hạn bảo hành của thiết bị theo số Serial, kích hoạt thẻ mới và lưu trữ nhật ký sửa chữa."
        queryKey="admin-warranties"
        fetcher={adminWarrantyService.list}
        fields={[
          { key: "serialNumber", label: "Số Serial" },
          { key: "productName", label: "Sản phẩm" },
          { key: "customerName", label: "Khách hàng" },
          { key: "expiryDate", label: "Ngày hết hạn" },
          { key: "status", label: "Trạng thái thẻ" },
        ]}
        onCreate={() => setCreateModalOpen(true)}
        customActions={customActions}
      />

      {/* Create Warranty Modal */}
      {createModalOpen && (
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-md border-2 border-black bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span>Kích hoạt Thẻ Bảo hành mới</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateWarranty} className="mt-4 space-y-4 text-sm">
              <label className="block font-semibold">
                Số Serial sản phẩm <span className="text-red-500">*</span>
                <input
                  required
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="Ví dụ: SN-92934-ASUS"
                />
              </label>

              <label className="block font-semibold">
                Mã dòng đơn hàng (OrderItem ID) <span className="text-red-500">*</span>
                <input
                  required
                  type="text"
                  value={orderItemId}
                  onChange={(e) => setOrderItemId(e.target.value)}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                  placeholder="UUID của sản phẩm trong đơn mua"
                />
              </label>

              <label className="block font-semibold">
                Thời hạn bảo hành (Tháng)
                <input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                />
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="border border-black px-4 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createWarrantyMutation.isPending}
                  className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createWarrantyMutation.isPending ? "Đang xử lý..." : "Kích hoạt"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Warranty Details & Repair History Modal */}
      {detailModalOpen && selectedWarrantyId && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-3xl border-2 border-black bg-white p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b border-black pb-3">
                <ShieldCheck className="w-5 h-5 text-lime-600" />
                <span>Chi tiết Thẻ Bảo hành & Lịch sử bảo hành</span>
              </DialogTitle>
            </DialogHeader>

            {warrantyDetailQuery.isLoading ? (
              <p className="text-sm text-zinc-500 py-10 text-center">Đang tải lịch sử thẻ bảo hành...</p>
            ) : (
              <div className="mt-4 space-y-6 text-sm">
                {/* Warranty Summary Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 p-4 border border-black/10">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">SERIAL NUMBER</span>
                    <strong className="font-mono">{warranty.serialNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">SẢN PHẨM</span>
                    <strong>{warranty.productName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">KHÁCH HÀNG</span>
                    <strong>{warranty.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">HẠN BẢO HÀNH</span>
                    <strong>
                      {warranty.expiryDate
                        ? new Date(warranty.expiryDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </strong>
                  </div>
                </div>

                {/* Status Update */}
                <div className="border border-black p-4 space-y-2 bg-zinc-50">
                  <h4 className="font-bold uppercase tracking-wider text-xs">Cập nhật trạng thái bảo hành</h4>
                  <div className="flex flex-wrap gap-2">
                    {["ACTIVE", "EXPIRED", "UNDER_REPAIR", "DONE"].map((st) => (
                      <button
                        key={st}
                        onClick={() => updateStatusMutation.mutate(st)}
                        disabled={warranty.status === st || updateStatusMutation.isPending}
                        className={`px-3 py-1 text-xs font-bold border transition-colors ${
                          warranty.status === st
                            ? "bg-black text-white border-black"
                            : "border-black bg-white text-black hover:bg-zinc-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Repair History log */}
                <form onSubmit={handleAddHistory} className="border border-black p-4 space-y-3 bg-white">
                  <h4 className="font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Ghi nhận dịch vụ / Sửa chữa mới
                  </h4>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        required
                        type="text"
                        placeholder="Mô tả lỗi, linh kiện thay thế, dịch vụ thực hiện..."
                        value={historyNotes}
                        onChange={(e) => setHistoryNotes(e.target.value)}
                        className="w-full border border-black px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <select
                        value={historyStatus}
                        onChange={(e) => setHistoryStatus(e.target.value)}
                        className="w-full border border-black px-3 py-2 text-xs bg-white"
                      >
                        <option value="RECEIVING">RECEIVING (Nhận máy)</option>
                        <option value="REPAIRING">REPAIRING (Đang sửa)</option>
                        <option value="TESTING">TESTING (Kiểm tra lại)</option>
                        <option value="RETURNED">RETURNED (Đã trả khách)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addHistoryMutation.isPending}
                      className="bg-black text-white px-4 py-1.5 text-xs font-bold hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {addHistoryMutation.isPending ? "Đang ghi nhận..." : "Ghi nhận dịch vụ"}
                    </button>
                  </div>
                </form>

                {/* Histories List Log */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Nhật ký sửa chữa dịch vụ ({warranty.histories?.length || 0})
                  </h4>

                  {warranty.histories && warranty.histories.length > 0 ? (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto border border-black/10 p-3 bg-zinc-50/50">
                      {warranty.histories.map((h: any, i: number) => (
                        <div key={h.id || i} className="border border-black/10 bg-white p-3 space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-200">
                              {h.status}
                            </span>
                            <span className="text-zinc-500">
                              {h.createdAt ? new Date(h.createdAt).toLocaleString("vi-VN") : ""}
                            </span>
                          </div>
                          <p className="text-black font-medium">"{h.note}"</p>
                          <p className="text-[10px] text-zinc-400 text-right">Thực hiện bởi: {h.createdBy || "Nhân viên KT"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 italic text-xs">Chưa có lịch sử tiếp nhận dịch vụ nào cho thiết bị này.</p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="border border-black bg-black text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
