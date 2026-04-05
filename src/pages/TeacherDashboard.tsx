import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { getAllQuizzes, getLeaderboard, getAllUsers } from "@/lib/store";
import { Link } from "react-router-dom";
import { BookOpen, Users, PlusCircle, FileText, BarChart3, Video } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const allQuizzes = getAllQuizzes();
  const topStudents = getLeaderboard().slice(0, 5);
  const notes = JSON.parse(localStorage.getItem("vidyasetu_notes") || "[]");
  const videos = JSON.parse(localStorage.getItem("vidyasetu_videos") || "[]");

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Welcome, {user.name} 👩‍🏫</h1>
        <p className="text-muted-foreground text-sm">Manage your quizzes, notes, and videos</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <BookOpen className="w-5 h-5 text-primary" />, label: "Quizzes", value: allQuizzes.length, bg: "bg-primary/10" },
          { icon: <Users className="w-5 h-5 text-accent" />, label: "Students", value: getAllUsers().filter(u => u.role === "student").length, bg: "bg-accent/10" },
          { icon: <FileText className="w-5 h-5 text-secondary" />, label: "Notes", value: notes.length, bg: "bg-secondary/10" },
          { icon: <Video className="w-5 h-5 text-primary" />, label: "Videos", value: videos.length, bg: "bg-primary/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} rounded-2xl p-4 border`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-semibold text-muted-foreground">{s.label}</span></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

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

      <div>
        <h2 className="text-lg font-bold mb-3">Your Quizzes</h2>
        <div className="space-y-3">
          {allQuizzes.map((q) => (
            <div key={q.id} className="bg-card rounded-xl border p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{q.title}</h3>
                <p className="text-xs text-muted-foreground">{q.subject} • {q.questions.length} questions • Created {q.createdAt}</p>
              </div>
              <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">{q.xpReward} XP</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Top Students</h2>
        <div className="bg-card rounded-xl border divide-y">
          {topStudents.map((s, i) => (
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