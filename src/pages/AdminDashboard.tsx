import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { LEADERBOARD } from "@/lib/mockData";
import { Users, BookOpen, Shield, BarChart3, Activity } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Admin Panel 🛡️</h1>
        <p className="text-muted-foreground text-sm">Overview of your VidyaSetu platform</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Users className="w-5 h-5 text-primary" />, label: "Total Users", value: 156, bg: "bg-primary/10" },
          { icon: <Shield className="w-5 h-5 text-accent" />, label: "Teachers", value: 12, bg: "bg-accent/10" },
          { icon: <BookOpen className="w-5 h-5 text-secondary" />, label: "Quizzes", value: 48, bg: "bg-secondary/10" },
          { icon: <Activity className="w-5 h-5 text-primary" />, label: "Active Today", value: 67, bg: "bg-primary/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} rounded-2xl p-4 border`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-semibold text-muted-foreground">{s.label}</span></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart Placeholder */}
      <div className="bg-card rounded-2xl border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Platform Activity</h2>
        <div className="flex items-end gap-2 h-40">
          {[40, 65, 50, 80, 70, 90, 85, 60, 75, 95, 88, 72].map((h, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-lg" />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-semibold">
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>

      {/* Recent Users */}
      <div>
        <h2 className="text-lg font-bold mb-3">Recent Users</h2>
        <div className="bg-card rounded-xl border">
          <div className="grid grid-cols-4 px-4 py-2 text-xs font-bold text-muted-foreground border-b">
            <span>User</span><span>Role</span><span>Level</span><span>XP</span>
          </div>
          {LEADERBOARD.map((u, i) => (
            <div key={i} className="grid grid-cols-4 items-center px-4 py-3 border-b last:border-0">
              <span className="font-semibold text-sm flex items-center gap-2"><span>{u.avatar}</span> {u.name}</span>
              <span className="text-xs font-semibold text-muted-foreground">Student</span>
              <span className="text-xs font-bold text-accent">Lv.{u.level}</span>
              <span className="text-xs font-bold text-secondary">{u.xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
