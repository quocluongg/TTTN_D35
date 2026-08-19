"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminProductService } from "@/services/admin/adminProductService";
import { adminCategoryService } from "@/services/admin/adminCategoryService";
import { adminAttributeKeyService } from "@/services/admin/adminAttributeKeyService";
import { useParams, useRouter } from "next/navigation";
import { notifyError, notifySuccess } from "@/components/Notify";
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Layers, 
  ShieldCheck, 
  Tag, 
  Upload, 
  HardDrive, 
  Cpu, 
  Monitor,
  Sliders,
  Sparkles,
  ListPlus,
  Edit2,
  FolderPlus,
  Package
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VariantAttrItem {
  key: string;
  value: string;
}

interface VariantForm {
  id?: string;
  price: number;
  stock: number;
  vatPercent: number;
  image: string;
  attributes: VariantAttrItem[];
}

interface SpecFormItem {
  id?: number | string;
  attributeKeyId?: number;
  attributeName: string;
  attributeDisplayName?: string;
  specGroup: string;
  specValue: string;
  specUnit?: string;
}

const COMMON_SPEC_GROUPS = [
  "Bộ xử lý (CPU)",
  "Bộ nhớ & Lưu trữ",
  "Màn hình",
  "Đồ họa (VGA)",
  "Pin & Sạc",
  "Hệ điều hành & Trọng lượng",
  "Kết nối & Âm thanh",
  "Thông số chung",
];

const defaultVariant: VariantForm = {
  price: 24990000,
  stock: 10,
  vatPercent: 10,
  image: "",
  attributes: [
    { key: "Color", value: "Xanh Trầm" },
    { key: "CPU", value: "Intel Core Ultra 7 155H" },
    { key: "RAM", value: "16GB LPDDR5X" },
    { key: "SSD", value: "512GB NVMe SSD" },
  ],
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

  // Query attribute keys dictionary
  const attributeKeysQuery = useQuery({
    queryKey: ["admin-attribute-keys"],
    queryFn: () => adminAttributeKeyService.list(),
  });
  const attributeKeys: any[] = (attributeKeysQuery.data as any)?.data || (attributeKeysQuery.data as any) || [];

  // Query detail if in EDIT mode
  const detailQuery = useQuery({
    queryKey: ["product-detail-admin", id],
    queryFn: () => adminProductService.get(id!),
    enabled: !!id,
  });

  // Query specifications if in EDIT mode
  const specificationsQuery = useQuery({
    queryKey: ["product-specifications-admin", id],
    queryFn: () => adminProductService.getSpecifications(id!),
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

  // Dynamic specifications state
  const [specifications, setSpecifications] = useState<SpecFormItem[]>([]);

  // Group Management Modal State
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<"ADD" | "RENAME">("ADD");
  const [targetGroupOldName, setTargetGroupOldName] = useState("");
  const [groupNameInput, setGroupNameInput] = useState("");

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
          p.variants.map((v: any) => {
            const rawAttrs = v.attributes || {};
            const attrsArray: VariantAttrItem[] = Object.entries(rawAttrs).map(
              ([key, value]) => ({
                key,
                value: String(value ?? ""),
              })
            );

            return {
              id: v.id,
              price: v.price || 0,
              stock: v.stock || 0,
              vatPercent: v.vatPercent || 10,
              image: v.image || "",
              attributes:
                attrsArray.length > 0
                  ? attrsArray
                  : [{ key: "Color", value: "Tiêu chuẩn" }],
            };
          })
        );
      }
    }
  }, [detailQuery.data]);

  // Populate specifications when fetched
  useEffect(() => {
    const specsData = (specificationsQuery.data as any)?.data || specificationsQuery.data;
    const p: any = (detailQuery.data as any)?.data ?? detailQuery.data;
    const rawSpecs = specsData || p?.specifications;

    if (Array.isArray(rawSpecs) && rawSpecs.length > 0) {
      setSpecifications(
        rawSpecs.map((s: any) => ({
          id: s.id,
          attributeKeyId: s.attributeKeyId,
          attributeName: s.attributeName || s.attributeKey?.name || "",
          attributeDisplayName: s.attributeDisplayName || s.attributeKey?.displayName || "",
          specGroup: s.specGroup || "Thông số chung",
          specValue: s.specValue || "",
          specUnit: s.specUnit || s.attributeKey?.unit || "",
        }))
      );
    }
  }, [specificationsQuery.data, detailQuery.data]);

  // Handle adding variant
  const addVariantRow = () => {
    const templateAttrs = variants[0]?.attributes?.map((a) => ({ key: a.key, value: "" })) || [
      { key: "Color", value: "" },
    ];
    setVariants((prev) => [
      ...prev,
      {
        price: variants[0]?.price || 0,
        stock: 10,
        vatPercent: 10,
        image: "",
        attributes: templateAttrs,
      },
    ]);
  };

  // Handle removing variant
  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) {
      notifyError("Sản phẩm phải có ít nhất 1 phiên bản biến thể!");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Update variant top-level fields
  const updateVariantField = (index: number, field: keyof VariantForm, value: any) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Variant attributes dynamic operations
  const addVariantAttribute = (vIdx: number, keyName = "") => {
    setVariants((prev) => {
      const next = [...prev];
      const targetAttrs = [...next[vIdx].attributes];
      if (keyName && targetAttrs.some((a) => a.key.toLowerCase() === keyName.toLowerCase())) {
        return prev;
      }
      targetAttrs.push({ key: keyName || "Color", value: "" });
      next[vIdx] = { ...next[vIdx], attributes: targetAttrs };
      return next;
    });
  };

  const removeVariantAttribute = (vIdx: number, attrIdx: number) => {
    setVariants((prev) => {
      const next = [...prev];
      const targetAttrs = next[vIdx].attributes.filter((_, i) => i !== attrIdx);
      next[vIdx] = { ...next[vIdx], attributes: targetAttrs };
      return next;
    });
  };

  const updateVariantAttribute = (
    vIdx: number,
    attrIdx: number,
    field: "key" | "value",
    val: string
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      const targetAttrs = [...next[vIdx].attributes];
      targetAttrs[attrIdx] = { ...targetAttrs[attrIdx], [field]: val };
      next[vIdx] = { ...next[vIdx], attributes: targetAttrs };
      return next;
    });
  };

  // Specification operations
  const addSpecRow = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        specGroup: "Bộ xử lý (CPU)",
        attributeName: "",
        specValue: "",
        specUnit: "",
      },
    ]);
  };

  const addSpecToGroup = (groupName: string) => {
    setSpecifications((prev) => [
      ...prev,
      {
        specGroup: groupName,
        attributeName: "",
        specValue: "",
        specUnit: "",
      },
    ]);
  };

  const openAddGroupModal = () => {
    setGroupModalMode("ADD");
    setGroupNameInput("");
    setGroupModalOpen(true);
  };

  const openRenameGroupModal = (oldName: string) => {
    setGroupModalMode("RENAME");
    setTargetGroupOldName(oldName);
    setGroupNameInput(oldName);
    setGroupModalOpen(true);
  };

  const handleGroupModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupNameInput.trim();
    if (!trimmed) return;

    if (groupModalMode === "ADD") {
      addSpecToGroup(trimmed);
      notifySuccess(`Đã tạo nhóm thông số "${trimmed}"!`);
    } else if (groupModalMode === "RENAME" && targetGroupOldName) {
      setSpecifications((prev) =>
        prev.map((s) => (s.specGroup === targetGroupOldName ? { ...s, specGroup: trimmed } : s))
      );
      notifySuccess(`Đã đổi tên nhóm thành "${trimmed}"!`);
    }

    setGroupModalOpen(false);
  };

  const removeSpecGroup = (groupName: string) => {
    setSpecifications((prev) => prev.filter((s) => s.specGroup !== groupName));
    notifySuccess(`Đã xóa nhóm thông số "${groupName}"`);
  };

  const removeSpecRow = (globalIndex: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== globalIndex));
  };

  const updateSpecField = (globalIndex: number, field: keyof SpecFormItem, value: any) => {
    setSpecifications((prev) => {
      const next = [...prev];
      next[globalIndex] = { ...next[globalIndex], [field]: value };
      return next;
    });
  };

  const handleSelectAttributeKey = (globalIndex: number, keyIdStr: string) => {
    if (!keyIdStr) {
      updateSpecField(globalIndex, "attributeKeyId", undefined);
      return;
    }
    const keyId = Number(keyIdStr);
    const foundKey = attributeKeys.find((k: any) => Number(k.id) === keyId);
    setSpecifications((prev) => {
      const next = [...prev];
      next[globalIndex] = {
        ...next[globalIndex],
        attributeKeyId: keyId,
        attributeName: foundKey?.name || next[globalIndex].attributeName,
        attributeDisplayName: foundKey?.displayName || foundKey?.name || "",
        specUnit: next[globalIndex].specUnit || foundKey?.unit || "",
      };
      return next;
    });
  };

  const autoFillFromVariants = () => {
    const v1 = variants[0];
    if (!v1 || !v1.attributes) return;
    const newSpecs: SpecFormItem[] = [...specifications];

    v1.attributes.forEach((attr) => {
      if (!attr.key || !attr.value) return;
      const existing = newSpecs.find(
        (s) => s.attributeName.toLowerCase() === attr.key.toLowerCase()
      );
      if (existing) {
        existing.specValue = attr.value;
      } else {
        newSpecs.push({
          specGroup: "Thông số biến thể",
          attributeName: attr.key,
          attributeDisplayName: attr.key,
          specValue: attr.value,
        });
      }
    });

    setSpecifications(newSpecs);
    notifySuccess("Đã tự động lấy dữ liệu thuộc tính từ Biến thể #1!");
  };

  const autoFillTemplate = () => {
    const v1 = variants[0];
    const getVal = (k: string) => v1?.attributes?.find((a) => a.key.toLowerCase() === k.toLowerCase())?.value || "";

    const templates: SpecFormItem[] = [
      { specGroup: "Bộ xử lý (CPU)", attributeName: "CPU", specValue: getVal("cpu") || "Intel Core Ultra 7 155H", specUnit: "" },
      { specGroup: "Bộ xử lý (CPU)", attributeName: "Số nhân / Số luồng", specValue: "16 nhân 22 luồng", specUnit: "" },
      { specGroup: "Bộ nhớ & Lưu trữ", attributeName: "RAM", specValue: getVal("ram") || "16GB LPDDR5X", specUnit: "" },
      { specGroup: "Bộ nhớ & Lưu trữ", attributeName: "Ổ cứng SSD", specValue: getVal("ssd") || "512GB NVMe SSD", specUnit: "" },
      { specGroup: "Màn hình", attributeName: "Kích thước màn hình", specValue: getVal("screen") || "14.0 inch 3K OLED", specUnit: "" },
      { specGroup: "Màn hình", attributeName: "Tần số quét", specValue: "120Hz", specUnit: "Hz" },
      { specGroup: "Đồ họa (VGA)", attributeName: "Card đồ họa (VGA)", specValue: getVal("vga") || "Intel Arc Graphics", specUnit: "" },
      { specGroup: "Pin & Sạc", attributeName: "Dung lượng PIN", specValue: "75Wh", specUnit: "Wh" },
      { specGroup: "Hệ điều hành & Trọng lượng", attributeName: "Hệ điều hành", specValue: "Windows 11 Home", specUnit: "" },
      { specGroup: "Hệ điều hành & Trọng lượng", attributeName: "Trọng lượng", specValue: "1.2", specUnit: "kg" },
    ];
    setSpecifications(templates);
    notifySuccess("Đã nạp khung mẫu thông số Laptop thành công!");
  };

  // Icon chooser for spec group cards
  const getGroupIcon = (groupName: string) => {
    const g = groupName.toLowerCase();
    if (g.includes("cpu") || g.includes("bộ xử lý")) return <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />;
    if (g.includes("ram") || g.includes("ssd") || g.includes("lưu trữ") || g.includes("bộ nhớ")) return <HardDrive size={16} className="text-purple-600 dark:text-purple-400" />;
    if (g.includes("màn hình") || g.includes("screen") || g.includes("display")) return <Monitor size={16} className="text-blue-600 dark:text-blue-400" />;
    if (g.includes("vga") || g.includes("đồ họa") || g.includes("gpu")) return <Layers size={16} className="text-amber-600 dark:text-amber-400" />;
    if (g.includes("pin") || g.includes("sạc") || g.includes("bảo hành")) return <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />;
    return <Sliders size={16} className="text-zinc-600 dark:text-zinc-400" />;
  };

  // Group specifications by group name
  const groupedSpecs = specifications.reduce<{ groupName: string; items: (SpecFormItem & { globalIdx: number })[] }[]>(
    (acc, spec, globalIdx) => {
      const gName = spec.specGroup?.trim() || "Thông số chung";
      let existingGroup = acc.find((g) => g.groupName === gName);
      if (!existingGroup) {
        existingGroup = { groupName: gName, items: [] };
        acc.push(existingGroup);
      }
      existingGroup.items.push({ ...spec, globalIdx });
      return acc;
    },
    []
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Tên sản phẩm không được để trống!");
      if (!categoryId) throw new Error("Vui lòng chọn danh mục cho sản phẩm!");

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
          v.attributes.forEach((attr) => {
            if (attr.key.trim() && attr.value.trim()) {
              attributes[attr.key.trim()] = attr.value.trim();
            }
          });

          return {
            attributes,
            price: Number(v.price),
            stock: Number(v.stock),
            vatPercent: Number(v.vatPercent),
            image: v.image || undefined,
          };
        }),
      };

      const res: any = id
        ? await adminProductService.update(id, payload)
        : await adminProductService.create(payload);

      const targetId = id || res?.data?.id || res?.id;

      if (targetId && specifications.length > 0) {
        const specsPayload = specifications
          .filter((s) => s.specValue.trim() !== "" && (s.attributeKeyId || s.attributeName.trim() !== ""))
          .map((s) => ({
            attributeKeyId: s.attributeKeyId ? Number(s.attributeKeyId) : undefined,
            attributeName: s.attributeKeyId ? undefined : s.attributeName.trim(),
            newDisplayName: s.attributeDisplayName || undefined,
            newUnit: s.specUnit || undefined,
            specGroup: s.specGroup.trim() || "Thông số chung",
            specValue: s.specValue.trim(),
            specUnit: s.specUnit ? s.specUnit.trim() : undefined,
          }));

        if (specsPayload.length > 0) {
          await adminProductService.updateSpecifications(targetId, specsPayload);
        }
      }
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
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-16">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
            <button onClick={() => router.back()} className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
              <ArrowLeft size={14} /> Quản lý sản phẩm
            </button>
            <span>/</span>
            <span className="text-zinc-900 dark:text-white font-semibold">{id ? "Chỉnh sửa" : "Tạo mới"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {id ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-5 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xs disabled:opacity-50"
          >
            {saveMutation.isPending ? "Đang lưu..." : id ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
        
        {/* BLOCK 1: THÔNG TIN CƠ BẢN */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xs">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" /> 1. Thông tin chung sản phẩm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Laptop ASUS Zenbook 14 / iPhone 16 Pro Max..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Danh mục sản phẩm <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Thương hiệu (Brand)
              </label>
              <input
                type="text"
                placeholder="VD: ASUS, Apple, Samsung, DJI..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Origin */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Xuất xứ sản phẩm
              </label>
              <input
                type="text"
                placeholder="VD: Chính hãng Việt Nam"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Warranty Months */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <ShieldCheck size={14} className="text-zinc-400" /> Thời gian bảo hành (Tháng)
              </label>
              <input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Thumbnail Image URL & File Upload Picker */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Upload size={14} className="text-zinc-400" /> Ảnh đại diện sản phẩm (Thumbnail)</span>
                <span className="text-[11px] text-zinc-400 font-mono">Dán URL hoặc tải từ máy</span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="url"
                  placeholder="https://... dán đường dẫn URL ảnh"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                
                <label className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shrink-0">
                  <Upload size={14} /> Tải file ảnh
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
                <div className="mt-2 relative w-20 h-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-1 group overflow-hidden">
                  <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-xs hover:bg-red-700 transition-colors"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mô tả chi tiết sản phẩm
              </label>
              <textarea
                rows={4}
                placeholder="Nhập mô tả chi tiết sản phẩm, ưu điểm nổi bật..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

          </div>
        </div>

        {/* BLOCK 2: DYNAMIC VARIANTS & ATTRIBUTES FORM */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> 2. Biến thể & Cấu hình tùy chọn
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Định nghĩa màu sắc, dung lượng, giá bán và tồn kho tương ứng cho từng biến thể bán hàng.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariantRow}
              className="px-3.5 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} /> Thêm biến thể
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((v, vIdx) => (
              <div
                key={vIdx}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-700/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md">
                      Phiên bản #{vIdx + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {v.attributes.map((a) => a.value).filter(Boolean).join(" · ") || "Chưa đặt thuộc tính"}
                    </span>
                  </div>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(vIdx)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} /> Xóa phiên bản
                    </button>
                  )}
                </div>

                {/* Price, Stock, VAT, Image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Giá bán (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={v.price}
                      onChange={(e) => updateVariantField(vIdx, "price", Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Số lượng tồn kho <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={v.stock}
                      onChange={(e) => updateVariantField(vIdx, "stock", Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 font-mono font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* VAT */}
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Thuế VAT (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={v.vatPercent}
                      onChange={(e) => updateVariantField(vIdx, "vatPercent", Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Variant Image URL */}
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      URL Ảnh riêng (Màu)
                    </label>
                    <input
                      type="text"
                      placeholder="URL ảnh riêng..."
                      value={v.image || ""}
                      onChange={(e) => updateVariantField(vIdx, "image", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Dynamic Attributes Grid */}
                <div className="space-y-2 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Tag size={13} className="text-indigo-500" /> Thuộc tính phân loại:
                    </span>

                    {/* Quick Add Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      <span className="text-zinc-400 mr-0.5">Thêm nhanh:</span>
                      {["Color", "Dung lượng", "RAM", "CPU", "SSD", "Phiên bản"].map((presetKey) => (
                        <button
                          key={presetKey}
                          type="button"
                          onClick={() => addVariantAttribute(vIdx, presetKey)}
                          className="px-2 py-0.5 bg-zinc-200/70 dark:bg-zinc-700 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 font-medium rounded text-[10px] transition-colors"
                        >
                          + {presetKey}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addVariantAttribute(vIdx, "")}
                        className="px-2 py-0.5 bg-indigo-600 text-white font-medium rounded text-[10px] hover:bg-indigo-700 transition-colors"
                      >
                        + Tùy chỉnh
                      </button>
                    </div>
                  </div>

                  {v.attributes.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic p-3 border border-dashed border-zinc-200 dark:border-zinc-700 text-center rounded-lg">
                      Chưa có thuộc tính. Bấm nút "+ Tùy chỉnh" để thêm.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {v.attributes.map((attr, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xs"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Thuộc tính"
                            value={attr.key}
                            onChange={(e) => updateVariantAttribute(vIdx, aIdx, "key", e.target.value)}
                            className="w-1/3 rounded border border-zinc-200 dark:border-zinc-700 p-1 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Giá trị"
                            value={attr.value}
                            onChange={(e) => updateVariantAttribute(vIdx, aIdx, "value", e.target.value)}
                            className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 p-1 text-xs font-medium bg-white dark:bg-zinc-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantAttribute(vIdx, aIdx)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                            title="Xóa thuộc tính"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* BLOCK 3: THÔNG SỐ KỸ THUẬT CHI TIẾT (REFACTORED GROUPED EAV SPECIFICATIONS) */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-xs">
          
          {/* Section Header & Global Action Tools */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" /> 3. Thông số kỹ thuật chi tiết
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Thông số kỹ thuật EAV hiển thị trên trang thông tin sản phẩm.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={autoFillFromVariants}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                title="Tự động đồng bộ các giá trị thuộc tính từ Biến thể #1"
              >
                <Sparkles size={13} className="text-amber-500" /> Lấy từ Biến thể #1
              </button>
              
              <button
                type="button"
                onClick={autoFillTemplate}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                title="Tự động điền khung danh sách các thông số Laptop chuẩn"
              >
                <ListPlus size={13} className="text-indigo-500" /> Mẫu khung Laptop
              </button>

              <button
                type="button"
                onClick={openAddGroupModal}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FolderPlus size={14} /> Tạo nhóm mới
              </button>
            </div>
          </div>

          {/* Empty State */}
          {specifications.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl space-y-3">
              <Sliders size={28} className="mx-auto text-zinc-400" />
              <p className="text-xs font-medium text-zinc-500">Chưa có thông số kỹ thuật nào.</p>
              
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={autoFillTemplate}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                >
                  <ListPlus size={13} /> Nạp mẫu Laptop
                </button>
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={13} /> Thêm dòng mới
                </button>
              </div>
            </div>
          ) : (
            
            /* Grouped Spec Cards Container */
            <div className="space-y-4">
              {groupedSpecs.map((group, groupIdx) => (
                <div key={groupIdx} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 rounded-xl overflow-hidden space-y-2">
                  
                  {/* Group Card Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      {getGroupIcon(group.groupName)}
                      <span className="font-bold text-xs text-zinc-900 dark:text-white">
                        {group.groupName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full font-mono">
                        {group.items.length} thuộc tính
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openRenameGroupModal(group.groupName)}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        title="Đổi tên nhóm"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSpecGroup(group.groupName)}
                        className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                        title="Xóa nhóm này"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => addSpecToGroup(group.groupName)}
                        className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                      >
                        <Plus size={12} /> Thêm
                      </button>
                    </div>
                  </div>

                  {/* Group Items Rows */}
                  <div className="p-3 space-y-2">
                    {group.items.map((spec) => {
                      const globalIdx = spec.globalIdx;
                      return (
                        <div key={globalIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xs">
                          
                          {/* Attribute Name / Key Selector */}
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-400 block">Tên thuộc tính</label>
                            <div className="flex items-center gap-1.5">
                              {attributeKeys.length > 0 && (
                                <select
                                  value={spec.attributeKeyId || ""}
                                  onChange={(e) => handleSelectAttributeKey(globalIdx, e.target.value)}
                                  className="border border-zinc-300 dark:border-zinc-700 p-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-900 rounded-md focus:outline-none focus:border-indigo-500 shrink-0 max-w-[120px]"
                                  title="Từ điển"
                                >
                                  <option value="">Từ điển...</option>
                                  {attributeKeys.map((k: any) => (
                                    <option key={k.id} value={k.id}>
                                      {k.displayName || k.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                placeholder="VD: CPU, RAM..."
                                value={spec.attributeName}
                                onChange={(e) => {
                                  updateSpecField(globalIdx, "attributeKeyId", undefined);
                                  updateSpecField(globalIdx, "attributeName", e.target.value);
                                }}
                                className="flex-1 border border-zinc-300 dark:border-zinc-700 p-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 rounded-md focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Spec Value */}
                          <div className="md:col-span-5 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-400 block">Giá trị <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="VD: Intel Core Ultra 7 155H"
                              value={spec.specValue}
                              onChange={(e) => updateSpecField(globalIdx, "specValue", e.target.value)}
                              className="w-full border border-zinc-300 dark:border-zinc-700 p-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 rounded-md focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Spec Unit */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-400 block">Đơn vị</label>
                            <input
                              type="text"
                              placeholder="GB, Hz..."
                              value={spec.specUnit || ""}
                              onChange={(e) => updateSpecField(globalIdx, "specUnit", e.target.value)}
                              className="w-full border border-zinc-300 dark:border-zinc-700 p-1.5 text-xs font-mono bg-white dark:bg-zinc-800 rounded-md focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Delete button */}
                          <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-3">
                            <button
                              type="button"
                              onClick={() => removeSpecRow(globalIdx)}
                              className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                              title="Xóa thuộc tính này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-2.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xs disabled:opacity-50"
          >
            {saveMutation.isPending ? "Đang lưu..." : id ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </button>
        </div>

      </form>

      {/* GROUP MANAGEMENT DIALOG MODAL */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <FolderPlus className="w-5 h-5 text-indigo-600" />
              <span>{groupModalMode === "ADD" ? "Tạo nhóm thông số mới" : "Đổi tên nhóm thông số"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGroupModalSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tên nhóm thông số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="VD: Âm thanh & Web Camera, Kết nối..."
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Quick Suggestions for Group Name */}
            {groupModalMode === "ADD" && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-400">Gợi ý tên nhóm phổ biến:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SPEC_GROUPS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGroupNameInput(g)}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 text-xs font-medium rounded-md transition-colors"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                {groupModalMode === "ADD" ? "Tạo nhóm" : "Cập nhật"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
