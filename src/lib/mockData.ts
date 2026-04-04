export type Role = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  avatar: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  teacherId: string;
  questions: Question[];
  timeLimit: number; // minutes
  xpReward: number;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "quiz" | "memory" | "timed";
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}

export const BADGES: Badge[] = [
  { id: "1", name: "First Steps", icon: "🎯", description: "Complete your first quiz", earned: false },
  { id: "2", name: "Quiz Master", icon: "🏆", description: "Score 100% on 5 quizzes", earned: false },
  { id: "3", name: "Streak King", icon: "🔥", description: "7-day study streak", earned: false },
  { id: "4", name: "Brain Power", icon: "🧠", description: "Answer 100 questions correctly", earned: false },
  { id: "5", name: "Speed Demon", icon: "⚡", description: "Finish a timed quiz with >50% time left", earned: false },
  { id: "6", name: "Social Learner", icon: "🤝", description: "Help 5 classmates", earned: false },
  { id: "7", name: "Night Owl", icon: "🦉", description: "Study after 10 PM", earned: false },
  { id: "8", name: "Memory Champ", icon: "💎", description: "Win 3 memory match games", earned: false },
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: "q1",
    title: "Basic Mathematics",
    subject: "Math",
    teacherId: "t1",
    timeLimit: 10,
    xpReward: 50,
    createdAt: "2026-03-28",
    questions: [
      { id: "q1-1", text: "What is 12 × 8?", options: ["86", "96", "106", "76"], correctIndex: 1 },
      { id: "q1-2", text: "What is the square root of 144?", options: ["10", "11", "12", "14"], correctIndex: 2 },
      { id: "q1-3", text: "What is 15% of 200?", options: ["20", "25", "30", "35"], correctIndex: 2 },
      { id: "q1-4", text: "Solve: 3x + 7 = 22", options: ["3", "4", "5", "6"], correctIndex: 2 },
    ],
  },
  {
    id: "q2",
    title: "Science Basics",
    subject: "Science",
    teacherId: "t1",
    timeLimit: 8,
    xpReward: 60,
    createdAt: "2026-03-30",
    questions: [
      { id: "q2-1", text: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "CO₂", "Helium"], correctIndex: 2 },
      { id: "q2-2", text: "What is the boiling point of water?", options: ["90°C", "100°C", "110°C", "120°C"], correctIndex: 1 },
      { id: "q2-3", text: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctIndex: 2 },
    ],
  },
  {
    id: "q3",
    title: "English Grammar",
    subject: "English",
    teacherId: "t1",
    timeLimit: 5,
    xpReward: 40,
    createdAt: "2026-04-01",
    questions: [
      { id: "q3-1", text: "Which is a noun?", options: ["Run", "Beautiful", "Happiness", "Quickly"], correctIndex: 2 },
      { id: "q3-2", text: "'She ___ to school daily.'", options: ["go", "goes", "going", "gone"], correctIndex: 1 },
    ],
  },
];

export const MOCK_MISSIONS: Mission[] = [
  { id: "m1", title: "Math Blitz", description: "Complete 3 math quizzes", xpReward: 100, type: "quiz", difficulty: "easy", completed: false },
  { id: "m2", title: "Memory Master", description: "Win a memory match game", xpReward: 80, type: "memory", difficulty: "medium", completed: false },
  { id: "m3", title: "Speed Challenge", description: "Finish a timed quiz in half the time", xpReward: 120, type: "timed", difficulty: "hard", completed: false },
  { id: "m4", title: "Science Explorer", description: "Score 80%+ on Science quiz", xpReward: 90, type: "quiz", difficulty: "medium", completed: true },
];

export const LEADERBOARD = [
  { name: "Aarav S.", xp: 2450, level: 12, avatar: "🧑‍🎓" },
  { name: "Priya M.", xp: 2200, level: 11, avatar: "👩‍🎓" },
  { name: "Rahul K.", xp: 1980, level: 10, avatar: "🧑‍💻" },
  { name: "Sneha D.", xp: 1850, level: 9, avatar: "👩‍🔬" },
  { name: "Vikram P.", xp: 1720, level: 9, avatar: "🧑‍🚀" },
  { name: "Ananya R.", xp: 1600, level: 8, avatar: "👩‍🎨" },
  { name: "Karthik N.", xp: 1450, level: 7, avatar: "🧑‍🏫" },
  { name: "Divya L.", xp: 1300, level: 7, avatar: "👩‍⚕️" },
];

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function getXPProgress(xp: number): number {
  return (xp % 200) / 200 * 100;
}
