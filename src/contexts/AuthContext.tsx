import React, { createContext, useContext, useState, useCallback } from "react";
import { Role, User } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  updateXP: (xpToAdd: number) => void;
  awardBadge: (badgeId: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS_DEFAULT: Record<string, User> = {
  "admin@vidyasetu.com": { id: "a1", name: "Admin User", email: "admin@vidyasetu.com", role: "admin", xp: 0, level: 0, streak: 0, badges: [], avatar: "👨‍💼" },
  "teacher@vidyasetu.com": { id: "t1", name: "Ms. Sharma", email: "teacher@vidyasetu.com", role: "teacher", xp: 0, level: 0, streak: 0, badges: [], avatar: "👩‍🏫" },
  "student@vidyasetu.com": { id: "s1", name: "Aarav S.", email: "student@vidyasetu.com", role: "student", xp: 1250, level: 7, streak: 5, badges: ["1", "2", "4", "7"], avatar: "🧑‍🎓" },
};

function updateStreak(user: User): User {
  const today = new Date().toISOString().split("T")[0];
  const lastLogin = localStorage.getItem("vidyasetu_last_login_" + user.email);

  if (!lastLogin) {
    localStorage.setItem("vidyasetu_last_login_" + user.email, today);
    return { ...user, streak: 1 };
  }

  if (lastLogin === today) {
    return user;
  }

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

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const defaultUser = DEMO_USERS_DEFAULT[email];
    let userToLoad: User;

    if (defaultUser) {
      const saved = localStorage.getItem("vidyasetu_reg_" + email);
      userToLoad = saved ? JSON.parse(saved) : defaultUser;
    } else {
      const registered = localStorage.getItem("vidyasetu_reg_" + email);
      if (!registered) return false;
      userToLoad = JSON.parse(registered);
    }

    userToLoad = updateStreak(userToLoad);
    localStorage.setItem("vidyasetu_reg_" + email, JSON.stringify(userToLoad));
    sessionStorage.setItem("vidyasetu_user", JSON.stringify(userToLoad));
    setUser(userToLoad);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: Role): Promise<boolean> => {
    const today = new Date().toISOString().split("T")[0];
    const newUser: User = {
      id: crypto.randomUUID(),
      name, email, role,
      xp: 0,
      level: 1,
      streak: 1,
      badges: [],
      avatar: role === "student" ? "🧑‍🎓" : role === "teacher" ? "👩‍🏫" : "👨‍💼",
    };
    localStorage.setItem("vidyasetu_reg_" + email, JSON.stringify(newUser));
    localStorage.setItem("vidyasetu_last_login_" + email, today);
    sessionStorage.setItem("vidyasetu_user", JSON.stringify(newUser));
    setUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("vidyasetu_user");
  }, []);

  const updateXP = useCallback((xpToAdd: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newXP = prev.xp + xpToAdd;
      const newLevel = Math.floor(newXP / 200) + 1;
      const updated = { ...prev, xp: newXP, level: newLevel };
      sessionStorage.setItem("vidyasetu_user", JSON.stringify(updated));
      localStorage.setItem("vidyasetu_reg_" + prev.email, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const awardBadge = useCallback((badgeId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      if (prev.badges.includes(badgeId)) return prev;
      const updated = { ...prev, badges: [...prev.badges, badgeId] };
      sessionStorage.setItem("vidyasetu_user", JSON.stringify(updated));
      localStorage.setItem("vidyasetu_reg_" + prev.email, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateXP, awardBadge, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}