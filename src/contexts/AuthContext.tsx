import React, { createContext, useContext, useState, useCallback } from "react";
import { Role, User } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User> = {
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
    const found = DEMO_USERS[email];
    if (found) {
      setUser(found);
      localStorage.setItem("vidyasetu_user", JSON.stringify(found));
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
