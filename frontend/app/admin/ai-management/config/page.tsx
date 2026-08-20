"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Save, RefreshCw, Settings, Bot, Brain, Zap, Database } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface SystemConfig {
  gemini_model: string;
  gemini_temperature: number;
  top_k: number;
  rerank_top_k: number;
  rrf_k: number;
  embedding_model: string;
  embedding_device: string;
  embedding_batch_size: number;
  reranker_model: string;
  reranker_device: string;
  nlu_confidence_threshold: number;
}

async function fetchConfig(): Promise<SystemConfig> {
  const res = await fetch(`${API_URL}/admin/config`);
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

async function updateConfig(updates: Partial<SystemConfig>) {
  const res = await fetch(`${API_URL}/admin/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update config");
  return res.json();
}

export default function ConfigPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["rag-config"],
    queryFn: fetchConfig,
  });

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-config"] });
      setHasChanges(false);
      alert("Cập nhật cấu hình thành công!");
    },
  });

  const handleChange = (field: keyof SystemConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!config) return;
    updateMutation.mutate({
      gemini_model: config.gemini_model,
      gemini_temperature: config.gemini_temperature,
      top_k: config.top_k,
      rerank_top_k: config.rerank_top_k,
      embedding_batch_size: config.embedding_batch_size,
      nlu_confidence_threshold: config.nlu_confidence_threshold,
    });
  };

  if (isLoading || !config) {
    return (
      <section>
        <h1 className="text-[28px] font-medium">Cấu hình Hệ thống</h1>
        <p className="mt-4 text-zinc-500">Đang tải...</p>
      </section>
    );
  }

  const sections = [
    {
      title: "LLM (Gemini)",
      icon: Bot,
      fields: [
        {
          label: "Model",
          key: "gemini_model",
          type: "select",
          options: ["gemini-3.1-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"],
        },
        {
          label: "Temperature",
          key: "gemini_temperature",
          type: "range",
          min: 0,
          max: 1,
          step: 0.1,
        },
      ],
    },
    {
      title: "Retrieval",
      icon: Zap,
      fields: [
        { label: "Top K", key: "top_k", type: "number", min: 1, max: 50 },
        { label: "Rerank Top K", key: "rerank_top_k", type: "number", min: 1, max: 20 },
        { label: "RRF K (read-only)", key: "rrf_k", type: "number", disabled: true },
      ],
    },
    {
      title: "Embedding",
      icon: Database,
      fields: [
        { label: "Model (read-only)", key: "embedding_model", type: "text", disabled: true },
        { label: "Device (read-only)", key: "embedding_device", type: "text", disabled: true },
        { label: "Batch Size", key: "embedding_batch_size", type: "number", min: 1, max: 64 },
      ],
    },
    {
      title: "NLU",
      icon: Brain,
      fields: [
        {
          label: "Confidence Threshold",
          key: "nlu_confidence_threshold",
          type: "range",
          min: 0,
          max: 1,
          step: 0.05,
        },
      ],
    },
  ];

  return (
    <section>
      {/* Header */}
      <div className="border-b border-black pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium">Cấu hình Hệ thống</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Cấu hình các tham số của RAG system
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-zinc-800 disabled:opacity-50"
        >
          <Save size={16} />
          {updateMutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>

      {/* Config Sections */}
      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="border border-black bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <section.icon size={20} className="text-zinc-600" />
              <h2 className="text-lg font-medium">{section.title}</h2>
            </div>

            <div className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-zinc-600">{field.label}</label>
                  <div className="col-span-2">
                    {field.type === "select" ? (
                      <select
                        value={(config as any)[field.key]}
                        onChange={(e) => handleChange(field.key as keyof SystemConfig, e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded text-sm"
                      >
                        {(field as any).options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "range" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={(field as any).min}
                          max={(field as any).max}
                          step={(field as any).step}
                          value={(config as any)[field.key]}
                          onChange={(e) => handleChange(field.key as keyof SystemConfig, parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-mono w-12 text-right">
                          {(config as any)[field.key]}
                        </span>
                      </div>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        min={(field as any).min}
                        max={(field as any).max}
                        value={(config as any)[field.key]}
                        onChange={(e) => handleChange(field.key as keyof SystemConfig, parseInt(e.target.value))}
                        disabled={(field as any).disabled}
                        className="w-full px-3 py-2 border border-zinc-300 rounded text-sm disabled:bg-zinc-100"
                      />
                    ) : (
                      <input
                        type="text"
                        value={(config as any)[field.key]}
                        disabled={(field as any).disabled}
                        className="w-full px-3 py-2 border border-zinc-300 rounded text-sm disabled:bg-zinc-100"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
