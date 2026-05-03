import { useState, useEffect, useCallback } from "react";
import { MOCK_MISSIONS, MOCK_QUIZZES } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Gamepad2, Swords, Clock, Brain, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function MissionsPage() {
  const { user, updateXP } = useAuth();
  const navigate = useNavigate();

  const getMissionKey = () => `vidyasetu_missions_${user?.id}`;

  const [completed, setCompleted] = useState<string[]>(() => {
    if (!user) return [];
    return JSON.parse(localStorage.getItem(`vidyasetu_missions_${user.id}`) || "[]");
  });

  const [activeMission, setActiveMission] = useState<string | null>(() => {
    return localStorage.getItem("vidyasetu_active_mission");
  });

  const handleComplete = useCallback((missionId: string, xpReward: number) => {
    setCompleted(prev => {
      if (prev.includes(missionId)) return prev;
      const updated = [...prev, missionId];
      localStorage.setItem(`vidyasetu_missions_${user?.id}`, JSON.stringify(updated));
      updateXP(xpReward);
      toast.success(`Mission complete! +${xpReward} XP 🎉`);
      return updated;
    });
  }, [user, updateXP]);

  // Check if active mission was completed when user returns
  useEffect(() => {
    if (!user || !activeMission) return;

    const results = JSON.parse(localStorage.getItem(`vidyasetu_quiz_results_${user.id}`) || "[]");
    const latestResult = results[results.length - 1];
    if (!latestResult) return;

    if (activeMission === "m1") {
      const mathResults = results.filter((r: { quizId: string }) => {
        const quiz = MOCK_QUIZZES.find(q => q.id === r.quizId);
        return quiz?.subject.toLowerCase().includes("math");
      });
      if (mathResults.length >= 3) {
        handleComplete("m1", 100);
        localStorage.removeItem("vidyasetu_active_mission");
        setActiveMission(null);
      }
    }

    if (activeMission === "m3") {
      const speedDone = localStorage.getItem(`vidyasetu_speed_challenge_${user.id}`);
      if (speedDone) {
        handleComplete("m3", 120);
        localStorage.removeItem("vidyasetu_active_mission");
        localStorage.removeItem(`vidyasetu_speed_challenge_${user.id}`);
        setActiveMission(null);
      }
    }

    if (activeMission === "m4") {
      const sciencePass = results.find((r: { quizId: string; score: number; total: number }) => {
        const quiz = MOCK_QUIZZES.find(q => q.id === r.quizId);
        return quiz?.subject.toLowerCase().includes("science") &&
          Math.round((r.score / r.total) * 100) >= 80;
      });
      if (sciencePass) {
        handleComplete("m4", 90);
        localStorage.removeItem("vidyasetu_active_mission");
        setActiveMission(null);
      }
    }

    if (activeMission === "m2") {
      const memoryWins = parseInt(localStorage.getItem(`vidyasetu_memory_wins_${user.id}`) || "0");
      if (memoryWins >= 1) {
        handleComplete("m2", 80);
        localStorage.removeItem("vidyasetu_active_mission");
        setActiveMission(null);
      }
    }
  }, [user, activeMission]);

  const handleStart = (missionId: string, type: string) => {
    localStorage.setItem("vidyasetu_active_mission", missionId);
    setActiveMission(missionId);

    if (type === "memory") {
      navigate("/memory-match");
    } else if (missionId === "m1") {
      const mathQuiz = MOCK_QUIZZES.find(q => q.subject.toLowerCase().includes("math"));
      navigate(mathQuiz ? `/quiz/${mathQuiz.id}` : "/quizzes");
    } else if (missionId === "m3") {
      toast.info("Finish the quiz in half the time to complete this mission! ⚡");
      navigate(`/quiz/${MOCK_QUIZZES[0].id}`);
    } else if (missionId === "m4") {
      const scienceQuiz = MOCK_QUIZZES.find(q => q.subject.toLowerCase().includes("science"));
      navigate(scienceQuiz ? `/quiz/${scienceQuiz.id}` : "/quizzes");
    } else {
      navigate("/quizzes");
    }
  };

  const totalXP = MOCK_MISSIONS.reduce((a, m) => a + m.xpReward, 0);
  const earnedXP = MOCK_MISSIONS
    .filter(m => completed.includes(m.id))
    .reduce((a, m) => a + m.xpReward, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold">Missions</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Mission XP</p>
          <p className="font-bold text-secondary">{earnedXP} / {totalXP} XP</p>
        </div>
      </div>

      <div className="w-full h-3 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: totalXP > 0 ? `${(earnedXP / totalXP) * 100}%` : "0%" }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_MISSIONS.map((m, i) => {
          const isCompleted = completed.includes(m.id);
          const isActive = activeMission === m.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card rounded-2xl border p-5 transition ${isCompleted ? "opacity-60" : "card-hover"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  m.type === "quiz" ? "bg-primary/10" :
                  m.type === "memory" ? "bg-accent/10" : "bg-secondary/10"
                }`}>
                  {m.type === "quiz" ? <Swords className="w-6 h-6 text-primary" /> :
                   m.type === "memory" ? <Brain className="w-6 h-6 text-accent" /> :
                   <Clock className="w-6 h-6 text-secondary" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                  {isActive && !isCompleted && (
                    <p className="text-xs text-accent font-bold mt-1">⚡ In Progress</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      m.difficulty === "easy" ? "bg-primary/20 text-primary" :
                      m.difficulty === "medium" ? "bg-secondary/20 text-secondary" :
                      "bg-destructive/20 text-destructive"
                    }`}>{m.difficulty}</span>
                    <span className="text-xs font-bold text-secondary flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> +{m.xpReward} XP
                    </span>
                  </div>
                </div>

                {isCompleted ? (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                    ✓ Done
                  </span>
                ) : (
                  <button
                    onClick={() => handleStart(m.id, m.type)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition shrink-0 ${
                      m.type === "memory" ? "bg-accent text-accent-foreground" :
                      "bg-primary text-primary-foreground"
                    }`}
                  >
                    {isActive ? "Continue" : m.type === "memory" ? "Play" : "Start"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {completed.length === MOCK_MISSIONS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 text-center bg-gradient-to-br from-primary/10 to-accent/10 border rounded-2xl p-8"
        >
          <p className="text-5xl mb-3">🏆</p>
          <h2 className="text-2xl font-bold">All Missions Complete!</h2>
          <p className="text-muted-foreground mt-1">You earned {totalXP} XP from missions. Incredible!</p>
        </motion.div>
      )}
    </div>
  );
}