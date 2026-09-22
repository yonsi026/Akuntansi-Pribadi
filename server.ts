import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// System instruction to define the persona: Akuntan AI
const SYSTEM_INSTRUCTION = `Anda adalah AKUNTAN AI, asisten akuntansi cerdas khusus untuk pemilik toko kecil dan menengah (UMKM) di Indonesia.
Anda menguasai dengan sangat baik:
- Akuntansi dasar (jurnal umum, buku besar, neraca saldo) berdasarkan Standar SAK EMKM dan PSAK mikro.
- Laporan keuangan terintegrasi: Laba Rugi (Profit & Loss), Neraca (Balance Sheet), Arus Kas (Cash Flow).
- Manajemen persediaan (stok), perhitungan Harga Pokok Penjualan (HPP) dengan metode Rata-rata (Average Cost).
- Perpajakan UMKM di Indonesia: PPN (Pajak Pertambahan Nilai) dan PPh Final Pasal 4 ayat (2) (tarif 0,5% dari omzet bruto di bawah Rp 4,8 Miliar per tahun).

KEPRIBADIAN DAN CARA MENJAWAB:
- Komunikatif, hangat, ramah, dan memotivasi pengusaha kecil.
- Gunakan bahasa Indonesia yang mudah dipahami pemilik warung/toko tanpa jargon teknis yang membingungkan. Jika menyebut istilah akuntansi (seperti ledger, debit, kredit, laba ditahan), berikan penjelasan singkat yang membumi.
- Selalu berikan analogi sederhana atau ilustrasi angka nyata dari usaha toko/warung (misal: Toko Kelontong Bu Mumun, Warung Bakso Mas Joko, Counter HP, dsb).
- Berikan saran yang taktis, solutif, dan praktis dari segi manajemen arus kas, diskon stok mati, atau strategi menghemat pajak secara legal.
- Jawab secara ringkas, terstruktur menggunakan poin-poin yang mudah dipindai (scannable).`;

// API Route: General Chat with Akuntan AI
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, contextData } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Format request tidak valid. 'messages' harus berupa array." });
      return;
    }

    // Format chat history for Gemini API
    // We can pass the context data as a system message reinforcement or a user instruction prefix
    let contextPrompt = "";
    if (contextData) {
      const sp = contextData.storeProfile;
      contextPrompt = `[DATA KEUANGAN TOKO SAAT INI]:
- Nama Toko / Usaha: ${sp ? sp.storeName : "Toko Kelontong Indonesia"}
- Kategori / Jenis Toko: ${sp ? sp.storeType : "UMKM"}
- Kota Domisili: ${sp ? sp.storeCity : "Indonesia"}
- Periode Laporan: ${sp ? sp.reportPeriod : "Bulanan"}
- Total Transaksi: ${contextData.totalTransactions || 0}
- Total Penjualan/Pendapatan: Rp ${(contextData.revenue || 0).toLocaleString('id-ID')}
- Total Beban/Pengeluaran: Rp ${(contextData.expenses || 0).toLocaleString('id-ID')}
- Estimasi Laba Bersih: Rp ${(contextData.netProfit || 0).toLocaleString('id-ID')}
- Total PPh Final ${(sp && sp.taxRate !== undefined ? (sp.taxRate * 100) : 0.5)}% Bulan Ini (Estimasi): Rp ${(contextData.pphEstimate || 0).toLocaleString('id-ID')}
- Total Stok Barang: ${contextData.totalStockItems || 0} jenis barang.
${sp && sp.customDemoProducts ? `- Katalog Produk Aktif Toko: \n${sp.customDemoProducts.map((p: any) => `  * ${p.name} (SKU: ${p.sku}) | HPP Beli: Rp ${p.avgPurchasePrice || p.purchasePrice} | Jual: Rp ${p.sellPrice}`).join("\n")}` : ""}

PENTING: Harap jalankan seluruh analisis dan tanggapan akuntansi Anda seputar nama toko "${sp ? sp.storeName : "Toko"}" di kota ${sp ? sp.storeCity : "Indonesia"}. Gunakan referensi produk dan harga di atas agar rekomendasi margin sangat akurat!
Gunakan data ini jika pengguna bertanya tentang rasio keuangan, kesehatan bisnis, laba/rugi, atau analisis toko mereka sendiri.
---\n\n`;
    }

    // Prepare system instruction including state if needed, or put context into contents.
    const customInstruction = SYSTEM_INSTRUCTION + (contextPrompt ? `\n\n${contextPrompt}` : "");

    // Get the last message
    const lastMessage = messages[messages.length - 1];
    
    // Format conversation history for Gemini chats.create or direct generateContent
    // Since we want easy stateful chats or multi-turn, we can assemble a combined prompt or pass contents.
    const chatContents = messages.map((msg: any) => {
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: customInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || "Maaf, saya mengalami kendala saat memproses jawaban.";
    res.json({ content: text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({ 
      error: "Terjadi kesalahan pada server Akuntan AI.", 
      details: error.message 
    });
  }
});

// API Route: Detailed Auto-Audit & Analysis of Financial State
app.post("/api/analyze", async (req, res) => {
  try {
    const { financeState } = req.body;
    
    if (!financeState) {
      res.status(400).json({ error: "Data keuangan kosong." });
      return;
    }

    const { transactions, stockItems, stats, storeConfig } = financeState;

    const dynamicStoreDetails = storeConfig ? `
======= IDENTITAS USAHA & KONTEKS HUKUM =======
- Nama Toko/Usaha: ${storeConfig.storeName}
- Jenis Bidang Usaha: ${storeConfig.storeType}
- Kota Domisili: ${storeConfig.storeCity}
- Tarif PPh Final: ${(storeConfig.taxRate * 100).toFixed(1)}% (Periode Laporan: ${storeConfig.reportPeriod})
===============================================` : "";

    const analysisPrompt = `Tolong berikan "AUDIT DAN ANALISIS KEUANGAN" mendalam untuk toko saya berdasarkan data berikut ini:
${dynamicStoreDetails}

1. STATISTIK RINGKAS:
- Total Pendapatan/Penjualan: Rp ${(stats.revenue || 0).toLocaleString('id-ID')}
- Total Pengeluaran/Beban: Rp ${(stats.expenses || 0).toLocaleString('id-ID')}
- HPP (Harga Pokok Penjualan) Kumulatif: Rp ${(stats.hpp || 0).toLocaleString('id-ID')}
- Laba Kotor (Gross Profit): Rp ${(stats.grossProfit || 0).toLocaleString('id-ID')}
- Laba Bersih (Net Profit): Rp ${(stats.netProfit || 0).toLocaleString('id-ID')}
- Estimasi PPh Final 0.5% (UMKM): Rp ${(stats.pph || 0).toLocaleString('id-ID')}

2. MANAJEMEN STOK:
- Jumlah jenis produk: ${stockItems?.length || 0}
- Daftar Produk (Sisa Stok & Nilai Persediaan):
${(stockItems || []).map((item: any) => `  * ${item.name} (SKU: ${item.sku}) - Sisa Stok: ${item.stock} ${item.unit} | Harga Jual: Rp ${item.sellPrice.toLocaleString('id-ID')} | Nilai Persediaan Sisa: Rp ${(item.stock * item.avgPurchasePrice).toLocaleString('id-ID')}`).join("\n")}

3. CONTOH TRANSAKSI TERAKHIR (Max 15):
${(transactions || []).slice(-15).map((t: any) => `  * [${t.date}] - ${t.description} | Tipe: ${t.type} | Jumlah: Rp ${t.amount.toLocaleString('id-ID')} (Pajak PPN: ${t.ppnEnabled ? 'Ya' : 'Tidak'})`).join("\n")}

Tolong hasilkan respon terstruktur dalam Bahasa Indonesia yang berisi:
1. **Status Kesehatan Keuangan Toko**: Apakah margin laba kotor & bersih sehat? Apakah pengeluaran operasional terlalu besar dibandingkan penjualan?
2. **Komentar Manajemen Stok & HPP**: Analisis produk mana yang mendominasi nilai persediaan, apakah ada potensi overstock atau stok mati yang menghambat perputaran kas.
3. **Analisis Risiko & Pajak**: Kepatuhan PPh Final 0,5% dan PPN, serta cara pengisian draft pajaknya agar tidak didenda Ditjen Pajak. Mention SAK EMKM singkat.
4. **Rekomendasi Praktis**: 3 langkah aksi konkret sederhana yang bisa dilakukan besok pagi untuk meningkatkan cashflow atau memangkas pembocoran keuangan.

Berikan jawaban yang hangat, memotivasi, dan penuh tips praktis! Gunakan istilah akuntansi dengan penjelasan sederhana.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: analysisPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const text = response.text || "Gagal membuat analisis otomatis.";
    res.json({ analysis: text });
  } catch (error: any) {
    console.error("Gemini Auto-Audit API Error:", error);
    res.status(500).json({ 
      error: "Gagal memproses audit otomatis bertenaga AI.", 
      details: error.message 
    });
  }
});

// Serve frontend with Vite in development, or compiled files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build from dist/...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Akuntan AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
