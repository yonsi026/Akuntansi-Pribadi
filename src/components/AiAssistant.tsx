import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  BrainCircuit, 
  User, 
  UserCheck,
  AlertCircle
} from "lucide-react";
import { ChatMessage, FinancialStats, Transaction, StockItem, StoreConfig } from "../types";

interface AiAssistantProps {
  stats: FinancialStats;
  transactions: Transaction[];
  stockItems: StockItem[];
  storeConfig?: StoreConfig;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  stats,
  transactions,
  stockItems,
  storeConfig
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Halo! Saya **AKUNTAN AI**, konsultan keuangan pribadi khusus untuk bisnis **${storeConfig?.storeName || "Toko Anda"}** di **${storeConfig?.storeCity || "Indonesia"}**. 🇮🇩\n\nSaya menguasai akuntansi berpasangan, analisis HPP, dan kepatuhan SAK EMKM. Saya bisa membantu Anda:\n- **Mengaudit kesehatan keuangan** toko secara langsung.\n- **Mengevaluasi margins produk** (${storeConfig?.demoProducts.map(p => p.name).join(", ") || "produk contoh"}).\n- **Merancang rencana PPh Final 0.5%** yang aman.\n\nKlik tombol **Audit Kesehatan Toko** di bawah ini untuk melihat ulasan instan bertenaga AI, atau ketik langsung pertanyaan Anda di bawah!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [auditSummary, setAuditSummary] = useState<string>("");
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to lowest chat message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Serializes the current active state for context
  const getContextSnapshot = () => {
    return {
      totalTransactions: transactions.length,
      revenue: stats.revenue,
      expenses: stats.expenses,
      hpp: stats.hpp,
      netProfit: stats.netProfit,
      pphEstimate: stats.pph,
      totalStockItems: stockItems.length,
      storeProfile: storeConfig ? {
        storeName: storeConfig.storeName,
        storeType: storeConfig.storeType,
        storeCity: storeConfig.storeCity,
        reportPeriod: storeConfig.reportPeriod,
        taxRate: storeConfig.taxRate,
        customDemoProducts: storeConfig.demoProducts.map(p => ({
          name: p.name,
          sku: p.sku,
          avgPurchasePrice: p.avgPurchasePrice,
          sellPrice: p.sellPrice,
          unit: p.unit
        }))
      } : null
    };
  };

  // Helper to send query to Express backend
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          contextData: getContextSnapshot()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.content) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || "Gagal menghubungkan ke server.");
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Maaf, saya mengalami kesulitan teknis menghubungi server. Pastikan server dev telah di-restart dan API Key terkonfigurasi dengan benar.",
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Triggers deep financial audit using the specialized /api/analyze hook
  const handleTriggerDeepAudit = async () => {
    if (auditLoading) return;
    setAuditLoading(true);
    setAuditSummary("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financeState: {
            transactions,
            stockItems,
            stats,
            storeConfig
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.analysis) {
        setAuditSummary(data.analysis);
      } else {
        throw new Error(data.error || "Sistem audit sedang kendala.");
      }
    } catch (err: any) {
      console.error(err);
      setAuditSummary("⚠️ Gagal menyusun audit bisnis otomatis. Mohon coba sesaat lagi, atau ketik langsung keluhan Anda di chat asisten.");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="ai-tab-view">
      {/* LEFT COLUMN: Conversational Chat */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Chat header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-indigo-400 font-mono">Asisten Konsultasi</h3>
              <h4 className="text-sm font-bold text-white font-sans">Sesi Konseling Akuntan AI</h4>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded-full uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            Online
          </span>
        </div>

        {/* Chat Message Box List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                </div>

                {/* Bubble speech */}
                <div className={`p-4 rounded-2xl text-xs space-y-1.5 border leading-relaxed ${
                  isUser 
                    ? 'bg-slate-900 border-slate-950 text-white rounded-tr-none' 
                    : 'bg-white border-slate-100 text-slate-800 rounded-tl-none shadow-xs'
                }`}>
                  {/* Formatted markdown text simulator */}
                  <div className="whitespace-pre-wrap select-text font-medium font-sans">
                    {msg.content}
                  </div>
                  <span className={`block text-[9px] text-right font-mono ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold">Akuntan AI sedang menelaah pembukuan...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips and message type bar */}
        <div className="p-3 border-t border-slate-100 bg-white space-y-3">
          {/* Quick Suggestion Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 select-none text-[10px] font-bold">
            <button
              onClick={() => handleSendMessage("Bagaimana tips supaya bisnis toko kelontong saya tidak boncos (untung optimal)?")}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-full px-3 py-1.5 shrink-0 transition"
            >
              💡 Tips Untung Berkelanjutan
            </button>
            <button
              onClick={() => handleSendMessage("Tolong jelaskan secara sederhana apa itu SAK EMKM dan bagaimana cara saya mematuhinya.")}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-full px-3 py-1.5 shrink-0 transition"
            >
              📘 Pengertian SAK EMKM
            </button>
            <button
              onClick={() => handleSendMessage("Berapa batas omzet bebas PPh Final 0.5% untuk UMKM di Indonesia?")}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-full px-3 py-1.5 shrink-0 transition"
            >
              🇮🇩 Aturan Bebas Pajak No 500 Juta
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tanyakan analisis keuangan, aturan pajak Indonesia, atau jurnal..."
              value={inputMessage}
              disabled={loading}
              onKeyPress={handleKeyPress}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none disabled:bg-slate-50 font-sans"
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={loading || !inputMessage.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white p-3 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Deep Financial Diagnosis & Audit */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Audit Finansial Otomatis</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Biarkan kecerdasan buatan menyerap seluruh riwayat jurnal transaksi, nilai persediaan stok aktif, dan pajak terhitung Anda, kemudian menyusun laporan kesehatan bisnis instan.
          </p>

          {/* Audit Result Display Container */}
          {auditSummary ? (
            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-xs text-slate-800 space-y-3 max-h-[300px] overflow-y-auto leading-relaxed font-sans">
              <span className="font-bold text-[11px] text-amber-900 block">Hasil Laporan Audit AI:</span>
              <div className="whitespace-pre-wrap select-text">{auditSummary}</div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl py-12 px-4 text-center text-slate-400 space-y-2">
              <BrainCircuit className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-xs font-semibold">Diagnosis Belum Berjalan</p>
              <p className="text-[10px]">Klik tombol di bawah untuk meminta AI memeriksa seluruh pembukuan Anda secara instan.</p>
            </div>
          )}
        </div>

        {/* Audit Button Trigger */}
        <button
          onClick={handleTriggerDeepAudit}
          disabled={auditLoading || transactions.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition text-xs shadow-xs"
        >
          {auditLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Mengaudit Pembukuan...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Audit Kesehatan Toko (AI)
            </>
          )}
        </button>
        {transactions.length === 0 && (
          <p className="text-[10px] text-slate-400 text-center leading-normal">
            *Memerlukan minimal 1 transaksi dalam jurnal untuk audit
          </p>
        )}
      </div>
    </div>
  );
};
