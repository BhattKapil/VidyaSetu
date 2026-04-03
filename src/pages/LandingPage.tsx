import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Gamepad2, Brain, Trophy, Zap, Wifi } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌉</span>
          <span className="font-display text-xl font-bold text-primary">VidyaSetu</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition">Log In</Link>
          <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition">Sign Up Free</Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-16 md:py-24 text-center max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <Wifi className="w-4 h-4" /> Works Offline
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Learn. Play.<br />
            <span className="text-primary">Level Up.</span> 🚀
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A gamified learning platform built for students everywhere — even with low internet. 
            Earn XP, unlock badges, climb the leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition shadow-lg">
              Get Started — It's Free
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-2xl border-2 border-primary text-primary font-bold text-lg hover:bg-primary/5 transition">
              Demo Login
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to learn smarter 💡</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <BookOpen className="w-8 h-8" />, title: "Interactive Quizzes", desc: "MCQ quizzes with timers, instant feedback, and XP rewards", color: "text-primary", bg: "bg-primary/10" },
            { icon: <Gamepad2 className="w-8 h-8" />, title: "Fun Games", desc: "Memory match, timed challenges, and mission mode to make learning fun", color: "text-accent", bg: "bg-accent/10" },
            { icon: <Zap className="w-8 h-8" />, title: "XP & Levels", desc: "Earn experience points, level up, and unlock achievement badges", color: "text-secondary", bg: "bg-secondary/10" },
            { icon: <Trophy className="w-8 h-8" />, title: "Leaderboard", desc: "Compete with classmates and see who's the top learner", color: "text-secondary", bg: "bg-secondary/10" },
            { icon: <Brain className="w-8 h-8" />, title: "AI Study Buddy", desc: "Get instant help with doubts, study plans, and smart reminders", color: "text-accent", bg: "bg-accent/10" },
            { icon: <Wifi className="w-8 h-8" />, title: "Offline First", desc: "Works even without internet — syncs automatically when you're back online", color: "text-primary", bg: "bg-primary/10" },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border p-6 card-hover">
              <div className={`w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center ${f.color} mb-4`}>{f.icon}</div>
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-12">Built for everyone 🏫</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { emoji: "🧑‍🎓", role: "Students", features: ["Take quizzes", "Play games", "Track progress", "Earn rewards"] },
            { emoji: "👩‍🏫", role: "Teachers", features: ["Create quizzes", "Upload notes", "Monitor students", "Set missions"] },
            { emoji: "👨‍💼", role: "Admins", features: ["Manage users", "View analytics", "Platform settings", "Reports"] },
          ].map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border p-6 text-center">
              <span className="text-5xl block mb-3">{r.emoji}</span>
              <h3 className="font-bold text-lg mb-3">{r.role}</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {r.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>🌉 VidyaSetu — Gamified Learning for Everyone</p>
          <p className="mt-1">Built with ❤️ for students in low-connectivity areas</p>
        </div>
      </footer>
    </div>
  );
}
