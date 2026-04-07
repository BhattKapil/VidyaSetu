import React, { createContext, useContext, useState, useCallback } from "react";
import { Role, User } from "@/lib/mockData";

const API = "/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  updateXP: (xpToAdd: number) => void;
  awardBadge: (badgeId: string) => void;
  syncUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function saveUser(user: User) {
  sessionStorage.setItem("vidyasetu_user", JSON.stringify(user));
  localStorage.setItem("vidyasetu_reg_" + user.email, JSON.stringify(user));
}

function updateStreak(user: User): User {
  const today = new Date().toISOString().split("T")[0];
  const lastLogin = localStorage.getItem("vidyasetu_last_login_" + user.email);
  if (!lastLogin) {
    localStorage.setItem("vidyasetu_last_login_" + user.email, today);
    return { ...user, streak: 1 };
  }
  if (lastLogin === today) return user;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  localStorage.setItem("vidyasetu_last_login_" + user.email, today);
  if (lastLogin === yesterdayStr) {
    const newStreak = user.streak + 1;
    const updated = { ...user, streak: newStreak };
    if (newStreak >= 7) updated.badges = [...new Set([...updated.badges, "3"])];
    return updated;
  }
  return { ...user, streak: 1 };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem("vidyasetu_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("vidyasetu_token");
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Try real backend first
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user as User;
        setToken(data.token);
        localStorage.setItem("vidyasetu_token", data.token);
        localStorage.removeItem("vidyasetu_perfect_scores");
        localStorage.removeItem("vidyasetu_total_correct");
        saveUser(u);
        setUser(u);
        return true;
      }
      // Backend responded but rejected — wrong password or user not found
      // Do NOT fall through to localStorage
      return false;
    } catch {
      // Backend is offline (network error) — fall through to localStorage
    }

    // Fallback to localStorage (only reached if backend is offline)
    const saved = localStorage.getItem("vidyasetu_reg_" + email);
    if (saved) {
      const u = JSON.parse(saved) as User;
      const isDemoAccount = ["student@vidyasetu.com", "teacher@vidyasetu.com", "admin@vidyasetu.com"].includes(email);
      const savedPassword = localStorage.getItem("vidyasetu_pw_" + email);
      if (!isDemoAccount && savedPassword && savedPassword !== password) {
        return false;
      }
      let updated = u;
      updated = updateStreak(updated);
      saveUser(updated);
      setUser(updated);
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: Role): Promise<boolean> => {
    // Try real backend first
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user as User;
        setToken(data.token);
        localStorage.setItem("vidyasetu_token", data.token);
        localStorage.removeItem("vidyasetu_perfect_scores");
        localStorage.removeItem("vidyasetu_total_correct");
        saveUser(u);
        setUser(u);
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      // Only fall through to localStorage if backend is offline
      if (message && message !== "Failed to fetch") {
        return false;
      }
    }

    // Fallback to localStorage
    const today = new Date().toISOString().split("T")[0];
    const newUser: User = {
      id: crypto.randomUUID(),
      name, email, role,
      xp: 0, level: 1, streak: 1, badges: [],
      avatar: role === "student" ? "🧑‍🎓" : role === "teacher" ? "👩‍🏫" : "👨‍💼",
    };
    localStorage.setItem("vidyasetu_reg_" + email, JSON.stringify(newUser));
    localStorage.setItem("vidyasetu_pw_" + email, password);
    localStorage.setItem("vidyasetu_last_login_" + email, today);
    saveUser(newUser);
    setUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("vidyasetu_user");
    localStorage.removeItem("vidyasetu_token");
  }, []);

  const updateXP = useCallback((xpToAdd: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newXP = prev.xp + xpToAdd;
      const newLevel = Math.floor(newXP / 200) + 1;
      const updated = { ...prev, xp: newXP, level: newLevel };
      saveUser(updated);
      return updated;
    });
  }, []);

  const awardBadge = useCallback((badgeId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      if (prev.badges.includes(badgeId)) return prev;
      const updated = { ...prev, badges: [...prev.badges, badgeId] };
      saveUser(updated);
      const tok = localStorage.getItem("vidyasetu_token");
      if (tok) {
        fetch(`${API}/user/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ xp: updated.xp, level: updated.level, badges: updated.badges }),
        }).catch(() => {});
      }
      return updated;
    });
  }, []);

  const syncUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateXP, awardBadge, syncUser, isAuthenticated: !!user, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}