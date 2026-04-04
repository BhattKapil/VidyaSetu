import React, { createContext, useContext, useState, useCallback } from "react";
import { Role, User } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  updateXP: (xpToAdd: number) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS_DEFAULT: Record<string, User> = {
  "admin@vidyasetu.com": { id: "a1", name: "Admin User", email: "admin@vidyasetu.com", role: "admin", xp: 0, level: 0, streak: 0, badges: [], avatar: "👨‍💼" },
  "teacher@vidyasetu.com": { id: "t1", name: "Ms. Sharma", email: "teacher@vidyasetu.com", role: "teacher", xp: 0, level: 0, streak: 0, badges: [], avatar: "👩‍🏫" },
  "student@vidyasetu.com": { id: "s1", name: "Aarav S.", email: "student@vidyasetu.com", role: "student", xp: 1250, level: 7, streak: 5, badges: ["1", "2", "4", "7"], avatar: "🧑‍🎓" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("vidyasetu_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const found = DEMO_USERS_DEFAULT[email];
    if (found) {
      // Check if we have a saved version with updated XP first
      const saved = localStorage.getItem(`vidyasetu_reg_${email}`);
      const userToLoad = saved ? JSON.parse(saved) : found;
      setUser(userToLoad);
      localStorage.setItem("vidyasetu_user", JSON.stringify(userToLoad));
      return true;
    }
    // Check localStorage for registered users
    const registered = localStorage.getItem(`vidyasetu_reg_${email}`);
    if (registered) {
      const u = JSON.parse(registered);
      setUser(u);
      localStorage.setItem("vidyasetu_user", JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: Role): Promise<boolean> => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name, email, role,
      xp: role === "student" ? 0 : 0,
      level: role === "student" ? 1 : 0,
      streak: 0, badges: [], avatar: role === "student" ? "🧑‍🎓" : role === "teacher" ? "👩‍🏫" : "👨‍💼",
    };
    localStorage.setItem(`vidyasetu_reg_${email}`, JSON.stringify(newUser));
    setUser(newUser);
    localStorage.setItem("vidyasetu_user", JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("vidyasetu_user");
  }, []);

  const updateXP = useCallback((xpToAdd: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newXP = prev.xp + xpToAdd;
      const newLevel = Math.floor(newXP / 200) + 1;
      const updated = { ...prev, xp: newXP, level: newLevel };
      localStorage.setItem("vidyasetu_user", JSON.stringify(updated));
      if (prev.email) {
        localStorage.setItem(`vidyasetu_reg_${prev.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateXP, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
