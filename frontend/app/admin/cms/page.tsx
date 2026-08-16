"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { notifyError, notifySuccess } from "@/components/Notify";
import { LayoutTemplate, Plus, Trash2, Edit3, Image as ImageIcon, Link as LinkIcon, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { HomeLayoutSection } from "@/types/home";

const unwrap = (x: any) => x?.data ?? x;

export default function CmsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"layout" | "banners" | "brands" | "featured">("layout");

  // State for Create/Edit Modal
  const [modalType, setModalType] = useState<"layout" | "banner" | "brand" | "featured" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Queries
  const layoutQuery = useQuery({
    queryKey: ["cms-layout"],
    queryFn: () => adminApi.home.layout.list(),
  });

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

  const layoutSections: HomeLayoutSection[] = unwrap(layoutQuery.data) || [];
  const banners = unwrap(bannersQuery.data) || [];
  const brands = unwrap(brandsQuery.data) || [];
  const featured = unwrap(featuredQuery.data) || [];

  // Mutations
  const saveLayoutMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? adminApi.home.layout.update(data.id, data) : adminApi.home.layout.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Cấu hình Layout!");
      queryClient.invalidateQueries({ queryKey: ["cms-layout"] });
      closeModal();
    },
    onError: (err: any) => notifyError(err?.message || "Không thể lưu Cấu hình Layout."),
  });

  const deleteLayoutMutation = useMutation({
    mutationFn: (id: string) => adminApi.home.layout.delete(id),
    onSuccess: () => {
      notifySuccess("Đã xóa Section khỏi Layout!");
      queryClient.invalidateQueries({ queryKey: ["cms-layout"] });
    },
  });

  const reorderLayoutMutation = useMutation({
    mutationFn: (items: { id: string; displayOrder: number }[]) => adminApi.home.layout.reorder(items),
    onSuccess: () => {
      notifySuccess("Đã cập nhật thứ tự Layout!");
      queryClient.invalidateQueries({ queryKey: ["cms-layout"] });
    },
    onError: (err: any) => notifyError(err?.message || "Không thể đổi thứ tự."),
  });

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

  const openCreateModal = (type: "layout" | "banner" | "brand" | "featured") => {
    setModalType(type);
    setEditingItem(null);
    setFormData({ displayOrder: (layoutSections.length || 0) + 1, enabled: true, isActive: true });
  };

  const openEditModal = (type: "layout" | "banner" | "brand" | "featured", item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({ ...item });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const list = [...layoutSections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reorderedPayload = list.map((item, idx) => ({
      id: item.id,
      displayOrder: idx + 1,
    }));

    reorderLayoutMutation.mutate(reorderedPayload);
  };

  const handleToggleSectionEnabled = (section: HomeLayoutSection) => {
    saveLayoutMutation.mutate({
      ...section,
      enabled: !section.enabled,
    });
  };

  // Columns Configuration
  const layoutColumns: Column<HomeLayoutSection>[] = [
    {
      key: "displayOrder",
      header: "Thứ tự",
      cell: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-1 bg-zinc-100 border border-black">
          #{row.displayOrder}
        </span>
      ),
    },
    {
      key: "sectionKey",
      header: "Mã Block (Section Key)",
      cell: (row) => (
        <div>
          <span className="px-2 py-0.5 bg-black text-white text-[11px] font-mono font-bold">
            {row.sectionKey}
          </span>
          {row.layoutStyle && (
            <span className="ml-2 text-xs text-zinc-500 font-mono">[{row.layoutStyle}]</span>
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "Tiêu đề & Mô tả",
      cell: (row) => (
        <div>
          <p className="font-bold text-black">{row.title || "—"}</p>
          {row.subtitle && <p className="text-xs text-zinc-500">{row.subtitle}</p>}
        </div>
      ),
    },
    {
      key: "enabled",
      header: "Hiển thị",
      cell: (row) => (
        <button
          onClick={() => handleToggleSectionEnabled(row)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase transition-colors cursor-pointer border border-black ${
            row.enabled ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-500 opacity-60"
          }`}
        >
          {row.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
          {row.enabled ? "BẬT" : "TẮT"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Thao tác & Sắp xếp",
      cell: (row: HomeLayoutSection) => {
        const idx = layoutSections.findIndex((item) => item.id === row.id);
        return (
          <div className="flex items-center gap-2">
            <button
              disabled={idx <= 0}
              onClick={() => handleMoveSection(idx, "up")}
              title="Lên trên"
              className="p-1 border border-black hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowUp size={14} />
            </button>
            <button
              disabled={idx < 0 || idx >= layoutSections.length - 1}
              onClick={() => handleMoveSection(idx, "down")}
              title="Xuống dưới"
              className="p-1 border border-black hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowDown size={14} />
            </button>
            <button onClick={() => openEditModal("layout", row)} className="p-1 border border-black hover:bg-zinc-100">
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => deleteLayoutMutation.mutate(row.id)}
              className="p-1 border border-red-600 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ];

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
            Cấu hình thứ tự hiển thị bố cục trang chủ, Banners slider, Thương hiệu đối tác và Danh mục nổi bật.
          </p>
        </div>

        <button
          onClick={() => {
            const targetType =
              activeTab === "banners" ? "banner" : activeTab === "brands" ? "brand" : activeTab;
            openCreateModal(targetType);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium rounded-none hover:bg-zinc-800 cursor-pointer"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black">
        {[
          ["layout", "Bố Cục Trang Chủ (Layout Builder)"],
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
      {activeTab === "layout" && (
        <DataTable
          columns={layoutColumns}
          rows={Array.isArray(layoutSections) ? layoutSections : []}
          loading={layoutQuery.isLoading}
          rowKey={(r) => r.id}
          empty="Chưa có Section nào trong Layout."
        />
      )}

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
              if (modalType === "layout") saveLayoutMutation.mutate(formData);
              if (modalType === "banner") saveBannerMutation.mutate(formData);
              if (modalType === "brand") saveBrandMutation.mutate(formData);
              if (modalType === "featured") saveFeaturedMutation.mutate(formData);
            }}
            className="w-full max-w-lg border border-black bg-white p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-xl font-medium">
                {editingItem ? "Cập nhật" : "Thêm mới"}{" "}
                {modalType === "layout"
                  ? "Layout Section"
                  : modalType === "banner"
                  ? "Banner"
                  : modalType === "brand"
                  ? "Thương hiệu"
                  : "Section Nổi Bật"}
              </h3>
              <button type="button" onClick={closeModal} className="text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {modalType === "layout" && (
                <>
                  <label className="block text-sm font-medium">
                    Mã Block (Section Key)
                    <select
                      required
                      value={formData.sectionKey || "HERO_BANNER"}
                      onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm bg-white"
                    >
                      <option value="HERO_BANNER">HERO_BANNER (Hero Slide Banner)</option>
                      <option value="MARQUEE_TICKER">MARQUEE_TICKER (Dòng chữ thông báo chạy)</option>
                      <option value="FEATURED_PRODUCTS">FEATURED_PRODUCTS (Sản phẩm nổi bật)</option>
                      <option value="BUY_BY_NEED">BUY_BY_NEED (Mua theo nhu cầu)</option>
                      <option value="FEATURED_CATEGORIES">FEATURED_CATEGORIES (Danh mục nổi bật)</option>
                      <option value="NEWS_JOURNAL">NEWS_JOURNAL (Tin tức & Xu hướng)</option>
                      <option value="BRAND_LOGOS">BRAND_LOGOS (Thương hiệu đối tác)</option>
                      <option value="CUSTOM_PROMO_BANNER">CUSTOM_PROMO_BANNER (Banner khuyến mãi tùy chỉnh)</option>
                    </select>
                  </label>

                  <label className="block text-sm font-medium">
                    Tiêu đề chính
                    <input
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                      placeholder="VD: Sản phẩm bán chạy nhất"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Tiêu đề phụ / Subtitle
                    <input
                      type="text"
                      value={formData.subtitle || ""}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                      placeholder="VD: Bộ sưu tập công nghệ 2026"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Kiểu Layout (Layout Style)
                    <input
                      type="text"
                      value={formData.layoutStyle || ""}
                      onChange={(e) => setFormData({ ...formData, layoutStyle: e.target.value })}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm"
                      placeholder="GRID_5 / SLIDER / 2_COL_GRID / 3_COL_GRID"
                    />
                  </label>
                </>
              )}

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

                <label className="flex items-center gap-2 text-sm font-medium pt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalType === "layout" ? (formData.enabled ?? true) : (formData.isActive ?? true)}
                    onChange={(e) => {
                      if (modalType === "layout") {
                        setFormData({ ...formData, enabled: e.target.checked });
                      } else {
                        setFormData({ ...formData, isActive: e.target.checked });
                      }
                    }}
                    className="accent-black w-4 h-4"
                  />
                  Hiển thị công khai
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-black">
              <button type="button" onClick={closeModal} className="border border-black px-4 py-2 text-sm">
                Hủy
              </button>
              <button className="bg-black text-white px-5 py-2 text-sm hover:bg-zinc-800 cursor-pointer">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
