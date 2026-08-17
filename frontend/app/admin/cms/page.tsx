"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import { notifyError, notifySuccess } from "@/components/Notify";
import { HomeLayoutSection } from "@/types/home";
import { productService } from "@/services/productServices";
import { newsService } from "@/services/newsService";

import { useCmsState } from "@/hooks/useCmsState";
import ThemeStudioHeader, { ViewportMode } from "@/components/admin/cms/ThemeStudioHeader";
import ThemeStudioCanvas from "@/components/admin/cms/ThemeStudioCanvas";
import ThemeStudioSidebar from "@/components/admin/cms/ThemeStudioSidebar";
import { Upload, X } from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

/**
 * Reusable Image Upload Component with File Picker, Drag & Drop, URL Input, and Instant Preview
 */
function ImageUploader({
  value,
  onChange,
  label = "Hình ảnh",
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      notifyError("Vui lòng chọn file hình ảnh (PNG, JPG, WEBP, SVG)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      if (base64Url) {
        onChange(base64Url);
        notifySuccess(`Đã tải ảnh "${file.name}" thành công!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-zinc-300 uppercase">
        {label}
      </label>

      {value ? (
        <div className="relative group rounded-xl border border-zinc-800 bg-zinc-950 p-2 overflow-hidden flex flex-col items-center justify-center">
          <img
            src={value}
            alt="Uploaded preview"
            className="max-h-36 object-contain rounded-lg shadow-sm"
          />
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow hover:bg-zinc-100 flex items-center gap-1 cursor-pointer"
            >
              <Upload size={13} /> Thay ảnh
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow hover:bg-red-700 flex items-center gap-1 cursor-pointer"
            >
              <X size={13} /> Gỡ ảnh
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-zinc-800 hover:border-zinc-600 bg-zinc-950"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="p-2.5 rounded-full bg-zinc-900 text-blue-400">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">
                Kéo thả ảnh vào đây, hoặc <span className="text-blue-400 underline">bấm chọn file</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Hỗ trợ PNG, JPG, WEBP, SVG (Tối đa 10MB)
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />

      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] text-zinc-500 whitespace-nowrap">Dán URL:</span>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... dán link hình ảnh"
          className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

export default function CmsPage() {
  const queryClient = useQueryClient();

  // Studio Viewport State
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Branding Customization State (persisted in localStorage for demo studio)
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [desktopLogoSize, setDesktopLogoSize] = useState<number>(140);
  const [mobileLogoSize, setMobileLogoSize] = useState<number>(90);

  // Asset Modals
  const [modalType, setModalType] = useState<"banner" | "brand" | "section" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalFormData, setModalFormData] = useState<any>({});

  // Preview Data State
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [previewArticles, setPreviewArticles] = useState<any[]>([]);

  // Load stored studio preferences
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem("studio_logo_url");
      const savedDesktopSize = localStorage.getItem("studio_desktop_logo_size");
      const savedMobileSize = localStorage.getItem("studio_mobile_logo_size");
      if (savedLogo) setLogoUrl(savedLogo);
      if (savedDesktopSize) setDesktopLogoSize(Number(savedDesktopSize));
      if (savedMobileSize) setMobileLogoSize(Number(savedMobileSize));
    } catch (e) {}
  }, []);

  const handleLogoChange = (url: string) => {
    setLogoUrl(url);
    try {
      localStorage.setItem("studio_logo_url", url);
    } catch (e) {}
  };

  const handleDesktopLogoSizeChange = (size: number) => {
    setDesktopLogoSize(size);
    try {
      localStorage.setItem("studio_desktop_logo_size", String(size));
    } catch (e) {}
  };

  const handleMobileLogoSizeChange = (size: number) => {
    setMobileLogoSize(size);
    try {
      localStorage.setItem("studio_mobile_logo_size", String(size));
    } catch (e) {}
  };

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

  // useCmsState hook — sync with server data
  const cms = useCmsState(layoutSections);

  // Sync hook when react-query data changes (initial load or refetch after publish)
  useEffect(() => {
    if (layoutQuery.isSuccess && layoutSections.length >= 0) {
      cms.resetToOriginal(layoutSections);
    }
  }, [layoutQuery.dataUpdatedAt]);

  // Load preview products & articles
  useEffect(() => {
    productService
      .getProducts({ size: 8 })
      .then((res: any) => {
        const p = unwrap(res) || {};
        const items = p.items || p.content || (Array.isArray(p) ? p : []);
        setPreviewProducts(items);
      })
      .catch(() => {});

    newsService
      .recent(3)
      .then((res: any) => {
        const data = unwrap(res);
        if (Array.isArray(data)) setPreviewArticles(data);
      })
      .catch(() => {});
  }, []);

  // Banner mutations (keep these — they're separate from layout)
  const saveBannerMutation = useMutation({
    mutationFn: (data: any) =>
      data.id ? adminApi.home.banners.update(data.id, data) : adminApi.home.banners.create(data),
    onSuccess: () => {
      notifySuccess("Đã lưu Slide Banner!");
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

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setModalFormData({});
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishAll = async () => {
    setIsPublishing(true);
    try {
      await cms.publishAll();
      notifySuccess("Đã xuất bản tất cả thay đổi trang chủ!");
      // Refetch from server to sync state
      queryClient.invalidateQueries({ queryKey: ["cms-layout"] });
    } catch (err: any) {
      notifyError(err?.message || "Không thể xuất bản. Vui lòng thử lại.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cms.localSections.length) return;
    cms.reorder(index, targetIdx);
  };

  const handleToggleSectionEnabled = (section: HomeLayoutSection) => {
    cms.toggleEnabled(section.id);
  };

  const handleDeleteSection = (id: string) => {
    cms.deleteSection(id);
  };

  const handleSaveSection = (data: any) => {
    if (data.id) {
      cms.editSection(data.id, data);
    }
  };

  const handleCreateSection = (data: any) => {
    cms.createSection(data);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f0f0f0] overflow-hidden font-sans">
      {/* Top Visual Theme Studio Header */}
      <ThemeStudioHeader
        isDirty={cms.isDirty}
        isSaving={isPublishing}
        onSave={handlePublishAll}
      />

      {/* Main Split Body: Left Canvas Preview (~72%) & Right Customizer Sidebar (~28%) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Live Interactive Viewport Canvas */}
        <ThemeStudioCanvas
          viewport={viewport}
          onViewportChange={(vp) => setViewport(vp)}
          sections={cms.localSections}
          selectedSectionId={selectedSectionId}
          onSelectSection={(id) => {
            setSelectedSectionId(id);
          }}
          previewProducts={previewProducts}
          previewArticles={previewArticles}
          banners={banners}
          logoUrl={logoUrl}
          desktopLogoSize={desktopLogoSize}
          mobileLogoSize={mobileLogoSize}
        />

        {/* Right Side: Theme Customizer Control Panel */}
        <ThemeStudioSidebar
          sections={cms.localSections}
          selectedSectionId={selectedSectionId}
          onSelectSection={(id) => setSelectedSectionId(id)}
          onMoveSection={handleMoveSection}
          onToggleSectionEnabled={handleToggleSectionEnabled}
          onDeleteSection={handleDeleteSection}
          onSaveSection={handleSaveSection}
          onOpenCreateSection={() => {
            setModalType("section");
            setModalFormData({
              displayOrder: (cms.localSections.length || 0) + 1,
              enabled: true,
              sectionKey: "HERO_BANNER",
            });
          }}
          logoUrl={logoUrl}
          onLogoUrlChange={handleLogoChange}
          faviconUrl={faviconUrl}
          onFaviconUrlChange={(url) => setFaviconUrl(url)}
          desktopLogoSize={desktopLogoSize}
          onDesktopLogoSizeChange={handleDesktopLogoSizeChange}
          mobileLogoSize={mobileLogoSize}
          onMobileLogoSizeChange={handleMobileLogoSizeChange}
          banners={banners}
          onOpenBannerModal={(b) => {
            setModalType("banner");
            setEditingItem(b || null);
            setModalFormData(b ? { ...b } : { displayOrder: (banners.length || 0) + 1, isActive: true });
          }}
          onDeleteBanner={(id) => deleteBannerMutation.mutate(id)}
          brands={brands}
          onOpenBrandModal={(br) => {
            setModalType("brand");
            setEditingItem(br || null);
            setModalFormData(br ? { ...br } : { displayOrder: (brands.length || 0) + 1, isActive: true });
          }}
          onDeleteBrand={(id) => deleteBrandMutation.mutate(id)}
          isSaving={isPublishing || saveBannerMutation.isPending || saveBrandMutation.isPending}
          onSave={handlePublishAll}
        />
      </div>

      {/* MODAL CREATION / EDITING DIALOG */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (modalType === "section") {
                if (editingItem?.id) {
                  handleSaveSection(modalFormData);
                } else {
                  handleCreateSection(modalFormData);
                }
                closeModal();
              }
              if (modalType === "banner") saveBannerMutation.mutate(modalFormData);
              if (modalType === "brand") saveBrandMutation.mutate(modalFormData);
            }}
            className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-2xl transition-all max-h-[90vh] overflow-y-auto text-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-sm font-bold text-gray-900">
                {editingItem ? "Cập nhật" : "Thêm mới"}{" "}
                {modalType === "section"
                  ? "Section Layout"
                  : modalType === "banner"
                  ? "Slide Banner"
                  : "Thương hiệu đối tác"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {modalType === "section" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Mã Block (Section Key)
                    </label>
                    <select
                      required
                      value={modalFormData.sectionKey || "HERO_BANNER"}
                      onChange={(e) => setModalFormData({ ...modalFormData, sectionKey: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-blue-400"
                    >
                      <option value="HERO_BANNER">HERO_BANNER (Hero Slide Banner)</option>
                      <option value="MARQUEE_TICKER">MARQUEE_TICKER (Dòng chữ thông báo chạy)</option>
                      <option value="FEATURED_PRODUCTS">FEATURED_PRODUCTS (Sản phẩm nổi bật)</option>
                      <option value="BUY_BY_NEED">BUY_BY_NEED (Mua theo nhu cầu)</option>
                      <option value="FEATURED_CATEGORIES">FEATURED_CATEGORIES (Danh mục nổi bật)</option>
                      <option value="NEWS_JOURNAL">NEWS_JOURNAL (Tin tức & Xu hướng)</option>
                      <option value="BRAND_LOGOS">BRAND_LOGOS (Thương hiệu đối tác)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Tiêu đề chính
                    </label>
                    <input
                      type="text"
                      value={modalFormData.title || ""}
                      onChange={(e) => setModalFormData({ ...modalFormData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400"
                      placeholder="VD: Sản phẩm bán chạy nhất"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Tiêu đề phụ / Subtitle
                    </label>
                    <input
                      type="text"
                      value={modalFormData.subtitle || ""}
                      onChange={(e) => setModalFormData({ ...modalFormData, subtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400"
                      placeholder="VD: Bộ sưu tập công nghệ 2026"
                    />
                  </div>
                </>
              )}

              {modalType === "banner" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Tiêu đề Banner
                    </label>
                    <input
                      required
                      type="text"
                      value={modalFormData.title || ""}
                      onChange={(e) => setModalFormData({ ...modalFormData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <ImageUploader
                    label="Tải ảnh Banner"
                    value={modalFormData.imageUrl || ""}
                    onChange={(url) => setModalFormData({ ...modalFormData, imageUrl: url })}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Liên kết Đích (Link URL)
                    </label>
                    <input
                      type="text"
                      value={modalFormData.linkUrl || ""}
                      onChange={(e) => setModalFormData({ ...modalFormData, linkUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-blue-400"
                      placeholder="/shop hoặc /product/123"
                    />
                  </div>
                </>
              )}

              {modalType === "brand" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Tên Thương Hiệu
                    </label>
                    <input
                      required
                      type="text"
                      value={modalFormData.name || ""}
                      onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <ImageUploader
                    label="Tải Logo Thương Hiệu"
                    value={modalFormData.logoUrl || ""}
                    onChange={(url) => setModalFormData({ ...modalFormData, logoUrl: url })}
                  />
                </>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={modalFormData.displayOrder ?? modalFormData.sortOrder ?? 0}
                    onChange={(e) =>
                      setModalFormData({
                        ...modalFormData,
                        displayOrder: Number(e.target.value),
                        sortOrder: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        modalType === "section"
                          ? modalFormData.enabled ?? true
                          : modalFormData.isActive ?? true
                      }
                      onChange={(e) => {
                        if (modalType === "section") {
                          setModalFormData({ ...modalFormData, enabled: e.target.checked });
                        } else {
                          setModalFormData({ ...modalFormData, isActive: e.target.checked });
                        }
                      }}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    />
                    <span>Kích hoạt công khai</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
