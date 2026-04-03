import { MOCK_MISSIONS } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Gamepad2, Swords, Clock, Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function MissionsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Gamepad2 className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold">Missions</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_MISSIONS.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-card rounded-2xl border p-5 card-hover ${m.completed ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                m.type === "quiz" ? "bg-primary/10" : m.type === "memory" ? "bg-accent/10" : "bg-secondary/10"
              }`}>
                {m.type === "quiz" ? <Swords className="w-6 h-6 text-primary" /> :
                 m.type === "memory" ? <Brain className="w-6 h-6 text-accent" /> :
                 <Clock className="w-6 h-6 text-secondary" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    m.difficulty === "easy" ? "bg-primary/20 text-primary" :
                    m.difficulty === "medium" ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
                  }`}>{m.difficulty}</span>
                  <span className="text-xs font-bold text-secondary">+{m.xpReward} XP</span>
                </div>
              </div>
              {m.completed ? (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">✓ Done</span>
              ) : m.type === "memory" ? (
                <Link to="/memory-match" className="text-xs font-bold bg-accent text-accent-foreground px-3 py-1.5 rounded-full hover:opacity-90 transition">Play</Link>
              ) : (
                <button className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:opacity-90 transition">Start</button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
