import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  KeyRound, 
  Cpu, 
  Laptop, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Info, 
  HelpCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  getHardwareProfile, 
  verifyActivationCode, 
  registerLicense, 
  generateActivationCode, 
  verifyVendorMasterPin,
  HardwareProfile,
  LicenseData 
} from "../utils/licenseManager";

interface ActivationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onActivationSuccess: (license: LicenseData) => void;
  allowDismiss?: boolean;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  onActivationSuccess,
  allowDismiss = false
}) => {
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);
  const [customMachineId, setCustomMachineId] = useState<string>("");
  const [useCustomSerial, setUseCustomSerial] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedKeygenCode, setCopiedKeygenCode] = useState<boolean>(false);

  // Form input state
  const [ownerName, setOwnerName] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("");
  const [activationCode, setActivationCode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  // Master Keygen (Vendor Tool) state
  const [showKeygen, setShowKeygen] = useState<boolean>(false);
  const [keygenPin, setKeygenPin] = useState<string>("");
  const [keygenUnlocked, setKeygenUnlocked] = useState<boolean>(false);
  const [keygenPinError, setKeygenPinError] = useState<string | null>(null);

  const [keygenTargetMachine, setKeygenTargetMachine] = useState<string>("");
  const [keygenOwner, setKeygenOwner] = useState<string>("");
  const [keygenType, setKeygenType] = useState<"lifetime" | "annual" | "trial">("lifetime");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  useEffect(() => {
    const hw = getHardwareProfile();
    setHardware(hw);
    setKeygenTargetMachine(hw.machineId);
  }, []);

  if (!isOpen) return null;

  const effectiveMachineId = useCustomSerial && customMachineId.trim() 
    ? customMachineId.trim().toUpperCase() 
    : hardware?.machineId || "MACH-SCANNING-HARDWARE";

  const handleCopyMachineId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(effectiveMachineId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleFormatCodeInput = (val: string) => {
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean.startsWith("ACT") && clean.length > 0) {
      clean = "ACT" + clean;
    }
    
    // Auto-hyphenate ACT-XXXX-XXXX-XXXX-XXXX
    let formatted = "";
    if (clean.length > 0) {
      formatted = clean.slice(0, 3);
      if (clean.length > 3) formatted += "-" + clean.slice(3, 7);
      if (clean.length > 7) formatted += "-" + clean.slice(7, 11);
      if (clean.length > 11) formatted += "-" + clean.slice(11, 15);
      if (clean.length > 15) formatted += "-" + clean.slice(15, 19);
    }
    setActivationCode(formatted);
  };

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!activationCode.trim()) {
      setErrorMsg("Silakan masukkan Kode Aktivasi Lisensi Anda.");
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      const verifyRes = verifyActivationCode(activationCode, effectiveMachineId, ownerName);
      
      if (!verifyRes.valid) {
        setIsActivating(false);
        setErrorMsg(verifyRes.reason || "Kode aktivasi tidak valid untuk perangkat ini.");
        return;
      }

      const regRes = registerLicense(
        activationCode,
        ownerName || "Pengguna Berlisensi",
        storeName || "Toko Usaha",
        verifyRes.licenseType || "lifetime",
        verifyRes.expiresAt || null
      );

      setIsActivating(false);
      if (regRes.success) {
        setSuccessMsg("Selamat! Aplikasi Akuntan AI SAK EMKM Berhasil Diaktivasi Permanen.");
        setTimeout(() => {
          onActivationSuccess({
            activated: true,
            activationCode,
            machineId: effectiveMachineId,
            ownerName: ownerName || "Pemilik Lisensi",
            storeName: storeName || "Toko Lisensi",
            activatedAt: new Date().toISOString(),
            licenseType: verifyRes.licenseType || "lifetime",
            expiresAt: verifyRes.expiresAt || null,
            hardwareSnapshot: hardware!
          });
        }, 1200);
      } else {
        setErrorMsg(regRes.error || "Gagal mengaktifkan lisensi.");
      }
    }, 600);
  };

  const handleUnlockKeygen = (e: React.FormEvent) => {
    e.preventDefault();
    setKeygenPinError(null);
    if (verifyVendorMasterPin(keygenPin)) {
      setKeygenUnlocked(true);
      setKeygenTargetMachine(effectiveMachineId);
      setKeygenOwner(ownerName || "Pemilik Toko");
    } else {
      setKeygenPinError("PIN Master Penjual salah! (Gunakan PIN Master: 889988 atau SAK-OWNER-2026)");
    }
  };

  const handleGenerateKey = () => {
    if (!keygenTargetMachine.trim()) return;
    const code = generateActivationCode(keygenTargetMachine, keygenOwner, keygenType);
    setGeneratedCode(code);
  };

  const handleApplyGeneratedCode = () => {
    if (!generatedCode) return;
    setActivationCode(generatedCode);
    if (keygenOwner && !ownerName) setOwnerName(keygenOwner);
  };

  const handleCopyGeneratedCode = () => {
    if (generatedCode && navigator.clipboard) {
      navigator.clipboard.writeText(generatedCode);
      setCopiedKeygenCode(true);
      setTimeout(() => setCopiedKeygenCode(false), 2500);
    }
  };

  const handleActivateTrial = () => {
    const trialCode = generateActivationCode(effectiveMachineId, "Demo Trial User", "trial");
    setActivationCode(trialCode);
    setOwnerName("Pengguna Masa Uji Coba");
    setStoreName("Usaha Percobaan");
    
    const regRes = registerLicense(
      trialCode,
      "Pengguna Masa Uji Coba",
      "Usaha Percobaan",
      "trial"
    );

    if (regRes.success) {
      setSuccessMsg("Masa Percobaan Resmi 30 Hari Aktif!");
      setTimeout(() => {
        onActivationSuccess({
          activated: true,
          activationCode: trialCode,
          machineId: effectiveMachineId,
          ownerName: "Pengguna Masa Uji Coba",
          storeName: "Usaha Percobaan",
          activatedAt: new Date().toISOString(),
          licenseType: "trial",
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          hardwareSnapshot: hardware!
        });
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        
        {/* Header Header Brand */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Aktivasi Lisensi Hardware
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Anti-Pembajakan
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Proteksi Kunci Hardware (Machine Hardware Locking) Standar SAK EMKM
                </p>
              </div>
            </div>

            {allowDismiss && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Hardware ID Detection Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Serial ID Mesin Hardware Komputer Ini
              </span>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Terdeteksi Otomatis
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-4 py-3 font-mono font-black text-slate-900 text-base sm:text-lg tracking-widest text-center shadow-inner select-all">
                {effectiveMachineId}
              </div>
              <button
                type="button"
                onClick={handleCopyMachineId}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                title="Salin Serial ID Mesin untuk dikirim ke penjual/vendor"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Hardware Fingerprint Specs Pill */}
            {hardware && (
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-500 font-mono">
                <div>
                  <span className="block text-slate-400">CPU Thread:</span>
                  <span className="font-semibold text-slate-700">{hardware.cpuCores} Cores Concurrency</span>
                </div>
                <div>
                  <span className="block text-slate-400">Resolusi Layar:</span>
                  <span className="font-semibold text-slate-700">{hardware.screenResolution} ({hardware.colorDepth}bit)</span>
                </div>
                <div>
                  <span className="block text-slate-400">GPU Renderer:</span>
                  <span className="font-semibold text-slate-700 truncate" title={hardware.gpuRenderer}>
                    {hardware.gpuRenderer.length > 20 ? hardware.gpuRenderer.slice(0, 20) + "..." : hardware.gpuRenderer}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">OS Platform:</span>
                  <span className="font-semibold text-slate-700">{hardware.platform}</span>
                </div>
              </div>
            )}

            {/* Manual Hardware Serial Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUseCustomSerial(!useCustomSerial)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center gap-1 cursor-pointer"
              >
                <span>{useCustomSerial ? "Gunakan Fingerprint Otomatis" : "Punya Serial BIOS / Chassis Laptop Fisik Sendiri?"}</span>
              </button>
              {useCustomSerial && (
                <div className="mt-2 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Contoh: SN-CND9284KP1 atau LAPTOP-DELL-5520"
                    value={customMachineId}
                    onChange={(e) => setCustomMachineId(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-indigo-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Kode aktivasi nantinya akan dikunci khusus pada serial hardware manual ini.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messages Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aktivasi Ditolak</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aktivasi Sukses</p>
                <p className="mt-0.5 leading-relaxed">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Form Input Activation Code */}
          <form onSubmit={handleActivateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pemilik Lisensi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Toko / Usaha
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Berkah Mandiri"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Kode Aktivasi Lisensi (20 Karakter)</span>
                <span className="text-[11px] font-mono text-slate-400">Format: ACT-XXXX-XXXX-XXXX-XXXX</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ACT-L84F-XXXX-XXXX-XXXX"
                  value={activationCode}
                  onChange={(e) => handleFormatCodeInput(e.target.value)}
                  maxLength={23}
                  className="w-full pl-10 pr-4 py-3 bg-indigo-50/40 border-2 border-indigo-200 rounded-xl font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wider focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden transition uppercase"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                Satu kode aktivasi hanya sah untuk satu perangkat hardware ini dan tidak bisa digandakan ke komputer lain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isActivating || !activationCode}
                className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Hardware...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Verifikasi &amp; Aktifkan Aplikasi</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleActivateTrial}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Coba Trial 30 Hari</span>
              </button>
            </div>
          </form>

          {/* Quick Help & Contact Vendor Box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Belum Memiliki Kode Aktivasi?</span>
            </div>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              Kirimkan <strong>Serial ID Mesin Hardware ({effectiveMachineId})</strong> ke vendor atau pengembang aplikasi ini untuk mendapatkan lisensi resmi seumur hidup (Lifetime) atau tahunan.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Halo Admin, saya ingin aktivasi aplikasi SAK EMKM Akuntan AI untuk toko saya. Serial ID Mesin Hardware laptop saya: ${effectiveMachineId}. Mohon terbitkan kode aktivasinya. Terima kasih.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs"
              >
                <span>Hubungi Penjual via WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* MASTER KEYGEN / GENERATOR LISENSI KHUSUS PEMILIK/VENDOR */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowKeygen(!showKeygen)}
              className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span>🛠️ Generator Lisensi &amp; Keygen (Khusus Penjual / Administrator)</span>
              </span>
              {showKeygen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showKeygen && (
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-4 text-xs animate-fadeIn">
                {!keygenUnlocked ? (
                  <form onSubmit={handleUnlockKeygen} className="space-y-3">
                    <p className="text-slate-600 text-[11px]">
                      Fitur ini khusus untuk Anda sebagai pemilik/pengembang aplikasi untuk menerbitkan kode aktivasi bagi pembeli atau klien Anda. Masukkan PIN Master Admin untuk membuka generator:
                    </p>
                    
                    {keygenPinError && (
                      <p className="text-rose-600 font-bold text-[11px]">{keygenPinError}</p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Masukkan PIN Master (Default: 889988)"
                        value={keygenPin}
                        onChange={(e) => setKeygenPin(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Buka Generator
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Tips: PIN Master bawaan adalah <code>889988</code> atau <code>SAK-OWNER-2026</code>.
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Generator Kode Lisensi Klien
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Admin Unlocked
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Serial ID Mesin Pembeli (Hardware Client)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={keygenTargetMachine}
                            onChange={(e) => setKeygenTargetMachine(e.target.value)}
                            placeholder="Contoh: MACH-7A9B-4F2E-9801"
                            className="flex-1 font-mono text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setKeygenTargetMachine(effectiveMachineId)}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg transition"
                          >
                            Mesin Ini
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nama Klien / Toko
                          </label>
                          <input
                            type="text"
                            value={keygenOwner}
                            onChange={(e) => setKeygenOwner(e.target.value)}
                            placeholder="Nama Usaha Klien"
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Jenis Lisensi
                          </label>
                          <select
                            value={keygenType}
                            onChange={(e) => setKeygenType(e.target.value as any)}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                          >
                            <option value="lifetime">Seumur Hidup (Lifetime)</option>
                            <option value="annual">Tahunan (1 Tahun)</option>
                            <option value="trial">Uji Coba (Trial 30 Hari)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateKey}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Generate Kode Aktivasi Resmi</span>
                      </button>

                      {generatedCode && (
                        <div className="p-3 bg-indigo-900 text-white rounded-xl space-y-2 mt-2">
                          <div className="flex items-center justify-between text-[11px] text-indigo-200">
                            <span>KODE AKTIVASI RESMI DIHASILKAN:</span>
                            <span className="font-bold uppercase text-amber-300">{keygenType}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950/80 rounded-lg font-mono font-black text-center text-sm sm:text-base tracking-widest text-emerald-400 select-all border border-indigo-500/30">
                            {generatedCode}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCopyGeneratedCode}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                            >
                              {copiedKeygenCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedKeygenCode ? "Tersalin!" : "Salin Kode"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyGeneratedCode}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Terapkan Langsung Ke Form Ini
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
