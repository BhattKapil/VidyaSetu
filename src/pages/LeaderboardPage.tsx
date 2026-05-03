import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/store";

interface LeaderboardUser {
  name: string;
  xp: number;
  level: number;
  avatar: string;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => {
    // Start with localStorage data instantly
    const cached = localStorage.getItem("vidyasetu_leaderboard_cache");
    return cached ? JSON.parse(cached) : getLeaderboard();
  });

  useEffect(() => {
    // Try backend
    fetch("/api/user/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaderboard(data);
          localStorage.setItem("vidyasetu_leaderboard_cache", JSON.stringify(data));
        }
      })
      .catch(() => {
        // Offline — already showing cached data
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-secondary" />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-bold">No students yet</p>
          <p className="text-sm">Be the first to earn XP!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-3 mb-8 h-48">
            {[1, 0, 2].map((idx) => {
              const l = leaderboard[idx];
              if (!l) return null;
              const heights = [160, 120, 100];
              return (
                <motion.div key={idx}
                  initial={{ height: 0 }}
                  animate={{ height: heights[idx] }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className={`flex flex-col items-center justify-end pb-3 rounded-t-2xl w-24 ${
                    idx === 0 ? "bg-secondary/20" :
                    idx === 1 ? "bg-accent/20" : "bg-primary/20"
                  }`}>
                  <span className="text-3xl mb-1">{l.avatar}</span>
                  <span className="text-xs font-bold">{l.name}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">{l.xp} XP</span>
                  <span className="text-lg mt-1">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Full list */}
          <div className="bg-card rounded-xl border divide-y">
            {leaderboard.map((l, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-3 ${user?.name === l.name ? "bg-primary/5" : ""}`}>
                <span className={`text-sm font-bold w-8 text-center ${i < 3 ? "text-secondary" : "text-muted-foreground"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className="text-xl">{l.avatar}</span>
                <span className="font-semibold text-sm flex-1">
                  {l.name} {user?.name === l.name && <span className="text-xs text-primary">(You)</span>}
                </span>
                <span className="text-xs font-bold text-accent">Lv.{l.level}</span>
                <span className="text-xs font-bold text-secondary">{l.xp} XP</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}