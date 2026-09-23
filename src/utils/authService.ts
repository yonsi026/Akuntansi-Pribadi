import { UserAccount } from "../types";

const USERS_STORAGE_KEY = "akuntan_ai_users_v1";
const SESSION_STORAGE_KEY = "akuntan_ai_current_user_v1";

export const DEFAULT_DEMO_USER: UserAccount = {
  id: "usr_demo_01",
  name: "Budi Santoso",
  email: "admin@toko.id",
  username: "admin",
  password: "password123",
  storeName: "Toko Sembako Berkah Mandiri",
  storeType: "Toko Kelontong & Sembako",
  storeCity: "Surabaya",
  storeAddress: "Jl. Rungkut Asri No. 18",
  storeNpwp: "84.123.456.7-604.000",
  role: "owner",
  createdAt: "2026-01-15T08:00:00.000Z",
  lastLoginAt: new Date().toISOString()
};

export function getAllUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Seed default user
      const initialUsers = [DEFAULT_DEMO_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_DEMO_USER]));
      return [DEFAULT_DEMO_USER];
    }
    return parsed;
  } catch (err) {
    console.error("Error reading users from storage:", err);
    return [DEFAULT_DEMO_USER];
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading current user session:", err);
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Error updating user session:", err);
  }
}

export function authenticateUser(identifier: string, pass: string): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const cleanId = identifier.trim().toLowerCase();
  
  // Special shortcut for demo
  if ((cleanId === "admin" || cleanId === "admin@toko.id" || cleanId === "demo") && (pass === "password123" || pass === "admin" || pass === "demo")) {
    const demo = users.find(u => u.username === "admin" || u.email === "admin@toko.id") || DEFAULT_DEMO_USER;
    const updatedUser = { ...demo, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updatedUser);
    return { success: true, user: updatedUser };
  }

  const user = users.find(u => 
    u.email.toLowerCase() === cleanId || 
    u.username.toLowerCase() === cleanId
  );

  if (!user) {
    return { 
      success: false, 
      error: "Akun tidak ditemukan. Silakan periksa kembali email/username atau daftar sebagai pengguna baru." 
    };
  }

  if (user.password && user.password !== pass) {
    return { 
      success: false, 
      error: "Kata sandi yang Anda masukkan salah. Silakan coba lagi." 
    };
  }

  const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
  
  // Update in user list
  const updatedList = users.map(u => u.id === user.id ? updatedUser : u);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
  
  // Set current active session
  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
}

export function registerNewUser(data: {
  name: string;
  email: string;
  username: string;
  password?: string;
  storeName: string;
  storeType: string;
  storeCity: string;
  storeAddress?: string;
  storeNpwp?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanUsername = data.username.trim().toLowerCase();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { 
      success: false, 
      error: "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun lama." 
    };
  }

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { 
      success: false, 
      error: "Username ini sudah digunakan. Silakan pilih username lain yang unik." 
    };
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    email: cleanEmail,
    username: cleanUsername,
    password: data.password || "123456",
    storeName: data.storeName.trim() || "Toko Baru",
    storeType: data.storeType || "Toko Kelontong / Retail",
    storeCity: data.storeCity.trim() || "Indonesia",
    storeAddress: data.storeAddress?.trim() || "",
    storeNpwp: data.storeNpwp?.trim() || "",
    role: "owner",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  const updatedList = [...users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

export function logoutUser(): void {
  setCurrentUser(null);
}
