import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { MOCK_QUIZZES, LEADERBOARD } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { BookOpen, Users, PlusCircle, FileText, BarChart3, Video } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Welcome, {user.name} 👩‍🏫</h1>
        <p className="text-muted-foreground text-sm">Manage your quizzes, notes, and videos</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <BookOpen className="w-5 h-5 text-primary" />, label: "Quizzes", value: MOCK_QUIZZES.length, bg: "bg-primary/10" },
          { icon: <Users className="w-5 h-5 text-accent" />, label: "Students", value: 32, bg: "bg-accent/10" },
          { icon: <FileText className="w-5 h-5 text-secondary" />, label: "Notes", value: (() => { try { return JSON.parse(localStorage.getItem("vidyasetu_notes") || "[]").length; } catch { return 0; } })(), bg: "bg-secondary/10" },
          { icon: <Video className="w-5 h-5 text-primary" />, label: "Videos", value: (() => { try { return JSON.parse(localStorage.getItem("vidyasetu_videos") || "[]").length; } catch { return 0; } })(), bg: "bg-primary/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} rounded-2xl p-4 border`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-semibold text-muted-foreground">{s.label}</span></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/create-quiz" className="bg-primary text-primary-foreground rounded-2xl p-5 card-hover flex flex-col items-center gap-2 text-center">
          <PlusCircle className="w-8 h-8" />
          <span className="font-bold text-sm">Create Quiz</span>
        </Link>
        <Link to="/live-quiz" className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 card-hover flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">🔴</span>
          <span className="font-bold text-sm text-destructive">Live Quiz</span>
        </Link>
        <Link to="/notes" className="bg-card border rounded-2xl p-5 card-hover flex flex-col items-center gap-2 text-center">
          <FileText className="w-8 h-8 text-secondary" />
          <span className="font-bold text-sm">Upload Notes</span>
        </Link>
        <Link to="/videos" className="bg-card border rounded-2xl p-5 card-hover flex flex-col items-center gap-2 text-center">
          <Video className="w-8 h-8 text-accent" />
          <span className="font-bold text-sm">Upload Videos</span>
        </Link>
        <Link to="/analytics" className="bg-card border rounded-2xl p-5 card-hover flex flex-col items-center gap-2 text-center md:col-span-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          <span className="font-bold text-sm">View Analytics</span>
        </Link>
        <Link to="/ai-assistant" className="bg-card border rounded-2xl p-5 card-hover flex flex-col items-center gap-2 text-center md:col-span-2">
          <span className="text-3xl">🤖</span>
          <span className="font-bold text-sm">AI Assistant</span>
        </Link>
      </div>

      {/* My Quizzes */}
      <div>
        <h2 className="text-lg font-bold mb-3">Your Quizzes</h2>
        <div className="space-y-3">
          {MOCK_QUIZZES.map((q) => (
            <div key={q.id} className="bg-card rounded-xl border p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{q.title}</h3>
                <p className="text-xs text-muted-foreground">{q.subject} • {q.questions.length} questions • Created {q.createdAt}</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">{q.xpReward} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Performance */}
      <div>
        <h2 className="text-lg font-bold mb-3">Top Students</h2>
        <div className="bg-card rounded-xl border divide-y">
          {LEADERBOARD.slice(0, 5).map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{s.avatar}</span>
              <span className="font-semibold text-sm flex-1">{s.name}</span>
              <span className="text-xs font-bold text-accent">Lv.{s.level}</span>
              <span className="text-xs font-bold text-secondary">{s.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
