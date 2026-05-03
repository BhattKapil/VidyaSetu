import { MOCK_QUIZZES, LEADERBOARD } from "./mockData";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  avatar: string;
}

// ── Get all registered users from localStorage ────────────────────────────────
export function getAllUsers(): StoredUser[] {
  const users: StoredUser[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("vidyasetu_reg_")) {
      try {
        const u = JSON.parse(localStorage.getItem(key) || "");
        if (u?.id) users.push(u);
      } catch { }
    }
  }
  return users;
}

// ── Get all quizzes (mock + custom) ──────────────────────────────────────────
export function getAllQuizzes() {
  const custom = JSON.parse(localStorage.getItem("vidyasetu_quizzes") || "[]");
  return [...MOCK_QUIZZES, ...custom];
}

// ── Get leaderboard (real users + mock fallback) ──────────────────────────────
export function getLeaderboard() {
  const realUsers = getAllUsers().filter((u) => u.role === "student");
  if (realUsers.length === 0) return LEADERBOARD;
  return realUsers
    .map((u) => ({
      name: u.name,
      xp: u.xp,
      level: u.level,
      avatar: u.avatar,
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);
}

// ── Get platform stats ────────────────────────────────────────────────────────
export function getPlatformStats() {
  const users = getAllUsers();
  const quizzes = getAllQuizzes();
  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");

  const today = new Date().toISOString().split("T")[0];
  const activeToday = users.filter((u) => {
    const last = localStorage.getItem("vidyasetu_last_login_" + u.email);
    return last === today;
  }).length;

  return {
    totalUsers: users.length,
    teachers: teachers.length,
    quizzes: quizzes.length,
    activeToday,
    students: students.length,
  };
}