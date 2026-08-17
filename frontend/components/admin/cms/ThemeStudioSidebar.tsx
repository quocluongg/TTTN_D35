"use client";

import { useState, useRef, useEffect } from "react";
import { HomeLayoutSection } from "@/types/home";
import {
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  ChevronRight,
  ChevronDown,
  Type,
  Globe,
  Layers,
  Info,
  Loader2,
} from "lucide-react";
import { notifyError, notifySuccess } from "@/components/Notify";

interface ThemeStudioSidebarProps {
  // Layout Section Props
  sections: HomeLayoutSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onToggleSectionEnabled: (section: HomeLayoutSection) => void;
  onDeleteSection: (id: string) => void;
  onSaveSection: (sectionData: any) => void;
  onOpenCreateSection: () => void;

  // Branding Props
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  faviconUrl: string;
  onFaviconUrlChange: (url: string) => void;
  desktopLogoSize: number;
  onDesktopLogoSizeChange: (size: number) => void;
  mobileLogoSize: number;
  onMobileLogoSizeChange: (size: number) => void;

  // Assets (Banners & Brands)
  banners: any[];
  onOpenBannerModal: (banner?: any) => void;
  onDeleteBanner: (id: string) => void;
  brands: any[];
  onOpenBrandModal: (brand?: any) => void;
  onDeleteBrand: (id: string) => void;

  // Publish
  isSaving: boolean;
  onSave: () => void;
}

// --- Small Upload Box component (matches reference image style) ---
function UploadBox({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      notifyError("Vui lòng chọn file hình ảnh!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      if (b64) onChange(b64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain" />
          ) : (
            <Upload size={14} className="text-gray-300" />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-gray-700 leading-tight">
            {value ? "Đã tải ảnh" : "Drag image or upload from device"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {hint || "Accepted: PNG, JPG, SVG • Max 10MB"}
          </p>
        </div>
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 px-2 py-1 text-[10px] font-semibold text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer whitespace-nowrap"
        >
          Upload File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />
      </div>
      {/* URL fallback */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Hoặc dán URL ảnh..."
        className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-gray-200 rounded-md text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
      />
    </div>
  );
}

// --- Accordion Section wrapper ---
function AccordionSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        {open ? (
          <ChevronDown size={13} className="text-gray-400" />
        ) : (
          <ChevronRight size={13} className="text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// --- Simple clickable row (non-accordion, just a link row) ---
function RowLink({
  icon,
  label,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div>
          <p className="text-[12px] font-semibold text-gray-700">{label}</p>
          {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight size={13} className="text-gray-300" />
    </div>
  );
}

/**
 * Parses configJson string and renders contextual form fields per sectionKey.
 * FEATURED_PRODUCTS: limit (number) + sortBy (select)
 * NEWS_JOURNAL: limit (number)
 * Others: no config fields
 */
function ConfigJsonEditor({
  sectionKey,
  configJson,
  onChange,
}: {
  sectionKey: string;
  configJson: string;
  onChange: (json: string) => void;
}) {
  // Parse existing config
  let config: Record<string, any> = {};
  try {
    config = configJson ? JSON.parse(configJson) : {};
  } catch {
    config = {};
  }

  const updateConfig = (key: string, value: any) => {
    const next = { ...config, [key]: value };
    onChange(JSON.stringify(next));
  };

  // Only show config for sections that have config fields
  if (sectionKey === "FEATURED_PRODUCTS") {
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Section Config
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Limit</label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.limit ?? 10}
              onChange={(e) => updateConfig("limit", Number(e.target.value))}
              className="w-full px-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Sort By</label>
            <select
              value={config.sortBy ?? "createdAt"}
              onChange={(e) => updateConfig("sortBy", e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-400"
            >
              <option value="createdAt">Mới nhất</option>
              <option value="price">Giá</option>
              <option value="name">Tên</option>
              <option value="rating">Đánh giá</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (sectionKey === "NEWS_JOURNAL") {
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Section Config
        </label>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Limit</label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.limit ?? 3}
            onChange={(e) => updateConfig("limit", Number(e.target.value))}
            className="w-full px-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
    );
  }

  // No config fields for other section types
  return null;
}

export default function ThemeStudioSidebar({
  sections,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onToggleSectionEnabled,
  onDeleteSection,
  onSaveSection,
  onOpenCreateSection,
  logoUrl,
  onLogoUrlChange,
  faviconUrl,
  onFaviconUrlChange,
  desktopLogoSize,
  onDesktopLogoSizeChange,
  mobileLogoSize,
  onMobileLogoSizeChange,
  banners,
  onOpenBannerModal,
  onDeleteBanner,
  brands,
  onOpenBrandModal,
  onDeleteBrand,
  isSaving,
  onSave,
}: ThemeStudioSidebarProps) {
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const [inspectorData, setInspectorData] = useState<any>(selectedSection || {});

  // Reset inspector when selected section changes
  useEffect(() => {
    setInspectorData(selectedSection || {});
  }, [selectedSectionId]);

  const handleInspectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectorData.id) return;
    onSaveSection(inspectorData);
  };

  return (
    <aside className="w-[280px] bg-white border-l border-gray-200 text-gray-800 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Sidebar Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <h2 className="text-[13px] font-bold text-gray-900">Customize Your Website</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Personalize your site's appearance. Updates reflect live.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">



        {/* LOGO Section */}
        <AccordionSection label="Logo">
          <UploadBox
            label="Site Logo"
            value={logoUrl}
            onChange={onLogoUrlChange}
          />

          {/* Desktop Logo Size */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600">Desktop Logo Size</span>
              <span className="text-[11px] font-mono font-bold text-blue-600">{desktopLogoSize}px</span>
            </div>
            <input
              type="range"
              min={60}
              max={240}
              value={desktopLogoSize}
              onChange={(e) => onDesktopLogoSizeChange(Number(e.target.value))}
              className="w-full h-1.5 accent-blue-500 cursor-pointer rounded-full"
            />
          </div>

          {/* Mobile Logo Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600">Mobile Logo Size</span>
              <span className="text-[11px] font-mono font-bold text-blue-600">{mobileLogoSize}px</span>
            </div>
            <input
              type="range"
              min={30}
              max={160}
              value={mobileLogoSize}
              onChange={(e) => onMobileLogoSizeChange(Number(e.target.value))}
              className="w-full h-1.5 accent-blue-500 cursor-pointer rounded-full"
            />
          </div>
        </AccordionSection>

        {/* Typography & Colors — row link (collapsed by default) */}
        <RowLink
          icon={<Type size={14} />}
          label="Typography & Colors"
          subtitle="Font, text & theme colors"
        />

        {/* HERO SLIDE BANNERS SECTION */}
        <AccordionSection label="Hero Slides & Banners" defaultOpen={true}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-600">
              Danh sách Slide Banner ({banners.length})
            </span>
            <button
              type="button"
              onClick={() => onOpenBannerModal()}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 cursor-pointer transition-colors"
            >
              <Plus size={11} /> Thêm Slide Banner
            </button>
          </div>

          {banners.length > 0 ? (
            <div className="space-y-2 pt-1">
              {banners.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 group hover:border-blue-300 transition-all"
                >
                  <span className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center font-mono font-bold text-[10px] text-gray-600 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={12} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate">
                      {b.title || "Slide Banner"}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      {b.linkUrl || "Không có link"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenBannerModal(b)}
                      className="p-1 rounded text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                      title="Chỉnh sửa slide"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBanner(b.id)}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Xóa slide"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center bg-gray-50 border border-dashed border-gray-200 rounded-lg space-y-1.5">
              <p className="text-[11px] text-gray-500 font-medium">Chưa có Slide Banner nào</p>
              <button
                type="button"
                onClick={() => onOpenBannerModal()}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                + Bấm vào đây để tạo Slide mới
              </button>
            </div>
          )}
        </AccordionSection>

        {/* MANAGE PAGES & NAVIGATION */}
        <div className="border-b border-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Manage Pages &amp; Navigation
            </span>
            <button
              type="button"
              onClick={onOpenCreateSection}
              className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              <Plus size={11} /> Add
            </button>
          </div>

          <div className="pb-3 space-y-0.5 px-2">
            {sections.map((sec, idx) => {
              const isSelected = selectedSectionId === sec.id;
              return (
                <div
                  key={sec.id || idx}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  {/* Drag handle icon */}
                  <Layers size={12} className="text-gray-300 shrink-0" />

                  {/* Section name */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onSelectSection(sec.id);
                    }}
                  >
                    <p className={`text-[12px] font-semibold truncate ${isSelected ? "text-blue-700" : "text-gray-700"}`}>
                      {sec.title || sec.sectionKey}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{sec.sectionKey}</p>
                  </div>

                  {/* Visibility */}
                  <button
                    type="button"
                    onClick={() => onToggleSectionEnabled(sec)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      sec.enabled ? "text-gray-400 hover:text-gray-600" : "text-gray-200 hover:text-gray-400"
                    }`}
                    title={sec.enabled ? "Đang hiện" : "Đang ẩn"}
                  >
                    {sec.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>

                  {/* Move */}
                  <button
                    type="button"
                    disabled={idx <= 0}
                    onClick={() => onMoveSection(idx, "up")}
                    className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={idx >= sections.length - 1}
                    onClick={() => onMoveSection(idx, "down")}
                    className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown size={11} />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => onSelectSection(sec.id)}
                    className="p-1 text-gray-300 hover:text-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 size={11} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onDeleteSection(sec.id)}
                    className="p-1 text-gray-200 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}

            {/* + Add a page */}
            <button
              type="button"
              onClick={onOpenCreateSection}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-dashed border-gray-200 mt-1"
            >
              <Plus size={13} className="text-gray-400" />
              Add a page
            </button>
          </div>
        </div>

        {/* Section Inspector (shown when section is selected) */}
        {selectedSection && (
          <div className="border-b border-gray-100">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                  Editing: {selectedSection.sectionKey}
                </span>
              </div>
              <form onSubmit={handleInspectorSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Tiêu đề chính
                  </label>
                  <input
                    type="text"
                    value={inspectorData.title ?? selectedSection.title ?? ""}
                    onChange={(e) =>
                      setInspectorData({ ...inspectorData, id: selectedSection.id, title: e.target.value })
                    }
                    placeholder="Nhập tiêu đề..."
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Tiêu đề phụ
                  </label>
                  <input
                    type="text"
                    value={inspectorData.subtitle ?? selectedSection.subtitle ?? ""}
                    onChange={(e) =>
                      setInspectorData({ ...inspectorData, id: selectedSection.id, subtitle: e.target.value })
                    }
                    placeholder="Nhập subtitle..."
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Layout Style Select */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Layout Style
                  </label>
                  <select
                    value={inspectorData.layoutStyle ?? selectedSection.layoutStyle ?? ""}
                    onChange={(e) =>
                      setInspectorData({ ...inspectorData, id: selectedSection.id, layoutStyle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="">— Chọn layout —</option>
                    <option value="FULL_WIDTH">Full Width</option>
                    <option value="HERO_FULL">Hero Full</option>
                    <option value="GRID">Grid</option>
                    <option value="GRID_5">Grid 5 Columns</option>
                    <option value="2_COL_GRID">2 Column Grid</option>
                    <option value="3_COL_GRID">3 Column Grid</option>
                    <option value="CARDS">Cards</option>
                    <option value="TICKER">Ticker</option>
                    <option value="LIST">List</option>
                  </select>
                </div>

                {/* Config JSON Fields */}
                <ConfigJsonEditor
                  sectionKey={selectedSection.sectionKey}
                  configJson={inspectorData.configJson ?? selectedSection.configJson ?? ""}
                  onChange={(json) =>
                    setInspectorData({ ...inspectorData, id: selectedSection.id, configJson: json })
                  }
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inspectorData.enabled ?? selectedSection.enabled ?? true}
                      onChange={(e) =>
                        setInspectorData({ ...inspectorData, id: selectedSection.id, enabled: e.target.checked })
                      }
                      className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                    />
                    Bật hiển thị
                  </label>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Info banner — "Your site will be live at..." */}
        <div className="mx-3 my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <Globe size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-amber-800">Your site will be live at</p>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 underline hover:text-blue-800 font-medium break-all"
              >
                {typeof window !== "undefined" ? window.location.origin : ""}
              </a>
            </div>
          </div>
        </div>

        {/* Brand Logos section */}
        {brands.length > 0 && (
          <AccordionSection label="Brand Logos" defaultOpen={false}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500">({brands.length} thương hiệu)</span>
              <button
                type="button"
                onClick={() => onOpenBrandModal()}
                className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 cursor-pointer"
              >
                <Plus size={10} /> Thêm
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {brands.slice(0, 6).map((br) => (
                <div key={br.id} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 group relative">
                  <div className="w-10 h-10 flex items-center justify-center">
                    {br.logoUrl ? (
                      <img src={br.logoUrl} alt={br.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Upload size={12} className="text-gray-300" />
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 font-medium truncate w-full text-center">{br.name}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteBrand(br.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}
      </div>

      {/* Fixed Footer: Publish */}
      <div className="shrink-0 border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-700 active:scale-[0.98] disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-all cursor-pointer shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <span className="text-base leading-none">■</span>
              Publish
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

