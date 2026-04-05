import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getAllQuizzes, getAllUsers, getLeaderboard } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { BarChart3, TrendingUp, Users, BookOpen, Trophy, Zap, Target, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";

function useAnalytics() {
  return useMemo(() => {
    const allQuizzes = getAllQuizzes();
    const allUsers = getAllUsers();
    const students = allUsers.filter(u => u.role === "student");

    // Quiz results from localStorage
    const results: Array<{ quizId: string; score: number; total: number; userId: string; date: string }> = [];
    try {
      const stored = JSON.parse(localStorage.getItem("vidyasetu_quiz_results") || "[]");
      results.push(...stored);
    } catch {}

    // Subject performance from real results
    const subjectMap: Record<string, { total: number; count: number; attempts: number }> = {};
    allQuizzes.forEach(q => {
      const qResults = results.filter(r => r.quizId === q.id);
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { total: 0, count: 0, attempts: 0 };
      qResults.forEach(r => {
        subjectMap[q.subject].total += Math.round((r.score / r.total) * 100);
        subjectMap[q.subject].count++;
      });
      subjectMap[q.subject].attempts += qResults.length;
    });

    const subjectData = Object.entries(subjectMap).map(([subject, data]) => ({
      subject: subject.slice(0, 7),
      avgScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
      attempts: data.attempts,
    }));

    // Weekly activity (last 7 days)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayResults = results.filter(r => r.date === dateStr);
      return {
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        quizzes: dayResults.length,
        students: new Set(dayResults.map(r => r.userId)).size,
      };
    });

    // Score distribution from real results
    const distribution = [
      { range: "0-20%", count: 0, color: "#ef4444" },
      { range: "21-40%", count: 0, color: "#f97316" },
      { range: "41-60%", count: 0, color: "#eab308" },
      { range: "61-80%", count: 0, color: "#22c55e" },
      { range: "81-100%", count: 0, color: "#6366f1" },
    ];
    results.forEach(r => {
      const pct = Math.round((r.score / r.total) * 100);
      if (pct <= 20) distribution[0].count++;
      else if (pct <= 40) distribution[1].count++;
      else if (pct <= 60) distribution[2].count++;
      else if (pct <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    // At risk students (lowest XP)
    const atRisk = students
      .sort((a, b) => a.xp - b.xp)
      .slice(0, 3)
      .map(s => ({
        ...s,
        avgScore: s.xp > 0 ? Math.min(Math.round(s.xp / 10), 100) : 0,
        lastActive: localStorage.getItem("vidyasetu_last_login_" + s.email) || "Never",
      }));

    const notesCount = JSON.parse(localStorage.getItem("vidyasetu_notes") || "[]").length;
    const videosCount = JSON.parse(localStorage.getItem("vidyasetu_videos") || "[]").length;
    const today = new Date().toISOString().split("T")[0];
    const activeToday = allUsers.filter(u => localStorage.getItem("vidyasetu_last_login_" + u.email) === today).length;

    return {
      subjectData,
      weeklyData,
      distribution,
      atRisk,
      notesCount,
      videosCount,
      totalStudents: students.length,
      activeToday,
      totalAttempts: results.length,
      avgScore: results.length > 0
        ? Math.round(results.reduce((a, r) => a + Math.round((r.score / r.total) * 100), 0) / results.length)
        : 0,
      allQuizzes,
    };
  }, []);
}

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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const {
    subjectData, weeklyData, distribution, atRisk,
    notesCount, videosCount, totalStudents, activeToday,
    totalAttempts, avgScore, allQuizzes,
  } = useAnalytics();
  const leaderboard = getLeaderboard();

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Class performance — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => exportCSV(
            subjectData.length > 0
              ? subjectData.map(s => ({ Subject: s.subject, "Avg Score": s.avgScore + "%", Attempts: s.attempts }))
              : [{ Subject: "No data", "Avg Score": "0%", Attempts: 0 }],
            "vidyasetu-report.csv"
          )}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Total Students" value={totalStudents} sub={`${activeToday} active today`} color="bg-primary/15" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Avg Score" value={totalAttempts > 0 ? `${avgScore}%` : "No data"} sub="Across all quizzes" color="bg-green-500/15" />
        <StatCard icon={<BookOpen className="w-5 h-5 text-accent" />} label="Quiz Attempts" value={totalAttempts} sub="Total attempts" color="bg-accent/15" />
        <StatCard icon={<Zap className="w-5 h-5 text-secondary" />} label="Materials" value={`${notesCount}N · ${videosCount}V`} sub="Notes & Videos" color="bg-secondary/15" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Weekly Activity
          </h2>
          {weeklyData.some(d => d.quizzes > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="quizzes" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Quizzes" />
                <Line type="monotone" dataKey="students" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Students" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No quiz activity yet this week
            </div>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Score Distribution
          </h2>
          {totalAttempts > 0 ? (
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
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No quiz results yet
            </div>
          )}
        </div>
      </div>

      {subjectData.length > 0 && (
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Subject Performance
          </h2>
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
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary" /> Quiz Breakdown
          </h2>
          <div className="space-y-3">
            {allQuizzes.map((q, i) => {
              const qResults = JSON.parse(localStorage.getItem("vidyasetu_quiz_results") || "[]")
                .filter((r: { quizId: string }) => r.quizId === q.id);
              const avg = qResults.length > 0
                ? Math.round(qResults.reduce((a: number, r: { score: number; total: number }) => a + Math.round((r.score / r.total) * 100), 0) / qResults.length)
                : 0;
              return (
                <div key={q.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold truncate">{q.title}</span>
                    <span className={`font-bold text-xs ${avg >= 80 ? "text-green-500" : avg >= 60 ? "text-yellow-500" : avg > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {avg > 0 ? `${avg}%` : "No attempts"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${avg}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {q.questions.length} questions · {q.xpReward} XP · {qResults.length} attempts
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Needs Attention
          </h2>
          {atRisk.length > 0 ? (
            <div className="space-y-3">
              {atRisk.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                  <span className="text-xl">{s.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Last login: {s.lastActive}</p>
                  </div>
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                    {s.xp} XP
                  </span>
                </div>
              ))}
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground">
                💡 Consider sharing targeted notes with these students.
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No students registered yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-secondary" /> Top Performers
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {leaderboard.slice(0, 4).map((s, i) => (
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