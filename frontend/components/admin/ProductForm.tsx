"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminProductService } from "@/services/admin/adminProductService";
import { adminCategoryService } from "@/services/admin/adminCategoryService";
import { useParams, useRouter } from "next/navigation";
import { notifyError, notifySuccess } from "@/components/Notify";
import { Plus, Trash2, ArrowLeft, Layers, ShieldCheck, Tag, Upload, HardDrive, Cpu, Monitor } from "lucide-react";

interface VariantForm {
  color: string;
  cpu: string;
  ram: string;
  ssd: string;
  vga: string;
  screen: string;
  price: number;
  stock: number;
  vatPercent: number;
  image: string;
}

const defaultVariant: VariantForm = {
  color: "Xanh Trầm",
  cpu: "Intel Core Ultra 7 155H",
  ram: "16GB LPDDR5X",
  ssd: "512GB NVMe SSD",
  vga: "Intel Arc Graphics",
  screen: "14.0 inch 3K OLED 120Hz",
  price: 24990000,
  stock: 10,
  vatPercent: 10,
  image: "",
};

export default function ProductForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  // Query categories for dropdown selector
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminCategoryService.list(),
  });

  const categories = (categoriesQuery.data as any)?.data?.items || (categoriesQuery.data as any)?.data?.content || (categoriesQuery.data as any)?.data || [];

  // Query detail if in EDIT mode
  const detailQuery = useQuery({
    queryKey: ["product-detail-admin", id],
    queryFn: () => adminProductService.get(id!),
    enabled: !!id,
  });

  // Base product state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("ASUS");
  const [origin, setOrigin] = useState("Chính hãng VN");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState(24);
  const [description, setDescription] = useState("");

  // Dynamic variants array state
  const [variants, setVariants] = useState<VariantForm[]>([defaultVariant]);

  // Populate data when editing
  useEffect(() => {
    const p: any = (detailQuery.data as any)?.data ?? detailQuery.data;
    if (p) {
      setName(p.name || "");
      setBrand(p.brand || "ASUS");
      setOrigin(p.origin || "Chính hãng");
      setCategoryId(p.categoryId || "");
      setThumbnail(p.thumbnail || "");
      setWarrantyMonths(p.warrantyMonths || 24);
      setDescription(p.description || "");

      if (p.variants && p.variants.length > 0) {
        setVariants(
          p.variants.map((v: any) => ({
            color: v.attributes?.Color || v.attributes?.color || "",
            cpu: v.attributes?.CPU || v.attributes?.cpu || "",
            ram: v.attributes?.RAM || v.attributes?.ram || "",
            ssd: v.attributes?.SSD || v.attributes?.ssd || "",
            vga: v.attributes?.VGA || v.attributes?.vga || "",
            screen: v.attributes?.Screen || v.attributes?.screen || "",
            price: v.price || 0,
            stock: v.stock || 0,
            vatPercent: v.vatPercent || 10,
            image: v.image || "",
          }))
        );
      }
    }
  }, [detailQuery.data]);

  // Handle adding variant
  const addVariantRow = () => {
    setVariants((prev) => [...prev, { ...defaultVariant }]);
  };

  // Handle removing variant
  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) {
      notifyError("Sản phẩm phải có ít nhất 1 phiên bản biến thể!");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Update variant input
  const updateVariantField = (index: number, field: keyof VariantForm, value: any) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("Tên sản phẩm không được để trống!");
      if (!categoryId) throw new Error("Vui lòng chọn danh mục cho sản phẩm!");

      // Transform form state to ProductAdminRequest DTO expected by Java Backend
      const payload = {
        name,
        brand,
        origin,
        categoryId,
        thumbnail,
        warrantyMonths: Number(warrantyMonths),
        description,
        variants: variants.map((v) => {
          const attributes: Record<string, string> = {};
          if (v.color) attributes["Color"] = v.color;
          if (v.cpu) attributes["CPU"] = v.cpu;
          if (v.ram) attributes["RAM"] = v.ram;
          if (v.ssd) attributes["SSD"] = v.ssd;
          if (v.vga) attributes["VGA"] = v.vga;
          if (v.screen) attributes["Screen"] = v.screen;

          return {
            attributes,
            price: Number(v.price),
            stock: Number(v.stock),
            vatPercent: Number(v.vatPercent),
            image: v.image || undefined,
          };
        }),
      };

      return id
        ? adminProductService.update(id, payload)
        : adminProductService.create(payload);
    },
    onSuccess: () => {
      notifySuccess(id ? "Đã cập nhật sản phẩm thành công!" : "Tạo sản phẩm mới thành công!");
      router.push("/admin/products");
    },
    onError: (err: any) => {
      notifyError(err.message || "Đã có lỗi xảy ra khi lưu sản phẩm.");
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-black dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
            <button onClick={() => router.back()} className="hover:underline flex items-center gap-1">
              <ArrowLeft size={14} /> Quản lý sản phẩm
            </button>
            <span>/</span>
            <span className="text-black dark:text-white font-bold">{id ? "Chỉnh sửa" : "Tạo mới"}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {id ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-black dark:border-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Hủy bỏ
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-8">
        
        {/* BLOCK 1: THÔNG TIN CƠ BẢN */}
        <div className="p-6 border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-6">
          <h2 className="text-lg font-extrabold border-b border-black/10 dark:border-zinc-800 pb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" /> 1. Thông tin chung sản phẩm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Tên sản phẩm Laptop <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Laptop ASUS Zenbook 14 UX3405CA OLED Ultra 7"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-black dark:border-white px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Danh mục sản phẩm <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-black dark:border-white px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Thương hiệu (Brand)
              </label>
              <input
                type="text"
                placeholder="VD: ASUS, MSI, Lenovo, Dell, Apple..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-black dark:border-white px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
              />
            </div>

            {/* Origin */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Xuất xứ sản phẩm
              </label>
              <input
                type="text"
                placeholder="VD: Chính hãng Việt Nam"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full border border-black dark:border-white px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
              />
            </div>

            {/* Warranty Months */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <ShieldCheck size={14} /> Thời gian bảo hành (Tháng)
              </label>
              <input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full border border-black dark:border-white px-3.5 py-2.5 text-sm font-mono font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
              />
            </div>

            {/* Thumbnail Image URL & File Upload Picker */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1"><Upload size={14} /> Ảnh đại diện sản phẩm (Thumbnail)</span>
                <span className="text-[11px] text-zinc-400 font-mono">Dán URL hoặc tải file từ máy</span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... hoặc dán URL ảnh có sẵn"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="flex-1 border border-black dark:border-white px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none"
                />
                
                <label className="bg-black text-white dark:bg-white dark:text-black hover:bg-[#C5FA1F] hover:text-black border border-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0">
                  <Upload size={14} /> Chọn Tải File Ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fakeUrl = URL.createObjectURL(file);
                        setThumbnail(fakeUrl);
                        notifySuccess(`Đã tải ảnh "${file.name}" làm Thumbnail!`);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Thumbnail Image Preview */}
              {thumbnail && (
                <div className="mt-2 relative w-24 h-24 border border-black dark:border-white bg-zinc-50 dark:bg-zinc-800 p-1 group">
                  <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>


            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Mô tả chi tiết sản phẩm
              </label>
              <textarea
                rows={4}
                placeholder="Nhập mô tả sản phẩm, ưu điểm nổi bật..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-black dark:border-white p-3.5 text-sm leading-relaxed bg-white dark:bg-zinc-800 focus:outline-none"
              />
            </div>

          </div>
        </div>

        {/* BLOCK 2: DYNAMIC VARIANTS & HARDWARE SPECS FORM */}
        <div className="p-6 border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" /> 2. Cấu hình phần cứng & Biến thể sản phẩm
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Sản phẩm phải có ít nhất 1 phiên bản biến thể với cấu hình chi tiết bên dưới.</p>
            </div>
            <button
              type="button"
              onClick={addVariantRow}
              className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#C5FA1F] hover:text-black transition-colors border border-black"
            >
              <Plus size={14} /> Thêm biến thể mới
            </button>
          </div>

          <div className="space-y-6">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="p-5 border border-black/20 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 relative space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-xs font-extrabold uppercase font-mono bg-black text-white dark:bg-white dark:text-black px-2.5 py-1">
                    Phiên bản #{idx + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Xóa phiên bản này
                    </button>
                  )}
                </div>

                {/* Specs Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  
                  {/* CPU */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Cpu size={12} /> Bộ vi xử lý (CPU)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Intel Core Ultra 7 155H"
                      value={v.cpu}
                      onChange={(e) => updateVariantField(idx, "cpu", e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* RAM */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      RAM
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 16GB LPDDR5X"
                      value={v.ram}
                      onChange={(e) => updateVariantField(idx, "ram", e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* SSD */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <HardDrive size={12} /> Ổ cứng (SSD)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 512GB NVMe SSD"
                      value={v.ssd}
                      onChange={(e) => updateVariantField(idx, "ssd", e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* VGA */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      Card đồ họa (VGA)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Intel Arc Graphics / RTX 4060"
                      value={v.vga}
                      onChange={(e) => updateVariantField(idx, "vga", e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* Screen */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Monitor size={12} /> Màn hình
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 14.0 inch 3K OLED 120Hz"
                      value={v.screen}
                      onChange={(e) => updateVariantField(idx, "screen", e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      Màu sắc (Color)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Xanh Trầm / Xám"
                      value={v.color}
                      onChange={(e) => updateVariantField(idx, "color", e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-semibold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      Giá bán (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={v.price}
                      onChange={(e) => updateVariantField(idx, "price", Number(e.target.value))}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-mono font-extrabold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      Số lượng tồn kho <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={v.stock}
                      onChange={(e) => updateVariantField(idx, "stock", Number(e.target.value))}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-mono font-bold bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                  {/* VAT */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      Thuế VAT (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={v.vatPercent}
                      onChange={(e) => updateVariantField(idx, "vatPercent", Number(e.target.value))}
                      className="w-full border border-zinc-300 dark:border-zinc-700 p-2 font-mono bg-white dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-black dark:border-zinc-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-black dark:border-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-extrabold uppercase tracking-wider border border-black hover:bg-[#C5FA1F] hover:text-black transition-colors disabled:opacity-40"
          >
            {saveMutation.isPending ? "Đang lưu thông tin..." : id ? "Cập nhật sản phẩm" : "Lưu & Tạo sản phẩm"}
          </button>
        </div>

      </form>
    </div>
  );
}
