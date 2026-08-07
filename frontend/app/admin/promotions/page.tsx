"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ResourcePage from "@/components/admin/ResourcePage";
import { adminCampaignService } from "@/services/admin/adminCampaignService";
import { adminVoucherService } from "@/services/admin/adminVoucherService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyError, notifySuccess } from "@/components/Notify";

type Row = Record<string, any>;

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"campaigns" | "vouchers">("campaigns");

  // Common Modal / UI States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);

  // --- Campaign Form States ---
  const [campaignName, setCampaignName] = useState("");
  const [campaignSlug, setCampaignSlug] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- Voucher Form States ---
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState("PERCENTAGE");
  const [voucherValue, setVoucherValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(100);
  const [voucherStartDate, setVoucherStartDate] = useState("");
  const [voucherEndDate, setVoucherEndDate] = useState("");

  const resetForms = () => {
    setCampaignName("");
    setCampaignSlug("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(10);
    setStartDate("");
    setEndDate("");

    setVoucherCode("");
    setVoucherType("PERCENTAGE");
    setVoucherValue(10);
    setMinOrderValue(0);
    setMaxDiscountAmount(0);
    setUsageLimit(100);
    setVoucherStartDate("");
    setVoucherEndDate("");

    setEditingRow(null);
  };

  // --- Campaigns Mutations ---
  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => adminCampaignService.create(data),
    onSuccess: () => {
      notifySuccess("Tạo chiến dịch khuyến mãi thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể tạo chiến dịch.");
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminCampaignService.update(id, data),
    onSuccess: () => {
      notifySuccess("Cập nhật chiến dịch thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật chiến dịch.");
    },
  });

  const toggleCampaignStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminCampaignService.status(id, { active }),
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái chiến dịch thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật trạng thái.");
    },
  });

  // --- Vouchers Mutations ---
  const createVoucherMutation = useMutation({
    mutationFn: (data: any) => adminVoucherService.create(data),
    onSuccess: () => {
      notifySuccess("Tạo mã Voucher thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      setModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể tạo mã giảm giá.");
    },
  });

  const updateVoucherMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminVoucherService.update(id, data),
    onSuccess: () => {
      notifySuccess("Cập nhật Voucher thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      setModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật mã giảm giá.");
    },
  });

  const toggleVoucherStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminVoucherService.status(id, { active }),
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái Voucher thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || "Không thể cập nhật trạng thái.");
    },
  });

  const handleOpenCreate = () => {
    resetForms();
    setModalOpen(true);
  };

  const handleOpenEdit = (row: Row) => {
    setEditingRow(row);
    if (tab === "campaigns") {
      setCampaignName(row.name || "");
      setCampaignSlug(row.slug || "");
      setDiscountType(row.discountType || "PERCENTAGE");
      setDiscountValue(row.discountValue || 10);
      setStartDate(row.startDate ? row.startDate.substring(0, 16) : "");
      setEndDate(row.endDate ? row.endDate.substring(0, 16) : "");
    } else {
      setVoucherCode(row.code || "");
      setVoucherType(row.type || "PERCENTAGE");
      setVoucherValue(row.value || 10);
      setMinOrderValue(row.minOrderValue || 0);
      setMaxDiscountAmount(row.maxDiscountAmount || 0);
      setUsageLimit(row.usageLimit || 100);
      setVoucherStartDate(row.startDate ? row.startDate.substring(0, 16) : "");
      setVoucherEndDate(row.endDate ? row.endDate.substring(0, 16) : "");
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "campaigns") {
      const payload = {
        name: campaignName,
        slug: campaignSlug || undefined,
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };

      if (editingRow) {
        updateCampaignMutation.mutate({ id: editingRow.id, data: payload });
      } else {
        createCampaignMutation.mutate(payload);
      }
    } else {
      const payload = {
        code: voucherCode,
        type: voucherType,
        value: voucherValue,
        minOrderValue,
        maxDiscountAmount,
        usageLimit,
        startDate: voucherStartDate ? new Date(voucherStartDate).toISOString() : undefined,
        endDate: voucherEndDate ? new Date(voucherEndDate).toISOString() : undefined,
      };

      if (editingRow) {
        updateVoucherMutation.mutate({ id: editingRow.id, data: payload });
      } else {
        createVoucherMutation.mutate(payload);
      }
    }
  };

  const customCampaignActions = (row: Row) => {
    const isItemActive = row.isActive !== false && row.active !== false;
    return (
      <button
        onClick={() =>
          toggleCampaignStatusMutation.mutate({
            id: row.id,
            active: !isItemActive,
          })
        }
        className={`border px-2 py-1 text-xs font-semibold ${
          isItemActive
            ? "border-amber-600 text-amber-600 hover:bg-amber-50"
            : "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {isItemActive ? "Tạm ngưng" : "Kích hoạt"}
      </button>
    );
  };

  const customVoucherActions = (row: Row) => {
    const isItemActive = row.isActive !== false && row.active !== false;
    return (
      <button
        onClick={() =>
          toggleVoucherStatusMutation.mutate({
            id: row.id,
            active: !isItemActive,
          })
        }
        className={`border px-2 py-1 text-xs font-semibold ${
          isItemActive
            ? "border-amber-600 text-amber-600 hover:bg-amber-50"
            : "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {isItemActive ? "Vô hiệu" : "Kích hoạt"}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border border-black max-w-fit bg-white">
        <button
          onClick={() => {
            setTab("campaigns");
            resetForms();
          }}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === "campaigns" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
        >
          Chiến dịch khuyến mãi (Campaigns)
        </button>
        <button
          onClick={() => {
            setTab("vouchers");
            resetForms();
          }}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-l border-black ${
            tab === "vouchers" ? "bg-black text-white" : "hover:bg-zinc-100 text-black"
          }`}
        >
          Mã giảm giá (Vouchers)
        </button>
      </div>

      {tab === "campaigns" ? (
        <ResourcePage
          title="Chiến dịch khuyến mãi"
          description="Quản lý các chương trình Flash Sale, chiến dịch sale giảm giá theo danh mục sản phẩm thời gian thực."
          queryKey="admin-campaigns"
          fetcher={adminCampaignService.list}
          fields={[
            { key: "name", label: "Tên chiến dịch" },
            { key: "discountType", label: "Kiểu giảm" },
            { key: "discountValue", label: "Giá trị" },
            { key: "startDate", label: "Bắt đầu" },
            { key: "endDate", label: "Kết thúc" },
            { key: "status", label: "Trạng thái" },
          ]}
          onCreate={handleOpenCreate}
          onEdit={handleOpenEdit}
          customActions={customCampaignActions}
        />
      ) : (
        <ResourcePage
          title="Mã giảm giá (Voucher)"
          description="Thiết lập các mã voucher giảm giá cá nhân, voucher cho khách hàng nhập tay tại giỏ hàng."
          queryKey="admin-vouchers"
          fetcher={adminVoucherService.list}
          fields={[
            { key: "code", label: "Mã Code" },
            { key: "type", label: "Loại giảm" },
            { key: "value", label: "Giá trị" },
            { key: "minOrderValue", label: "Đơn tối thiểu" },
            { key: "usageLimit", label: "Giới hạn lượt dùng" },
            { key: "status", label: "Trạng thái" },
          ]}
          onCreate={handleOpenCreate}
          onEdit={handleOpenEdit}
          customActions={customVoucherActions}
        />
      )}

      {/* CRUD Promotions Modal */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
          <DialogContent className="max-w-md border-2 border-black bg-white p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase tracking-wider border-b border-black pb-3">
                {editingRow
                  ? tab === "campaigns"
                    ? "Sửa chiến dịch"
                    : "Sửa Voucher"
                  : tab === "campaigns"
                  ? "Tạo chiến dịch mới"
                  : "Tạo Voucher mới"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm text-black">
              {tab === "campaigns" ? (
                <>
                  {/* Campaign Fields */}
                  <label className="block font-semibold">
                    Tên chiến dịch <span className="text-red-500">*</span>
                    <input
                      required
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      placeholder="Ví dụ: Mega Sale 8.8"
                    />
                  </label>

                  <label className="block font-semibold">
                    Slug nhận diện
                    <input
                      type="text"
                      value={campaignSlug}
                      onChange={(e) => setCampaignSlug(e.target.value)}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      placeholder="mega-sale-8-8"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block font-semibold">
                      Kiểu giảm giá
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      >
                        <option value="PERCENTAGE">PERCENTAGE (%)</option>
                        <option value="FIXED_AMOUNT">FIXED_AMOUNT (₫)</option>
                      </select>
                    </label>

                    <label className="block font-semibold">
                      Giá trị giảm <span className="text-red-500">*</span>
                      <input
                        required
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block font-semibold">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                      <input
                        required
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>

                    <label className="block font-semibold">
                      Ngày kết thúc <span className="text-red-500">*</span>
                      <input
                        required
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {/* Voucher Fields */}
                  <label className="block font-semibold">
                    Mã Voucher Code <span className="text-red-500">*</span>
                    <input
                      required
                      type="text"
                      disabled={!!editingRow}
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white uppercase disabled:opacity-50"
                      placeholder="Ví dụ: SALE50K"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block font-semibold">
                      Loại Voucher
                      <select
                        value={voucherType}
                        onChange={(e) => setVoucherType(e.target.value)}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      >
                        <option value="PERCENTAGE">PERCENTAGE (%)</option>
                        <option value="FIXED_AMOUNT">FIXED_AMOUNT (₫)</option>
                      </select>
                    </label>

                    <label className="block font-semibold">
                      Giá trị giảm <span className="text-red-500">*</span>
                      <input
                        required
                        type="number"
                        value={voucherValue}
                        onChange={(e) => setVoucherValue(Number(e.target.value))}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block font-semibold">
                      Đơn tối thiểu (₫)
                      <input
                        type="number"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(Number(e.target.value))}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>

                    <label className="block font-semibold">
                      Lượt sử dụng tối đa
                      <input
                        type="number"
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(Number(e.target.value))}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block font-semibold">
                      Ngày bắt đầu
                      <input
                        type="datetime-local"
                        value={voucherStartDate}
                        onChange={(e) => setVoucherStartDate(e.target.value)}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>

                    <label className="block font-semibold">
                      Ngày kết thúc
                      <input
                        type="datetime-local"
                        value={voucherEndDate}
                        onChange={(e) => setVoucherEndDate(e.target.value)}
                        className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                      />
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-black px-4 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    createCampaignMutation.isPending ||
                    updateCampaignMutation.isPending ||
                    createVoucherMutation.isPending ||
                    updateVoucherMutation.isPending
                  }
                  className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
