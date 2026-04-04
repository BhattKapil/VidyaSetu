import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MOCK_QUIZZES } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateXP, awardBadge } = useAuth();

  const customQuizzes = JSON.parse(localStorage.getItem("vidyasetu_quizzes") || "[]");
  const allQuizzes = [...MOCK_QUIZZES, ...customQuizzes];
  const quiz = allQuizzes.find((q) => q.id === id);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState((quiz?.timeLimit ?? 5) * 60);
  const xpAwarded = useRef(false);

  // Timer
  useEffect(() => {
    if (finished || !quiz) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { setFinished(true); clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, quiz]);

  // Award XP and badges exactly once when quiz finishes
  useEffect(() => {
    if (!finished || !quiz || xpAwarded.current) return;
    xpAwarded.current = true;

    const total = quiz.questions.length;
    const xpEarned = Math.round((score / total) * quiz.xpReward);
    if (xpEarned > 0) updateXP(xpEarned);

    // Badge: First Steps — complete any quiz
    awardBadge("1");

    // Badge: Speed Demon — finish with >50% time left
    const totalTime = quiz.timeLimit * 60;
    if (timeLeft > totalTime / 2) awardBadge("5");

    // Badge: Night Owl — study after 10 PM
    const hour = new Date().getHours();
    if (hour >= 22) awardBadge("7");

    // Badge: Brain Power — 50 correct answers total
    const prevCorrect = parseInt(localStorage.getItem("vidyasetu_total_correct") || "0");
    const newCorrect = prevCorrect + score;
    localStorage.setItem("vidyasetu_total_correct", String(newCorrect));
    if (newCorrect >= 50) awardBadge("4");

    // Badge: Quiz Master — 5 perfect scores
    if (score === total) {
      const prevPerfect = parseInt(localStorage.getItem("vidyasetu_perfect_scores") || "0");
      const newPerfect = prevPerfect + 1;
      localStorage.setItem("vidyasetu_perfect_scores", String(newPerfect));
      if (newPerfect >= 5) awardBadge("2");
    }
  }, [finished]);

  if (!quiz) return (
    <div className="p-8 text-center text-muted-foreground">Quiz not found</div>
  );

  const question = quiz.questions[currentQ];
  const total = quiz.questions.length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === question.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= total) { setFinished(true); return; }
    setCurrentQ((c) => c + 1);
    setSelected(null);
    setAnswered(false);
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const xpEarned = Math.round((score / total) * quiz.xpReward);
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <span className="text-6xl block mb-4">
            {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}
          </span>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-muted-foreground mb-6">{quiz.title}</p>
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div className="text-5xl font-bold text-primary">{pct}%</div>
            <p className="text-muted-foreground">{score} of {total} correct</p>
            <div className="flex items-center justify-center gap-2 text-secondary font-bold">
              <Trophy className="w-5 h-5" /> +{xpEarned} XP earned!
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">{quiz.title}</h1>
          <p className="text-xs text-muted-foreground">Question {currentQ + 1} of {total}</p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
          timeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
        }`}>
          <Clock className="w-4 h-4" />
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>

      <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((currentQ + 1) / total) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}>
          <h2 className="text-xl font-bold mb-6">{question.text}</h2>
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              let style = "bg-card border hover:bg-muted";
              if (answered) {
                if (i === question.correctIndex) style = "bg-primary/20 border-primary text-primary";
                else if (i === selected) style = "bg-destructive/20 border-destructive text-destructive";
                else style = "bg-muted/50 border opacity-50";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-xl border font-semibold transition flex items-center gap-3 ${style}`}>
                  <span className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {answered && i === question.correctIndex && <CheckCircle2 className="w-5 h-5 ml-auto text-primary" />}
                  {answered && i === selected && i !== question.correctIndex && <XCircle className="w-5 h-5 ml-auto text-destructive" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {answered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition">
            {currentQ + 1 >= total ? "Finish" : "Next"} <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}