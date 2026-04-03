import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_QUIZZES, LEADERBOARD } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Users, BookOpen, Trophy, Zap, Target, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";

// ─── Derived data ─────────────────────────────────────────────────────────────
function useAnalytics() {
  return useMemo(() => {
    // Subject performance
    const subjectData = MOCK_QUIZZES.map(q => ({
      subject: q.subject.slice(0, 7),
      avgScore: Math.floor(55 + Math.random() * 35), // mock
      attempts: Math.floor(10 + Math.random() * 20),
      xpGiven: q.xpReward,
    }));

    // Weekly activity (last 7 days)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        quizzes: Math.floor(2 + Math.random() * 8),
        students: Math.floor(5 + Math.random() * 15),
      };
    });

    // Score distribution
    const distribution = [
      { range: "0-20%", count: 3, color: "#ef4444" },
      { range: "21-40%", count: 5, color: "#f97316" },
      { range: "41-60%", count: 10, color: "#eab308" },
      { range: "61-80%", count: 18, color: "#22c55e" },
      { range: "81-100%", count: 8, color: "#6366f1" },
    ];

    // Students needing help (low scorers)
    const atRisk = LEADERBOARD.slice(-3).map(s => ({
      ...s,
      avgScore: Math.floor(30 + Math.random() * 25),
      lastActive: `${Math.floor(1 + Math.random() * 5)} days ago`,
      weakSubject: ["Math", "Science", "English"][Math.floor(Math.random() * 3)],
    }));

    // Notes & videos
    let notesCount = 0, videosCount = 0;
    try { notesCount = JSON.parse(localStorage.getItem("vidyasetu_notes") || "[]").length; } catch {}
    try { videosCount = JSON.parse(localStorage.getItem("vidyasetu_videos") || "[]").length; } catch {}

    return { subjectData, weeklyData, distribution, atRisk, notesCount, videosCount };
  }, []);
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-black text-2xl mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b"];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

// ─── Export report ────────────────────────────────────────────────────────────
function exportCSV(data: Array<Record<string, string | number>>, filename: string) {
  const keys = Object.keys(data[0]);
  const rows = [keys.join(","), ...data.map(r => keys.map(k => r[k]).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  toast.success("Report downloaded!");
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuth();
  const { subjectData, weeklyData, distribution, atRisk, notesCount, videosCount } = useAnalytics();

  if (!user) return null;

  const totalStudents = 32;
  const activeToday = 18;
  const avgScore = Math.round(subjectData.reduce((a, b) => a + b.avgScore, 0) / subjectData.length);
  const totalAttempts = subjectData.reduce((a, b) => a + b.attempts, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-7 h-7 text-primary" /> Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Class performance overview — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        </div>
        <button
          onClick={() => exportCSV(subjectData.map(s => ({ Subject: s.subject, "Avg Score": s.avgScore + "%", Attempts: s.attempts })), "vidyasetu-report.csv")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Total Students" value={totalStudents} sub={`${activeToday} active today`} color="bg-primary/15" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Avg Score" value={`${avgScore}%`} sub="Across all subjects" color="bg-green-500/15" />
        <StatCard icon={<BookOpen className="w-5 h-5 text-accent" />} label="Quiz Attempts" value={totalAttempts} sub="This month" color="bg-accent/15" />
        <StatCard icon={<Zap className="w-5 h-5 text-secondary" />} label="Materials" value={`${notesCount}N · ${videosCount}V`} sub="Notes & Videos uploaded" color="bg-secondary/15" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly activity */}
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="quizzes" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Quizzes" />
              <Line type="monotone" dataKey="students" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Active Students" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Quizzes taken</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Active students</span>
          </div>
        </div>

        {/* Score distribution */}
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Students">
                {distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject performance */}
      <div className="bg-card border rounded-2xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Subject Performance</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={subjectData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} name="Avg Score %">
              {subjectData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {subjectData.map((s, i) => (
            <div key={i} className="bg-muted rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{s.subject}</span>
                <span className={`text-xs font-bold ${s.avgScore >= 70 ? "text-green-500" : s.avgScore >= 50 ? "text-yellow-500" : "text-destructive"}`}>{s.avgScore}%</span>
              </div>
              <div className="h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  initial={{ width: 0 }} animate={{ width: `${s.avgScore}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{s.attempts} attempts</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quiz-wise breakdown */}
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-secondary" /> Quiz Breakdown</h2>
          <div className="space-y-3">
            {MOCK_QUIZZES.map((q, i) => {
              const completion = Math.floor(60 + Math.random() * 35);
              return (
                <div key={q.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold truncate">{q.title}</span>
                    <span className={`font-bold text-xs ${completion >= 80 ? "text-green-500" : completion >= 60 ? "text-yellow-500" : "text-destructive"}`}>{completion}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{q.questions.length} questions · {q.xpReward} XP · {q.subject}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* At-risk students */}
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Needs Attention
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Students with low scores or inactive</p>
          <div className="space-y-3">
            {atRisk.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <span className="text-xl">{s.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Weak: {s.weakSubject} · Last active: {s.lastActive}</p>
                </div>
                <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">{s.avgScore}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground">
            💡 Consider sending a reminder or sharing targeted notes with these students.
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div className="bg-card border rounded-2xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-secondary" /> Top Performers</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {LEADERBOARD.slice(0, 4).map((s, i) => (
            <div key={i} className={`text-center p-4 rounded-2xl border ${i === 0 ? "bg-secondary/10 border-secondary/30" : "bg-muted"}`}>
              <p className="text-3xl mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🎖️"}</p>
              <p className="text-2xl">{s.avatar}</p>
              <p className="font-bold text-sm mt-1">{s.name}</p>
              <p className="text-xs text-muted-foreground">Lv.{s.level}</p>
              <p className="font-black text-secondary text-sm mt-1">{s.xp} XP</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
