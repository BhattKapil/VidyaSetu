import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_QUIZZES, BADGES } from "@/lib/mockData";
import { Link } from "react-router-dom";
import {
  Sparkles, TrendingUp, BookOpen, Target, Clock,
  Zap, ChevronRight, RefreshCw, Brain, Video, FileText, Star
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  type: "quiz" | "video" | "note" | "revision" | "challenge" | "streak";
  title: string;
  description: string;
  icon: string;
  xp: number;
  link: string;
  priority: "high" | "medium" | "low";
  reason: string;
  tag?: string;
}

interface StudyStats {
  quizzesCompleted: number;
  avgScore: number;
  weakSubjects: string[];
  strongSubjects: string[];
  lastStudied: string;
  streakDays: number;
  hoursToday: number;
}

// ─── Derive stats from localStorage ──────────────────────────────────────────
function getStudyStats(xp: number, streak: number): StudyStats {
  const quizResults: Record<string, number> = JSON.parse(
    localStorage.getItem("vidyasetu_quiz_results") || "{}"
  );

  const subjectScores: Record<string, number[]> = {};
  Object.entries(quizResults).forEach(([quizId, score]) => {
    const quiz = MOCK_QUIZZES.find(q => q.id === quizId);
    if (quiz) {
      subjectScores[quiz.subject] = subjectScores[quiz.subject] || [];
      subjectScores[quiz.subject].push(score as number);
    }
  });

  const subjectAvgs: Record<string, number> = {};
  Object.entries(subjectScores).forEach(([subj, scores]) => {
    subjectAvgs[subj] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  const sorted = Object.entries(subjectAvgs).sort((a, b) => a[1] - b[1]);
  const weakSubjects = sorted.slice(0, 2).map(s => s[0]);
  const strongSubjects = sorted.slice(-2).reverse().map(s => s[0]);

  return {
    quizzesCompleted: Object.keys(quizResults).length,
    avgScore: sorted.length
      ? Object.values(subjectAvgs).reduce((a, b) => a + b, 0) / sorted.length
      : 0,
    weakSubjects: weakSubjects.length ? weakSubjects : ["Science", "Math"],
    strongSubjects: strongSubjects.length ? strongSubjects : ["English"],
    lastStudied: localStorage.getItem("vidyasetu_last_studied") || "Today",
    streakDays: streak,
    hoursToday: parseFloat(localStorage.getItem("vidyasetu_hours_today") || "0"),
  };
}

// ─── Generate recommendations ─────────────────────────────────────────────────
function generateRecommendations(stats: StudyStats, xp: number, level: number): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Weak subject quiz
  if (stats.weakSubjects[0]) {
    const weakQuiz = MOCK_QUIZZES.find(q => q.subject.toLowerCase().includes(stats.weakSubjects[0].toLowerCase()))
      || MOCK_QUIZZES[0];
    recs.push({
      id: "weak-1",
      type: "quiz",
      title: `Strengthen: ${stats.weakSubjects[0]}`,
      description: `Your ${stats.weakSubjects[0]} scores need a boost. Try this quiz to improve!`,
      icon: "📈",
      xp: weakQuiz.xpReward + 20,
      link: `/quiz/${weakQuiz.id}`,
      priority: "high",
      reason: "Based on your past performance",
      tag: "Needs Work",
    });
  }

  // 2. Streak protection
  if (stats.streakDays > 0 && stats.streakDays < 7) {
    recs.push({
      id: "streak-protect",
      type: "streak",
      title: "Keep your streak alive! 🔥",
      description: `You're on a ${stats.streakDays}-day streak. Complete a quick quiz to maintain it.`,
      icon: "🔥",
      xp: 30,
      link: "/quizzes",
      priority: "high",
      reason: "Streak protection",
      tag: "Urgent",
    });
  }

  // 3. Level-up challenge
  const xpToNext = 200 - (xp % 200);
  if (xpToNext < 100) {
    recs.push({
      id: "level-up",
      type: "challenge",
      title: `${xpToNext} XP to Level ${level + 1}!`,
      description: `You're so close! Complete a quiz or mission to level up.`,
      icon: "⚡",
      xp: xpToNext,
      link: "/quizzes",
      priority: "high",
      reason: "You're almost at the next level",
      tag: "Level Up",
    });
  }

  // 4. Strong subject for confidence
  if (stats.strongSubjects[0]) {
    const strongQuiz = MOCK_QUIZZES.find(q =>
      q.subject.toLowerCase().includes(stats.strongSubjects[0].toLowerCase())
    ) || MOCK_QUIZZES[1];
    recs.push({
      id: "strong-1",
      type: "quiz",
      title: `Master: ${stats.strongSubjects[0]}`,
      description: `You're doing well in ${stats.strongSubjects[0]}! Challenge yourself with a harder set.`,
      icon: "🏆",
      xp: strongQuiz.xpReward,
      link: `/quiz/${strongQuiz.id}`,
      priority: "medium",
      reason: "Build on your strengths",
      tag: "Strength",
    });
  }

  // 5. Memory game for retention
  recs.push({
    id: "memory",
    type: "challenge",
    title: "Memory Match Challenge",
    description: "Boost retention with a quick memory game. 5 minutes, big brain gains!",
    icon: "🧠",
    xp: 40,
    link: "/memory-match",
    priority: "medium",
    reason: "Improves long-term retention",
    tag: "Brain Boost",
  });

  // 6. Study notes if available
  try {
    const notes = JSON.parse(localStorage.getItem("vidyasetu_notes") || "[]");
    if (notes.length > 0) {
      const latest = notes[0];
      recs.push({
        id: "latest-notes",
        type: "note",
        title: `Read: ${latest.title}`,
        description: `Your teacher uploaded new notes for ${latest.subject}. Review before the quiz!`,
        icon: "📄",
        xp: 15,
        link: "/notes",
        priority: "medium",
        reason: "New material uploaded",
        tag: "New",
      });
    }
  } catch { /* skip */ }

  // 7. Videos if available
  try {
    const videos = JSON.parse(localStorage.getItem("vidyasetu_videos") || "[]");
    const unwatched = videos.filter((v: { views: number }) => v.views === 0);
    if (unwatched.length > 0) {
      recs.push({
        id: "unwatched-video",
        type: "video",
        title: `Watch: ${unwatched[0].title}`,
        description: `You haven't watched this ${unwatched[0].subject} lesson yet.`,
        icon: "🎬",
        xp: 20,
        link: "/videos",
        priority: "low",
        reason: "Unwatched lesson",
        tag: "New",
      });
    }
  } catch { /* skip */ }

  // 8. Badge progress
  const unearnedBadge = BADGES.find(b => !user.badges.includes(b.id));
  if (unearnedBadge) {
    recs.push({
      id: "badge-hunt",
      type: "challenge",
      title: `Unlock: ${unearnedBadge.name} ${unearnedBadge.icon}`,
      description: unearnedBadge.description,
      icon: unearnedBadge.icon,
      xp: 50,
      link: "/missions",
      priority: "low",
      reason: "Badge within reach",
      tag: "Badge",
    });
  }

  // Sort: high priority first
  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecCard({ rec, index }: { rec: Recommendation; index: number }) {
  const priorityStyles = {
    high: "border-primary/40 bg-primary/5",
    medium: "border-accent/30 bg-accent/5",
    low: "border-border bg-card",
  };
  const tagStyles: Record<string, string> = {
    "Needs Work": "bg-destructive/10 text-destructive",
    "Urgent": "bg-orange-500/10 text-orange-500",
    "Level Up": "bg-secondary/10 text-secondary",
    "Strength": "bg-green-500/10 text-green-500",
    "Brain Boost": "bg-purple-500/10 text-purple-400",
    "New": "bg-primary/10 text-primary",
    "Badge": "bg-yellow-500/10 text-yellow-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link to={rec.link}
        className={`flex items-center gap-4 p-4 rounded-2xl border transition hover:scale-[1.01] ${priorityStyles[rec.priority]}`}>
        <div className="w-12 h-12 rounded-xl bg-background border flex items-center justify-center text-2xl shrink-0">
          {rec.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">{rec.title}</p>
            {rec.tag && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[rec.tag] || "bg-muted text-muted-foreground"}`}>
                {rec.tag}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rec.description}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
            <Star className="w-3 h-3" />{rec.reason}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-bold text-secondary flex items-center gap-0.5">
            <Zap className="w-3 h-3" />+{rec.xp}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── AI-powered recommendation (calls Claude) ─────────────────────────────────
async function getAIRec(stats: StudyStats, userName: string, isOnline: boolean): Promise<string> {
  if (!isOnline) return "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Student: ${userName}, Level progress, weak subjects: ${stats.weakSubjects.join(", ")}, strong: ${stats.strongSubjects.join(", ")}, streak: ${stats.streakDays} days, avg score: ${Math.round(stats.avgScore)}%. 
Give a single SHORT, personalized, motivating study tip (2-3 sentences max). Be warm and encouraging. No lists. Just a personal message.`,
        }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch { return ""; }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const { user } = useAuth();
  const { isOnline } = usePWA();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [aiTip, setAiTip] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    const s = getStudyStats(user.xp, user.streak);
    setStats(s);
    setRecs(generateRecommendations(s, user.xp, user.level));

    // Fetch AI personalized tip
    if (isOnline) {
      setLoadingAI(true);
      getAIRec(s, user.name.split(" ")[0], isOnline).then(tip => {
        setAiTip(tip);
        setLoadingAI(false);
      });
    }
  }, [user, refreshKey, isOnline]);

  const refresh = () => {
    setRecs([]);
    setAiTip("");
    setRefreshKey(k => k + 1);
    toast.success("Recommendations refreshed!");
  };

  if (!user || !stats) return null;

  const highPriority = recs.filter(r => r.priority === "high");
  const rest = recs.filter(r => r.priority !== "high");

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> Smart Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Personalized just for you, {user.name.split(" ")[0]}</p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-muted hover:bg-muted/80 rounded-xl transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* AI Tip Box */}
      <div className="bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-accent uppercase tracking-wide">AI Personal Tip</span>
        </div>
        {loadingAI ? (
          <div className="space-y-2">
            <div className="h-3 bg-muted/60 rounded-full w-full animate-pulse" />
            <div className="h-3 bg-muted/60 rounded-full w-4/5 animate-pulse" />
          </div>
        ) : aiTip ? (
          <p className="text-sm leading-relaxed">{aiTip}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isOnline
              ? "Getting your personalized tip…"
              : "Connect to internet for AI-powered tips. Offline: Focus on your weak subjects first! 💪"}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <TrendingUp className="w-4 h-4 text-primary" />, label: "Avg Score", value: stats.avgScore ? `${Math.round(stats.avgScore)}%` : "—" },
          { icon: <Target className="w-4 h-4 text-accent" />, label: "Quizzes Done", value: stats.quizzesCompleted },
          { icon: <Clock className="w-4 h-4 text-secondary" />, label: "Day Streak", value: `${stats.streakDays}🔥` },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="font-bold text-lg">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Subject strength map */}
      <div className="bg-card border rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> Subject Snapshot</h3>
        <div className="space-y-2">
          {MOCK_QUIZZES.map(q => {
            const isWeak = stats.weakSubjects.includes(q.subject);
            const isStrong = stats.strongSubjects.includes(q.subject);
            const pct = isStrong ? 82 : isWeak ? 38 : 60;
            return (
              <div key={q.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 truncate">{q.subject}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isStrong ? "bg-green-500" : isWeak ? "bg-destructive" : "bg-primary"}`}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                </div>
                <span className={`text-xs font-bold w-8 ${isStrong ? "text-green-500" : isWeak ? "text-destructive" : "text-primary"}`}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Recommendations */}
      {highPriority.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-sm text-primary uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <Zap className="w-4 h-4" /> Do These First
          </h2>
          <div className="space-y-3">
            {highPriority.map((r, i) => <RecCard key={r.id} rec={r} index={i} />)}
          </div>
        </div>
      )}

      {/* More Suggestions */}
      {rest.length > 0 && (
        <div>
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <Video className="w-4 h-4" /> More For You
          </h2>
          <div className="space-y-3">
            {rest.map((r, i) => <RecCard key={r.id} rec={r} index={i} />)}
          </div>
        </div>
      )}

      {recs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🌟</p>
          <p className="font-bold text-lg">Generating your plan…</p>
          <p className="text-muted-foreground text-sm">Loading recommendations</p>
        </div>
      )}
    </div>
  );
}
