import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { MOCK_QUIZZES, MOCK_MISSIONS, BADGES, LEADERBOARD, getXPProgress } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { Zap, Trophy, Flame, Target, BookOpen, Gamepad2, Brain, Sparkles, Radio } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const earnedBadges = BADGES.filter((b) => user.badges.includes(b.id));
  const activeMissions = MOCK_MISSIONS.filter((m) => !m.completed);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Welcome & Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl">{user.avatar}</span>
          <div>
            <h1 className="text-2xl font-bold">Hey, {user.name.split(" ")[0]}! 👋</h1>
            <p className="text-muted-foreground text-sm">Ready to learn something awesome?</p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Zap className="w-5 h-5 text-secondary" />, label: "Total XP", value: user.xp, bg: "bg-secondary/10" },
          { icon: <Trophy className="w-5 h-5 text-accent" />, label: "Level", value: user.level, bg: "bg-accent/10" },
          { icon: <Flame className="w-5 h-5 text-streak" />, label: "Streak", value: `${user.streak} days`, bg: "bg-streak/10" },
          { icon: <Target className="w-5 h-5 text-primary" />, label: "Badges", value: earnedBadges.length, bg: "bg-primary/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} rounded-2xl p-4 border`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-semibold text-muted-foreground">{s.label}</span></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* XP Progress Bar */}
      <div className="bg-card rounded-2xl border p-4">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span>Level {user.level}</span>
          <span className="text-muted-foreground">{user.xp % 200}/200 XP to next level</span>
        </div>
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${getXPProgress(user.xp)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>
      </div>

      {/* Quick feature cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/live-quiz" className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 card-hover flex items-center gap-3">
          <Radio className="w-6 h-6 text-destructive shrink-0" />
          <div>
            <p className="font-bold text-sm text-destructive">Live Quiz</p>
            <p className="text-xs text-muted-foreground">Join your class</p>
          </div>
        </Link>
        <Link to="/recommendations" className="bg-accent/10 border border-accent/30 rounded-2xl p-4 card-hover flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-accent shrink-0" />
          <div>
            <p className="font-bold text-sm">For You</p>
            <p className="text-xs text-muted-foreground">Smart picks</p>
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Available Quizzes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Available Quizzes</h2>
          </div>
          <div className="space-y-3">
            {MOCK_QUIZZES.map((q) => (
              <Link key={q.id} to={`/quiz/${q.id}`}
                className="block bg-card rounded-xl border p-4 card-hover">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{q.title}</h3>
                    <p className="text-xs text-muted-foreground">{q.subject} • {q.questions.length} questions • {q.timeLimit} min</p>
                  </div>
                  <span className="bg-secondary/20 text-secondary text-xs font-bold px-2 py-1 rounded-full">+{q.xpReward} XP</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Missions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold">Active Missions</h2>
          </div>
          <div className="space-y-3">
            {activeMissions.map((m) => (
              <Link key={m.id} to="/missions"
                className="block bg-card rounded-xl border p-4 card-hover">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{m.title}</h3>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    m.difficulty === "easy" ? "bg-primary/20 text-primary" :
                    m.difficulty === "medium" ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
                  }`}>{m.difficulty}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-level" />
          <h2 className="text-lg font-bold">Your Badges</h2>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {BADGES.map((b) => (
            <div key={b.id} className={`flex flex-col items-center p-3 rounded-xl border text-center transition ${
              user.badges.includes(b.id) ? "bg-card" : "bg-muted/50 opacity-40"
            }`}>
              <span className="text-2xl mb-1">{b.icon}</span>
              <span className="text-[10px] font-bold leading-tight">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-bold">Top Learners</h2>
          </div>
          <Link to="/leaderboard" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
        </div>
        <div className="bg-card rounded-xl border divide-y">
          {LEADERBOARD.slice(0, 5).map((l, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className={`text-sm font-bold w-6 text-center ${i < 3 ? "text-secondary" : "text-muted-foreground"}`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span className="text-lg">{l.avatar}</span>
              <span className="font-semibold text-sm flex-1">{l.name}</span>
              <span className="text-xs font-bold text-muted-foreground">Lv.{l.level}</span>
              <span className="text-xs font-bold text-secondary">{l.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
