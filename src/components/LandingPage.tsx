import React, { useState, useRef, useEffect } from "react";
import { 
  Coins, 
  BookOpen, 
  Boxes, 
  FileSpreadsheet, 
  Percent, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Store, 
  User, 
  MapPin, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  TrendingUp, 
  UploadCloud, 
  FileText,
  AlertCircle
} from "lucide-react";
import { UserAccount } from "../types";
import { authenticateUser, registerNewUser, loginAsDemo, DEFAULT_DEMO_USER } from "../utils/authService";

interface LandingPageProps {
  onLoginSuccess: (user: UserAccount, isNewRegistration?: boolean) => void;
  initialAuthMode?: "login" | "register" | "demo";
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, initialAuthMode = "login" }) => {
  const [authMode, setAuthMode] = useState<"login" | "register" | "demo">(initialAuthMode);
  const authSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialAuthMode) {
      setAuthMode(initialAuthMode);
    }
  }, [initialAuthMode]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState<string>("admin@toko.id");
  const [loginPassword, setLoginPassword] = useState<string>("password123");
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Register form state
  const [regName, setRegName] = useState<string>("");
  const [regStoreName, setRegStoreName] = useState<string>("");
  const [regStoreType, setRegStoreType] = useState<string>("Toko Kelontong & Sembako");
  const [regStoreCity, setRegStoreCity] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regUsername, setRegUsername] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>("");
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState<boolean>(false);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const scrollToAuth = (mode: "login" | "register" | "demo") => {
    setAuthMode(mode);
    authSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError("Silakan masukkan email atau username Anda.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Silakan masukkan kata sandi Anda.");
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      const res = authenticateUser(loginIdentifier, loginPassword);
      setLoginLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user, false);
      } else {
        setLoginError(res.error || "Gagal masuk. Periksa kembali informasi akun Anda.");
      }
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setLoginLoading(true);
    setLoginError(null);
    setTimeout(() => {
      const demoUser = loginAsDemo();
      setLoginLoading(false);
      onLoginSuccess(demoUser, false);
    }, 300);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError("Nama lengkap pemilik usaha wajib diisi.");
      return;
    }
    if (!regStoreName.trim()) {
      setRegError("Nama toko atau badan usaha wajib diisi.");
      return;
    }
    if (!regStoreCity.trim()) {
      setRegError("Kota/kabupaten domisili usaha wajib diisi.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError("Format email tidak valid.");
      return;
    }
    if (!regUsername.trim()) {
      setRegError("Username akun wajib diisi.");
      return;
    }
    if (regPassword.length < 4) {
      setRegError("Kata sandi minimal 4 karakter.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi kata sandi tidak sesuai.");
      return;
    }
    if (!agreeTerms) {
      setRegError("Anda harus menyetujui komitmen pembukuan SAK EMKM.");
      return;
    }

    setRegLoading(true);
    setTimeout(() => {
      const res = registerNewUser({
        name: regName,
        email: regEmail,
        username: regUsername,
        password: regPassword,
        storeName: regStoreName,
        storeType: regStoreType,
        storeCity: regStoreCity
      });
      setRegLoading(false);

      if (res.success && res.user) {
        // Automatically redirect new user to main accounting workspace with their store data
        onLoginSuccess(res.user, true);
      } else {
        setRegError(res.error || "Gagal mendaftarkan akun. Silakan coba kembali.");
      }
    }, 500);
  };

  const faqs = [
    {
      q: "Apa itu standar SAK EMKM dan mengapa penting untuk toko saya?",
      a: "SAK EMKM (Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah) diterbitkan oleh Ikatan Akuntan Indonesia (IAI). Standar ini dirancang sederhana agar laporan keuangan UMKM valid dan diakui perbankan saat pengajuan Kredit Usaha Rakyat (KUR) atau pembiayaan modal, serta memudahkan pelaporan SPT Pajak tahunan."
    },
    {
      q: "Apakah data transaksi dan persediaan toko saya aman?",
      a: "Sangat aman. Seluruh data transaksi, mutasi jurnal, dan stok toko disimpan secara lokal di peramban Anda dan tidak disebarluaskan. Anda juga dapat menghubungkannya dengan Google Spreadsheet pribadi Anda via fitur Cloud Sync."
    },
    {
      q: "Apakah aplikasi ini menghitung Pajak PPh Final UMKM secara otomatis?",
      a: "Ya! Aplikasi secara otomatis menghitung tarif PPh Final 0,5% sesuai PP No. 55/2022 dari total omzet bulanan, termasuk mencatat utang pajak dan menghasilkan kode rincian pembayaran."
    },
    {
      q: "Bagaimana cara mencetak laporan keuangan untuk keperluan bank atau audit?",
      a: "Tersedia modul Laporan Keuangan lengkap (Laba Rugi, Posisi Keuangan/Neraca, dan CALK) serta Buku Panduan Bagan Akun dengan fitur Cetak PDF berformat resmi A4 lengkap dengan Kop Surat dan kolom tanda tangan pimpinan."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 text-white p-2.5 rounded-xl flex items-center justify-center shadow-xs">
              <Coins className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-950">AKUNTAN AI</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  SAK EMKM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Sistem Pembukuan Pintar Toko &amp; UMKM Indonesia</p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-slate-950 transition-colors">Fitur Unggulan</a>
            <a href="#sak-emkm" className="hover:text-slate-950 transition-colors">Standar SAK EMKM</a>
            <a href="#testimoni" className="hover:text-slate-950 transition-colors">Kisah Sukses</a>
            <a href="#faq" className="hover:text-slate-950 transition-colors">Tanya Jawab</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToAuth("login")}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Masuk (User Lama)
            </button>
            <button
              onClick={() => scrollToAuth("register")}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>Daftar User Baru</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={handleQuickDemoLogin}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer"
              title="Coba langsung tanpa registrasi untuk mengetahui fitur"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Akun Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO & AUTH SPLIT SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-20 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Hero Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Unboxed Typographic Tag */}
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Terstandarisasi Ikatan Akuntan Indonesia (IAI)</span>
                <span aria-hidden="true" className="text-slate-300">&bull;</span>
                <span className="text-slate-600">PP 55/2022</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Pembukuan, Stok, &amp; Laporan Keuangan Toko Jadi{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">
                  Otomatis &amp; Akurat
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Aplikasi akuntansi cerdas khusus pengusaha UMKM, pedagang ritel, dan bisnis lokal. Otomatisasi jurnal dua sisi (double-entry), hitung harga pokok penjualan (HPP), neraca real-time, hingga siap cetak laporan untuk pengajuan modal bank.
              </p>

              {/* Quick Action Selector */}
              <div className="bg-slate-100/90 border border-slate-200 p-4 rounded-2xl space-y-2.5 max-w-xl shadow-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Pilih Akses untuk Membuka Aplikasi:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToAuth("login")}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 group-hover:text-indigo-600">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>User Lama</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Input data akun pribadi</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToAuth("register")}
                    className="p-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-left transition shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Store className="w-3.5 h-3.5 text-emerald-400" />
                      <span>User Baru</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5">Daftar toko &amp; buka AI</p>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-left transition shadow-2xs group cursor-pointer"
                    title="Masuk mode demo interaktif"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Akun Demo</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Hanya untuk tinjauan</p>
                  </button>
                </div>
              </div>

              {/* Key Benefits List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>18 Kode Akun Resmi SAK EMKM Standar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kalkulasi Otomatis Pajak PPh Final 0,5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kontrol Stok &amp; HPP Metode Rata-Rata</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sinkronisasi Google Sheets &amp; Cetak PDF Resmi</span>
                </div>
              </div>

              {/* Formula & Live Trust Highlight */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-4 max-w-lg">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PRINSIP DASAR NERACA</p>
                  <p className="text-sm font-mono font-bold text-slate-900">ASET = LIABILITAS + EKUITAS</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    100% Saldo Terimbang
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Unified Auth Card (Login / Register / Demo) */}
            <div className="lg:col-span-5" ref={authSectionRef}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                
                {/* Segmented Auth Tabs (3 Tabs) */}
                <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setLoginError(null);
                    }}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      authMode === "login" 
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/80" 
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span>Masuk (Lama)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setRegError(null);
                    }}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      authMode === "register" 
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/80" 
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Daftar (Baru)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("demo");
                    }}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      authMode === "demo" 
                        ? "bg-emerald-600 text-white shadow-xs" 
                        : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                    <span>Akun Demo</span>
                  </button>
                </div>

                {/* TAB 1: FORM LOGIN (USER LAMA) */}
                {authMode === "login" && (
                  <div className="p-6 sm:p-7 space-y-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-950">Masuk ke Akun Toko</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lanjutkan pencatatan transaksi dan pantau neraca bisnis Anda.
                      </p>
                    </div>

                    {loginError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email atau Username
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                          <input
                            type="text"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            placeholder="admin@toko.id atau admin"
                            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Kata Sandi
                          </label>
                          <span className="text-[11px] text-slate-400">Default: password123</span>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>Ingat saya di perangkat ini</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loginLoading ? (
                          <span>Memproses Masuk...</span>
                        ) : (
                          <>
                            <span>Masuk ke Halaman Utama</span>
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Quick Demo Login Option */}
                    <div className="pt-2">
                      <div className="relative flex items-center justify-center my-2.5">
                        <div className="border-t border-slate-200 w-full" />
                        <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
                          Hanya Ingin Mengetahui Fitur?
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleQuickDemoLogin}
                        className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Buka dengan Akun Demo (1-Klik Tanpa Daftar)</span>
                      </button>
                    </div>

                    <div className="text-center pt-0.5">
                      <p className="text-[11px] text-slate-500">
                        Belum punya akun toko?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("register")}
                          className="font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Daftar Akun Baru Sekarang
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: FORM DAFTAR (USER BARU) */}
                {authMode === "register" && (
                  <div className="p-6 sm:p-8 space-y-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-950">Daftarkan Toko Baru</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lengkapi data usaha Anda untuk mengaktifkan sistem pembukuan SAK EMKM.
                      </p>
                    </div>

                    {regError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Pemilik Usaha
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder="cth. Budi Santoso"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Toko / Usaha
                          </label>
                          <div className="relative">
                            <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={regStoreName}
                              onChange={(e) => setRegStoreName(e.target.value)}
                              placeholder="cth. Toko Berkah Mandiri"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Jenis Bidang Usaha
                          </label>
                          <select
                            value={regStoreType}
                            onChange={(e) => setRegStoreType(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                          >
                            <option value="Toko Kelontong & Sembako">Toko Kelontong & Sembako</option>
                            <option value="Minimarket & Retail">Minimarket & Retail</option>
                            <option value="Kafe & Restoran (F&B)">Kafe & Restoran (F&B)</option>
                            <option value="Fashion, Butik & Pakaian">Fashion, Butik & Pakaian</option>
                            <option value="Apotek & Toko Obat">Apotek & Toko Obat</option>
                            <option value="Bengkel & Toko Sparepart">Bengkel & Toko Sparepart</option>
                            <option value="Toko Elektronik & Handphone">Toko Elektronik & Handphone</option>
                            <option value="Jasa & Servis Profesional">Jasa & Servis Profesional</option>
                            <option value="Pabrikasi / Konveksi Rumahan">Pabrikasi / Konveksi Rumahan</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Kota / Domisili Usaha
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={regStoreCity}
                              onChange={(e) => setRegStoreCity(e.target.value)}
                              placeholder="cth. Surabaya, Bandung, dll"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="owner@tokosaya.com"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                            placeholder="tokosaya"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Kata Sandi
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                              type={showRegPassword ? "text" : "password"}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Min. 4 karakter"
                              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Konfirmasi Sandi
                          </label>
                          <input
                            type={showRegPassword ? "text" : "password"}
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Ulangi sandi"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                          />
                          <span>
                            Saya setuju menerapkan standar pembukuan SAK EMKM dan menyetujui penyimpanan data lokal yang aman di browser.
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={regLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                      >
                        {regLoading ? (
                          <span>Mendaftarkan &amp; Membuka Halaman Utama...</span>
                        ) : (
                          <>
                            <span>Daftarkan Toko &amp; Buka Halaman Utama AI</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center pt-2 space-y-1">
                      <p className="text-[11px] text-slate-500">
                        Sudah memiliki akun toko sebelumnya?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("login")}
                          className="font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Masuk di sini
                        </button>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Hanya ingin mencoba dulu?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("demo")}
                          className="font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Buka Mode Demo
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: AKUN DEMO (HANYA UNTUK MENGETAHUI SAJA) */}
                {authMode === "demo" && (
                  <div className="p-6 sm:p-7 space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Hanya untuk Mengetahui &amp; Tinjauan
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-950">Akses Akun Demo Interaktif</h2>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Fitur ini disediakan khusus bagi Anda yang ingin mengetahui dan menguji coba seluruh alur kerja pembukuan Akuntan AI sebelum mendaftar.
                      </p>
                    </div>

                    {/* Preview box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                      <p className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider">
                        Contoh Data Toko yang Siap Ditinjau:
                      </p>
                      <div className="space-y-1.5 text-slate-600 text-xs">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Profil Toko:</strong> Toko Sembako Berkah Mandiri (Surabaya)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Mutasi Kas, Gaji Karyawan, Listrik/Air, &amp; Inventaris Toko</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Katalog Stok Barang Dagang dengan Kalkulasi HPP Rata-Rata</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Laporan Resmi SAK EMKM: Laba Rugi, Posisi Keuangan, &amp; CALK</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      disabled={loginLoading}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{loginLoading ? "Menyiapkan Data Demo..." : "Buka Halaman Utama via Akun Demo"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Dalam mode demo, Anda bebas mencoba seluruh fitur untuk mengetahui cara kerjanya. Kapan pun Anda siap mengelola toko sendiri, Anda dapat mendaftarkan akun baru.
                      </span>
                    </div>

                    <div className="text-center pt-0.5">
                      <p className="text-[11px] text-slate-500">
                        Siap mencatat toko Anda sendiri?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("register")}
                          className="font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Daftar Akun Baru
                        </button>
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE MODULES / FEATURES SECTION */}
      <section id="fitur" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
              FITUR UTAMA SISTEM
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Semua Kebutuhan Keuangan Toko dalam Satu Aplikasi Terpadu
            </h2>
            <p className="text-sm text-slate-600">
              Didesain khusus untuk menyederhanakan siklus akuntansi yang rumit menjadi alur kerja yang mudah dipahami oleh pemilik usaha non-akuntan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 mb-2">Jurnal &amp; Mutasi Kas Otomatis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap transaksi penjualan, belanja modal, atau biaya utilitas langsung diposting ke jurnal umum dengan metode Debit dan Kredit yang terverifikasi seimbang.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>18 akun standar SAK EMKM lengkap</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 mb-2">Manajemen Stok &amp; HPP Dinamis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Perhitungan Harga Pokok Penjualan (HPP) otomatis dengan metode rata-rata bergerak (moving average), mencegah kesalahan perhitungan laba kotor saat harga kulakan fluktuatif.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Peringatan stok menipis otomatis</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 mb-2">3 Laporan Keuangan Wajib</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hasilkan Laporan Laba Rugi, Laporan Posisi Keuangan (Neraca), serta Catatan atas Laporan Keuangan (CALK) resmi siap cetak format A4 dan ekspor Excel.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Format baku pengajuan pinjaman bank</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 mb-4">
                <Percent className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 mb-2">Kalkulator Pajak PP No. 55/2022</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menghitung tarif PPh Final 0,5% dari omzet bulanan, mencatat kewajiban utang pajak, serta memfasilitasi pelaporan PPN 11% untuk pengusaha kena pajak.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Penjadwalan setor sebelum tgl 15</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 mb-2">Asisten Konsultan Keuangan AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapatkan evaluasi profit margin, analisis kesehatan likuiditas toko, saran efisiensi beban operasional, serta tips peningkatan omzet langsung dari AI.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Analisis data toko Anda secara instan</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 mb-2">Google Sheets Cloud Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sinkronkan seluruh basis data pembukuan ke Google Spreadsheet pribadi dengan sekali klik via Google Apps Script Web App tanpa server eksternal berbayar.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cadangan data 100% milik Anda</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SAK EMKM COMPLIANCE SPOTLIGHT */}
      <section id="sak-emkm" className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                MENGAPA STANDAR SAK EMKM PENTING?
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Standar Akuntansi yang Membuka Akses Modal &amp; Kepercayaan
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Banyak pelaku UMKM ditolak perbankan saat mengajukan Kredit Usaha Rakyat (KUR) karena pencatatan keuangan yang hanya berupa buku kas manual atau nota tercecer.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dengan AKUNTAN AI, pembukuan Anda secara otomatis mengikuti Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM), menjamin kredibilitas laporan keuangan di mata:
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl">
                  <Building2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs text-white">Bank &amp; Lembaga Pembiayaan (KUR / Modal Kerja)</strong>
                    <span className="text-[11.5px] text-slate-400">Memenuhi syarat appraisal dan analisis kelayakan kredit perbankan nasional.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl">
                  <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs text-white">Kantor Pelayanan Pajak (DJP)</strong>
                    <span className="text-[11.5px] text-slate-400">Bukti valid peredaran bruto dan kesesuaian omzet tahunan pada SPT Badan / Pribadi.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs text-white">Investor &amp; Mitra Bisnis</strong>
                    <span className="text-[11.5px] text-slate-400">Transparansi margin laba bersih riil yang terukur tanpa bias pengeluaran pribadi (prive).</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div>
                  <div className="text-[10px] font-mono text-slate-400">DAFTAR KELOMPOK AKUN RESMI</div>
                  <h3 className="text-sm font-bold text-white">18 Pos Akun Akuntansi Toko</h3>
                </div>
                <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold px-2.5 py-1 rounded-lg">
                  Terintegrasi
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">1001 &mdash; Kas &amp; Setara Kas</span>
                  <span className="text-emerald-400 font-bold">ASET (Debit)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">1002 &mdash; Piutang Usaha</span>
                  <span className="text-emerald-400 font-bold">ASET (Debit)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">1003 &mdash; Persediaan Barang Dagang</span>
                  <span className="text-emerald-400 font-bold">ASET (Debit)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">2001 &mdash; Utang Usaha ke Supplier</span>
                  <span className="text-sky-400 font-bold">LIABILITAS (Kredit)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">3001 &mdash; Modal Pemilik Toko</span>
                  <span className="text-purple-400 font-bold">EKUITAS (Kredit)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">4001 &mdash; Pendapatan Penjualan</span>
                  <span className="text-amber-400 font-bold">PENDAPATAN (Kredit)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-300">5001 &mdash; Beban Pokok Penjualan (HPP)</span>
                  <span className="text-rose-400 font-bold">BEBAN POKOK (Debit)</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <button
                  onClick={() => scrollToAuth("register")}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Mulai Pembukuan SAK EMKM Toko Anda</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS / PROOF */}
      <section id="testimoni" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="text-xs font-bold text-emerald-700 tracking-wider uppercase">
              CERITA PENGGUNA
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Dipercaya oleh Pengusaha Ritel &amp; Jasa Lokal
            </h2>
            <p className="text-xs text-slate-500">
              Bagaimana AKUNTAN AI mengubah pengelolaan kas dan stok usaha menjadi lebih profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-700 italic leading-relaxed mb-4">
                &ldquo;Dulu setiap akhir bulan pusing mencocokkan stok beras dan minyak yang selisih. Sejak pakai sistem HPP otomatis di sini, laba kotor toko sembako saya langsung ketahuan secara akurat dan tidak ada lagi bon belanja yang hilang.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-950">Hj. Rina Wulandari</p>
                <p className="text-[11px] text-slate-500">Pemilik Toko Sembako Berkah, Yogyakarta</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-700 italic leading-relaxed mb-4">
                &ldquo;Pengajuan tambahan modal KUR Mikro di bank BRI saya disetujui hanya dalam 3 hari karena laporan Laba Rugi dan Neraca saya rapi berformat resmi SAK EMKM. Tinggal print A4 langsung siap.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-950">Hendri Kusuma</p>
                <p className="text-[11px] text-slate-500">Owner Kopi Seduh Nusantara, Bandung</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
              <p className="text-xs text-slate-700 italic leading-relaxed mb-4">
                &ldquo;Kalkulator pajak PP 55/2022 sangat membantu! Dulu sering telat bayar PPh Final 0,5% karena bingung cara hitung dari omzet kotor. Sekarang setiap tgl 1 tinggal cek nominal dan setor ke bank.&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-950">Agus Subroto</p>
                <p className="text-[11px] text-slate-500">Pengelola Toko Grosir Jaya Makmur, Surabaya</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12 space-y-2">
            <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>PERTANYAAN UMUM (FAQ)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Hal yang Sering Ditanyakan
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="py-14 bg-slate-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Siap Merapikan Pembukuan Toko Anda Hari Ini?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Daftarkan bisnis Anda gratis tanpa perlu instalasi rumit. Mulai catat transaksi pertama Anda dalam kurang dari 2 menit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => scrollToAuth("register")}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>Daftar Akun Baru Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleQuickDemoLogin}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
            >
              Coba Mode Demo (1-Klik)
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-500 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">AKUNTAN AI &mdash; SAK EMKM</span>
            <span aria-hidden="true">&bull;</span>
            <span>Hak Cipta &copy; 2026</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-400">
            Sistem Pembukuan &amp; Pelaporan Keuangan Terstandar Khusus UMKM Indonesia
          </div>
        </div>
      </footer>

    </div>
  );
};
