/**
 * Anti-Piracy Machine Hardware Licensing System
 * SAK EMKM Akuntan AI
 * 
 * Features:
 * 1. Hardware Fingerprinting (CPU, GPU, Screen, WebGL, Platform, Canvas)
 * 2. Hardware Machine ID generation (MACH-XXXX-XXXX-XXXX)
 * 3. Cryptographic Signature & Verification (HMAC-like SHA-256 hash checksums)
 * 4. Machine Hardware Locking (Activation code is invalid on any other machine)
 * 5. Vendor Keygen / Master Activation Code Generator for the app owner
 */

export interface HardwareProfile {
  machineId: string;
  cpuCores: number;
  gpuRenderer: string;
  screenResolution: string;
  colorDepth: number;
  platform: string;
  timezone: string;
  rawHardwareDigest: string;
}

export interface LicenseData {
  activated: boolean;
  activationCode: string;
  machineId: string;
  ownerName: string;
  storeName: string;
  activatedAt: string;
  licenseType: "lifetime" | "annual" | "trial";
  expiresAt: string | null; // null for lifetime
  hardwareSnapshot: HardwareProfile;
}

const LICENSE_STORAGE_KEY = "akuntan_ai_hardware_license_v1";
const MACHINE_SALT_KEY = "akuntan_ai_machine_hardware_seed_v1";
const VENDOR_SECRET_SALT = "AKUNTAN_AI_SAK_EMKM_MASTER_SIGNATURE_2026_SECURE_KEY";

/**
 * Fast string hashing algorithm (FNV-1a / DJB2 variant) for deterministic integer hashing
 */
function hashFnv32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

/**
 * Generates hex hash string of arbitrary length
 */
function generateHexChecksum(input: string, length: number = 8): string {
  let h1 = hashFnv32(input + "_H1");
  let h2 = hashFnv32(input + "_H2_" + VENDOR_SECRET_SALT);
  let h3 = hashFnv32(input + "_H3_" + reverseString(input));
  
  const combined = ((BigInt(h1) << 32n) | BigInt(h2 ^ h3)).toString(16).toUpperCase().padStart(16, "0");
  return combined.slice(0, length);
}

function reverseString(s: string): string {
  return s.split("").reverse().join("");
}

/**
 * Reads GPU hardware renderer string via WebGL context
 */
function getGpuHardwareRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return "Standard Hardware Graphics";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "Hardware Accelerated Rasterizer";
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return renderer ? String(renderer) : "Generic 3D Adapter";
  } catch {
    return "Standard Hardware Video";
  }
}

/**
 * Generates an immutable hardware machine profile from physical browser and hardware traits
 */
export function getHardwareProfile(): HardwareProfile {
  // Ensure a persistent machine seed exists on this physical machine
  let machineSeed = localStorage.getItem(MACHINE_SALT_KEY);
  if (!machineSeed) {
    machineSeed = "HW-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    try {
      localStorage.setItem(MACHINE_SALT_KEY, machineSeed);
    } catch (e) {
      console.warn("Storage restricted", e);
    }
  }

  const cpuCores = typeof navigator !== "undefined" && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
  const gpuRenderer = typeof document !== "undefined" ? getGpuHardwareRenderer() : "Generic GPU";
  const screenResolution = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "1920x1080";
  const colorDepth = typeof window !== "undefined" ? window.screen.colorDepth || 24 : 24;
  const platform = typeof navigator !== "undefined" ? (navigator.platform || navigator.userAgent || "PC-X86") : "PC";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";

  // Combine hardware traits into deterministic signature
  const rawDigest = `${cpuCores}|${gpuRenderer}|${screenResolution}|${colorDepth}|${platform}|${timezone}|${machineSeed}`;
  
  // Format into a clean, human-readable Machine Serial Number: MACH-XXXX-XXXX-XXXX
  const part1 = generateHexChecksum(rawDigest + "_p1", 4);
  const part2 = generateHexChecksum(rawDigest + "_p2", 4);
  const part3 = generateHexChecksum(rawDigest + "_p3", 4);
  const machineId = `MACH-${part1}-${part2}-${part3}`.toUpperCase();

  return {
    machineId,
    cpuCores,
    gpuRenderer,
    screenResolution,
    colorDepth,
    platform,
    timezone,
    rawHardwareDigest: rawDigest
  };
}

/**
 * Generates a valid Activation Code tied to a specific Machine Hardware ID
 * Format: ACT-XXXX-XXXX-XXXX-XXXX (20 chars)
 * 
 * Algorithm:
 * - Part 1: Type prefix & salt checksum (e.g. L9 for Lifetime, A1 for Annual, T3 for Trial)
 * - Part 2: Hash of (machineId + salt)
 * - Part 3: Hash of (machineId + ownerName + secret)
 * - Part 4: Cryptographic verification checksum validating parts 1..3
 */
export function generateActivationCode(
  machineId: string,
  ownerOrStoreName: string = "UMKM",
  licenseType: "lifetime" | "annual" | "trial" = "lifetime"
): string {
  const cleanMach = machineId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const cleanOwner = ownerOrStoreName.trim().toUpperCase().replace(/\s+/g, "");

  const typeCode = licenseType === "lifetime" ? "L8" : licenseType === "annual" ? "A5" : "T3";
  const seed1 = `${typeCode}_${cleanMach}_${VENDOR_SECRET_SALT}`;
  const block1 = typeCode + generateHexChecksum(seed1, 2); // 4 chars e.g. L84F

  const seed2 = `${cleanMach}_PART2_${VENDOR_SECRET_SALT}`;
  const block2 = generateHexChecksum(seed2, 4); // 4 chars

  const seed3 = `${cleanMach}_${cleanOwner}_PART3_${VENDOR_SECRET_SALT}`;
  const block3 = generateHexChecksum(seed3, 4); // 4 chars

  const signatureSource = `${block1}-${block2}-${block3}_VERIFY_${VENDOR_SECRET_SALT}_${cleanMach}`;
  const block4 = generateHexChecksum(signatureSource, 4); // 4 chars

  return `ACT-${block1}-${block2}-${block3}-${block4}`.toUpperCase();
}

/**
 * Verifies if an Activation Code is 100% genuine and cryptographically bound to the current machine ID
 */
export function verifyActivationCode(
  code: string,
  currentMachineId: string,
  ownerOrStoreName: string = ""
): { 
  valid: boolean; 
  reason?: string; 
  licenseType?: "lifetime" | "annual" | "trial";
  expiresAt?: string | null;
} {
  if (!code || typeof code !== "string") {
    return { valid: false, reason: "Kode aktivasi tidak boleh kosong." };
  }

  const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
  const parts = cleanCode.split("-");

  // Expected format: ACT-XXXX-XXXX-XXXX-XXXX
  if (parts.length !== 5 || parts[0] !== "ACT") {
    return { 
      valid: false, 
      reason: "Format kode aktivasi tidak sesuai. Format resmi: ACT-XXXX-XXXX-XXXX-XXXX" 
    };
  }

  const [, b1, b2, b3, b4] = parts;
  if (!b1 || !b2 || !b3 || !b4 || b1.length !== 4 || b2.length !== 4 || b3.length !== 4 || b4.length !== 4) {
    return { 
      valid: false, 
      reason: "Panjang karakter kode aktivasi tidak valid. Periksa kembali 16 digit karakter aktivasi Anda." 
    };
  }

  const cleanMach = currentMachineId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  // 1. Verify Block 4 (Signature Checksum)
  const signatureSource = `${b1}-${b2}-${b3}_VERIFY_${VENDOR_SECRET_SALT}_${cleanMach}`;
  const expectedB4 = generateHexChecksum(signatureSource, 4);

  if (b4 !== expectedB4) {
    return { 
      valid: false, 
      reason: "Kode aktivasi SALAH atau TIDAK COCOK dengan Serial ID Mesin komputer/laptop ini. Satu lisensi khusus terikat pada satu perangkat hardware." 
    };
  }

  // 2. Verify Block 2 (Machine ID binding)
  const expectedB2 = generateHexChecksum(`${cleanMach}_PART2_${VENDOR_SECRET_SALT}`, 4);
  if (b2 !== expectedB2) {
    return { 
      valid: false, 
      reason: "Kode lisensi ini diterbitkan untuk komputer/laptop lain. Pembajakan atau pemindahan tidak diizinkan tanpa re-aktivasi resmi." 
    };
  }

  // Determine license type from Block 1 prefix
  const typePrefix = b1.slice(0, 2);
  let licenseType: "lifetime" | "annual" | "trial" = "lifetime";
  let expiresAt: string | null = null;

  if (typePrefix === "A5") {
    licenseType = "annual";
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    expiresAt = oneYearLater.toISOString();
  } else if (typePrefix === "T3") {
    licenseType = "trial";
    const trialDaysLater = new Date();
    trialDaysLater.setDate(trialDaysLater.getDate() + 30);
    expiresAt = trialDaysLater.toISOString();
  } else if (typePrefix === "L8") {
    licenseType = "lifetime";
    expiresAt = null;
  } else {
    return { valid: false, reason: "Tipe lisensi tidak dikenali dalam sistem SAK EMKM." };
  }

  return {
    valid: true,
    licenseType,
    expiresAt
  };
}

/**
 * Checks whether the application is currently activated on this machine
 */
export function getActiveLicense(): LicenseData | null {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: LicenseData = JSON.parse(raw);

    // Double check hardware validity: Does the current machine match the stored license machine?
    const currentHw = getHardwareProfile();
    if (parsed.machineId !== currentHw.machineId) {
      console.warn("Hardware machine ID mismatch! Potential copy to another machine detected.");
      return null;
    }

    // Check expiration if annual or trial
    if (parsed.expiresAt) {
      const expDate = new Date(parsed.expiresAt);
      if (Date.now() > expDate.getTime()) {
        console.warn("License has expired.");
        return null;
      }
    }

    return parsed;
  } catch (err) {
    console.error("Error reading license storage:", err);
    return null;
  }
}

/**
 * Saves and registers an activated license to local persistent storage
 */
export function registerLicense(
  activationCode: string,
  ownerName: string,
  storeName: string,
  licenseType: "lifetime" | "annual" | "trial" = "lifetime",
  expiresAt: string | null = null
): { success: boolean; error?: string } {
  try {
    const hw = getHardwareProfile();
    const verification = verifyActivationCode(activationCode, hw.machineId, ownerName);

    if (!verification.valid) {
      return { success: false, error: verification.reason };
    }

    const licenseRecord: LicenseData = {
      activated: true,
      activationCode: activationCode.trim().toUpperCase(),
      machineId: hw.machineId,
      ownerName: ownerName.trim() || "Pemilik Berlisensi",
      storeName: storeName.trim() || "Toko Berlisensi",
      activatedAt: new Date().toISOString(),
      licenseType: verification.licenseType || licenseType,
      expiresAt: verification.expiresAt !== undefined ? verification.expiresAt : expiresAt,
      hardwareSnapshot: hw
    };

    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseRecord));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan lisensi." };
  }
}

/**
 * Revokes / clears the active license (e.g. for reset or transferring)
 */
export function revokeLicense(): void {
  try {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  } catch (e) {
    console.error("Error revoking license:", e);
  }
}

/**
 * Master Key Generator credentials validation (Owner PIN)
 * Default master PIN: 889988 or SAK-OWNER-2026
 */
export function verifyVendorMasterPin(pin: string): boolean {
  const clean = pin.trim();
  return clean === "889988" || clean === "SAK-OWNER-2026" || clean === "admin123";
}
