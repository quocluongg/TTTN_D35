"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { notifyError, notifySuccess } from "@/components/Notify";
import { LayoutTemplate, Plus, Trash2, Edit3, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

export default function CmsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"banners" | "brands" | "featured">("banners");

  // State for Create/Edit Modal
  const [modalType, setModalType] = useState<"banner" | "brand" | "featured" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Queries
  const bannersQuery = useQuery({
    queryKey: ["cms-banners"],
    queryFn: () => adminApi.home.banners.list(),
  });

  const brandsQuery = useQuery({
    queryKey: ["cms-brands"],
    queryFn: () => adminApi.home.brands.list(),
  });

  const featuredQuery = useQuery({
    queryKey: ["cms-featured"],
    queryFn: () => adminApi.home.featuredCategories.list(),
  });

  const banners = unwrap(bannersQuery.data) || [];
  const brands = unwrap(brandsQuery.data) || [];
  const featured = unwrap(featuredQuery.data) || [];

  // Mutations
  const saveBannerMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? adminApi.home.banners.update(data.id, data) : adminApi.home.banners.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Banner thành công!");
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      closeModal();
    },
    onError: (err: any) => notifyError(err?.message || "Không thể lưu Banner."),
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => adminApi.home.banners.delete(id),
    onSuccess: () => {
      notifySuccess("Đã xóa Banner!");
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
    },
  });

  const saveBrandMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? adminApi.home.brands.update(data.id, data) : adminApi.home.brands.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Thương hiệu!");
      queryClient.invalidateQueries({ queryKey: ["cms-brands"] });
      closeModal();
    },
    onError: (err: any) => notifyError(err?.message || "Không thể lưu Thương hiệu."),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => adminApi.home.brands.delete(id),
    onSuccess: () => {
      notifySuccess("Đã xóa Thương hiệu!");
      queryClient.invalidateQueries({ queryKey: ["cms-brands"] });
    },
  });

  const saveFeaturedMutation = useMutation({
    mutationFn: (data: any) =>
      data.id
        ? adminApi.home.featuredCategories.update(data.id, data)
        : adminApi.home.featuredCategories.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Danh mục nổi bật!");
      queryClient.invalidateQueries({ queryKey: ["cms-featured"] });
      closeModal();
    },
    onError: (err: any) => notifyError(err?.message || "Không thể lưu Danh mục nổi bật."),
  });

  const deleteFeaturedMutation = useMutation({
    mutationFn: (id: string) => adminApi.home.featuredCategories.delete(id),
    onSuccess: () => {
      notifySuccess("Đã xóa Danh mục nổi bật!");
      queryClient.invalidateQueries({ queryKey: ["cms-featured"] });
    },
  });

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setFormData({});
  };

  const openCreateModal = (type: "banner" | "brand" | "featured") => {
    setModalType(type);
    setEditingItem(null);
    setFormData({ displayOrder: 0, isActive: true });
  };

  const openEditModal = (type: "banner" | "brand" | "featured", item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({ ...item });
  };

  // Columns Configuration
  const bannerColumns: Column<any>[] = [
    {
      key: "preview",
      header: "Hình ảnh",
      cell: (row) => (
        <div className="w-24 h-12 border border-black bg-zinc-100 flex items-center justify-center overflow-hidden">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={18} className="text-zinc-400" />
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "Tiêu đề & Link",
      cell: (row) => (
        <div>
          <p className="font-medium text-black">{row.title || "—"}</p>
          {row.subtitle && <p className="text-xs text-zinc-500">{row.subtitle}</p>}
          {row.linkUrl && (
            <a
              href={row.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-600 underline flex items-center gap-1 mt-0.5"
            >
              <LinkIcon size={12} /> {row.linkUrl}
            </a>
          )}
        </div>
      ),
    },
    {
      key: "displayOrder",
      header: "Thứ tự",
      cell: (row) => <span className="font-mono text-xs">{row.displayOrder ?? 0}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal("banner", row)} className="p-1 border border-black hover:bg-zinc-100">
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => deleteBannerMutation.mutate(row.id)}
            className="p-1 border border-red-600 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const brandColumns: Column<any>[] = [
    {
      key: "logo",
      header: "Logo",
      cell: (row) => (
        <div className="w-16 h-10 border border-black bg-zinc-100 flex items-center justify-center overflow-hidden p-1">
          {row.logoUrl ? (
            <img src={row.logoUrl} alt={row.name} className="w-full h-full object-contain" />
          ) : (
            <ImageIcon size={16} className="text-zinc-400" />
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Tên thương hiệu",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "displayOrder",
      header: "Thứ tự",
      cell: (row) => <span className="font-mono text-xs">{row.displayOrder ?? 0}</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal("brand", row)} className="p-1 border border-black hover:bg-zinc-100">
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => deleteBrandMutation.mutate(row.id)}
            className="p-1 border border-red-600 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const featuredColumns: Column<any>[] = [
    {
      key: "title",
      header: "Tên Section",
      cell: (row) => <span className="font-medium text-black">{row.title}</span>,
    },
    {
      key: "displayOrder",
      header: "Thứ tự",
      cell: (row) => <span className="font-mono text-xs">{row.displayOrder ?? 0}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal("featured", row)} className="p-1 border border-black hover:bg-zinc-100">
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => deleteFeaturedMutation.mutate(row.id)}
            className="p-1 border border-red-600 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black pb-5">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight">Homepage CMS</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quản lý Banners slider, Logo thương hiệu đối tác và Danh mục sản phẩm ghim nổi bật.
          </p>
        </div>

        <button
          onClick={() =>
            openCreateModal(activeTab === "banners" ? "banner" : activeTab === "brands" ? "brand" : "featured")
          }
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium rounded-none hover:bg-zinc-800"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black">
        {[
          ["banners", "Banners Slider"],
          ["brands", "Thương hiệu nổi bật"],
          ["featured", "Danh mục ghim trang chủ"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-5 py-3 text-sm font-medium border-r border-black transition-colors ${
              activeTab === key ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "banners" && (
        <DataTable
          columns={bannerColumns}
          rows={Array.isArray(banners) ? banners : banners.content || []}
          loading={bannersQuery.isLoading}
          rowKey={(r) => r.id}
          empty="Chưa có Banner nào."
        />
      )}

      {activeTab === "brands" && (
        <DataTable
          columns={brandColumns}
          rows={Array.isArray(brands) ? brands : brands.content || []}
          loading={brandsQuery.isLoading}
          rowKey={(r) => r.id}
          empty="Chưa có Thương hiệu nào."
        />
      )}

      {activeTab === "featured" && (
        <DataTable
          columns={featuredColumns}
          rows={Array.isArray(featured) ? featured : featured.content || []}
          loading={featuredQuery.isLoading}
          rowKey={(r) => r.id}
          empty="Chưa có Danh mục ghim nào."
        />
      )}

      {/* Modal Form */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (modalType === "banner") saveBannerMutation.mutate(formData);
              if (modalType === "brand") saveBrandMutation.mutate(formData);
              if (modalType === "featured") saveFeaturedMutation.mutate(formData);
            }}
            className="w-full max-w-lg border border-black bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-xl font-medium">
                {editingItem ? "Cập nhật" : "Thêm mới"}{" "}
                {modalType === "banner" ? "Banner" : modalType === "brand" ? "Thương hiệu" : "Section Nổi Bật"}
              </h3>
              <button type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {modalType === "banner" && (
                <>
                  <label className="block text-sm font-medium">
                    Tiêu đề
                    <input
                      required
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    URL Hình ảnh
                    <input
                      required
                      type="text"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Liên kết (Link URL)
                    <input
                      type="text"
                      value={formData.linkUrl || ""}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}

              {modalType === "brand" && (
                <>
                  <label className="block text-sm font-medium">
                    Tên thương hiệu
                    <input
                      required
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    URL Logo
                    <input
                      required
                      type="text"
                      value={formData.logoUrl || ""}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}

              {modalType === "featured" && (
                <label className="block text-sm font-medium">
                  Tiêu đề Section
                  <input
                    required
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium">
                  Thứ tự hiển thị
                  <input
                    type="number"
                    value={formData.displayOrder ?? 0}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                  />
                </label>

                {modalType !== "brand" && (
                  <label className="flex items-center gap-2 text-sm font-medium pt-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? true}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="accent-black"
                    />
                    Hiển thị công khai
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-black">
              <button type="button" onClick={closeModal} className="border border-black px-4 py-2 text-sm">
                Hủy
              </button>
              <button className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
