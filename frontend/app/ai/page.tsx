"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  ArrowUp,
  MessageSquare,
  Bot,
  User,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8001";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: Array<{ id: string; text: string; score: number }>;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  status: string;
  started_at: string;
  message_count: number;
  last_message?: string;
}

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mock user ID (replace with real auth)
  const userId = "mock-user-123";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const createConversation = async () => {
    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Cuộc trò chuyện mới" }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data.id);
        setMessages([]);
        await loadConversations();
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(id);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa cuộc trò chuyện này?")) return;

    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (currentConversation === id) {
          setCurrentConversation(null);
          setMessages([]);
        }
        await loadConversations();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Create conversation if none selected
      let convId = currentConversation;
      if (!convId) {
        const convRes = await fetch(`${AI_API_URL}/chat/conversations?user_id=${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userMessage.content.substring(0, 30) }),
        });

        if (convRes.ok) {
          const convData = await convRes.json();
          convId = convData.id;
          setCurrentConversation(convId);
          await loadConversations();
        }
      }

      // Send message
      const params = new URLSearchParams();
      if (convId) params.append("conversation_id", convId);
      params.append("user_id", userId);

      const res = await fetch(`${AI_API_URL}/chat?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        confidence: data.confidence,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation list
      await loadConversations();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestions = [
    { text: "Tư vấn laptop gaming", query: "Tư vấn laptop gaming tầm 25 triệu" },
    { text: "So sánh iPhone và Samsung", query: "So sánh iPhone 16 và Samsung S24" },
    { text: "Laptop cho sinh viên", query: "Laptop nào phù hợp cho sinh viên?" },
    { text: "Phụ kiện điện thoại", query: "Gợi ý phụ kiện điện thoại dưới 1 triệu" },
  ];

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 border-r border-zinc-200 bg-white flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200">
          <button
            onClick={createConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus size={18} />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors ${
                  currentConversation === conv.id ? "bg-zinc-100" : ""
                }`}
              >
                <MessageSquare size={16} className="text-zinc-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-zinc-500">
                    {conv.message_count} tin nhắn
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-100 rounded-lg"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-blue-600" />
            <span className="font-medium">ShopWise AI</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Bot size={48} className="text-zinc-300 mb-4" />
              <h2 className="text-xl font-medium text-zinc-600 mb-2">
                Chào mừng đến với ShopWise AI
              </h2>
              <p className="text-zinc-500 mb-8">
                Hỏi tôi bất cứ điều gì về sản phẩm công nghệ
              </p>

              {/* Suggestions */}
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(s.query);
                      inputRef.current?.focus();
                    }}
                    className="p-3 text-left text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-blue-600" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-black text-white"
                        : "bg-white border border-zinc-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-200">
                        <p className="text-xs text-zinc-500 mb-2">Nguồn tham khảo:</p>
                        {msg.sources.slice(0, 2).map((s, i) => (
                          <p key={i} className="text-xs text-zinc-600 truncate">
                            • {s.text}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Confidence */}
                    {msg.confidence && (
                      <p className="mt-2 text-xs text-zinc-400">
                        Độ tin cậy: {(msg.confidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-zinc-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot size={16} className="text-blue-600" />
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3">
                    <Loader2 size={16} className="animate-spin text-zinc-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-zinc-200 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập câu hỏi..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-3 bg-black text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowUp size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
