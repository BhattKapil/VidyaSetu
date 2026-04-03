import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_QUIZZES } from "@/lib/mockData";
import { Users, Play, Trophy, Clock, CheckCircle, XCircle, Zap, Copy, ArrowRight, Crown, Radio } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type GamePhase = "lobby" | "question" | "results" | "leaderboard" | "finished";

interface LiveSession {
  code: string;
  hostId: string;
  hostName: string;
  quizId: string;
  quizTitle: string;
  phase: GamePhase;
  currentQuestion: number;
  questionStart: number;
  timeLimit: number;
  players: Record<string, Player>;
  answers: Record<string, number>; // playerId -> chosen index
  createdAt: number;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswered: number;
}

const SESSION_KEY = (code: string) => `vidyasetu_live_${code}`;
const POLL_MS = 800;

function readSession(code: string): LiveSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY(code)) || "null"); }
  catch { return null; }
}
function writeSession(s: LiveSession) {
  localStorage.setItem(SESSION_KEY(s.code), JSON.stringify(s));
}
function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
function calcScore(timeLimit: number, questionStart: number, correct: boolean): number {
  if (!correct) return 0;
  const elapsed = (Date.now() - questionStart) / 1000;
  const speedBonus = Math.max(0, Math.round((1 - elapsed / timeLimit) * 200));
  return 100 + speedBonus;
}

// ─── HOST VIEW ────────────────────────────────────────────────────────────────
function HostView() {
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState(MOCK_QUIZZES[0].id);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const poll = useCallback(() => {
    if (!session) return;
    const fresh = readSession(session.code);
    if (fresh) setSession(fresh);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [poll, session]);

  // Countdown timer
  useEffect(() => {
    if (!session || session.phase !== "question") return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = session.timeLimit - Math.floor((Date.now() - session.questionStart) / 1000);
      setTimeRemaining(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        // Auto advance to results
        const fresh = readSession(session.code);
        if (fresh && fresh.phase === "question") {
          fresh.phase = "results";
          writeSession(fresh);
          setSession({ ...fresh });
        }
      }
    }, 200);
    return () => clearInterval(timerRef.current);
  }, [session?.phase, session?.currentQuestion]);

  const createSession = () => {
    if (!user) return;
    const quiz = MOCK_QUIZZES.find(q => q.id === selectedQuiz)!;
    const s: LiveSession = {
      code: generateCode(),
      hostId: user.id,
      hostName: user.name,
      quizId: quiz.id,
      quizTitle: quiz.title,
      phase: "lobby",
      currentQuestion: 0,
      questionStart: 0,
      timeLimit: 20,
      players: {},
      answers: {},
      createdAt: Date.now(),
    };
    writeSession(s);
    setSession(s);
    toast.success("Live session created!");
  };

  const startQuiz = () => {
    if (!session) return;
    const updated: LiveSession = {
      ...readSession(session.code)!,
      phase: "question",
      currentQuestion: 0,
      questionStart: Date.now(),
      answers: {},
    };
    writeSession(updated);
    setSession(updated);
  };

  const nextQuestion = () => {
    if (!session) return;
    const fresh = readSession(session.code)!;
    const quiz = MOCK_QUIZZES.find(q => q.id === fresh.quizId)!;
    const next = fresh.currentQuestion + 1;
    if (next >= quiz.questions.length) {
      const done = { ...fresh, phase: "finished" as GamePhase };
      writeSession(done); setSession(done);
    } else {
      const updated = { ...fresh, phase: "question" as GamePhase, currentQuestion: next, questionStart: Date.now(), answers: {} };
      writeSession(updated); setSession(updated);
    }
  };

  const endSession = () => {
    if (!session) return;
    localStorage.removeItem(SESSION_KEY(session.code));
    setSession(null);
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-card border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Host a Live Quiz</h2>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Quiz</label>
            <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {MOCK_QUIZZES.map(q => <option key={q.id} value={q.id}>{q.title} ({q.questions.length} Qs)</option>)}
            </select>
          </div>
          <button onClick={createSession}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> Create Live Session
          </button>
        </div>
      </div>
    );
  }

  const quiz = MOCK_QUIZZES.find(q => q.id === session.quizId)!;
  const playerList = Object.values(session.players).sort((a, b) => b.score - a.score);
  const answeredCount = Object.keys(session.answers).length;
  const currentQ = quiz.questions[session.currentQuestion];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Session header */}
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-lg">{session.quizTitle}</p>
            <p className="text-sm text-muted-foreground">Q{session.currentQuestion + 1}/{quiz.questions.length}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl">
              <span className="font-mono text-2xl font-bold text-primary tracking-widest">{session.code}</span>
              <button onClick={() => { navigator.clipboard.writeText(session.code); toast.success("Code copied!"); }}>
                <Copy className="w-4 h-4 text-primary" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this code</p>
          </div>
        </div>

        {/* Players in lobby */}
        {session.phase === "lobby" && (
          <>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[48px]">
              {playerList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Waiting for players to join…</p>
              ) : (
                playerList.map(p => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm font-semibold">
                    <span>{p.avatar}</span> {p.name}
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {playerList.length} player{playerList.length !== 1 ? "s" : ""} joined
              </span>
              <button onClick={startQuiz} disabled={playerList.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition">
                <Play className="w-4 h-4" /> Start Quiz
              </button>
            </div>
          </>
        )}

        {/* Live question */}
        {session.phase === "question" && currentQ && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className={`text-3xl font-mono font-black ${timeRemaining <= 5 ? "text-destructive animate-pulse" : "text-primary"}`}>
                {timeRemaining}s
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full transition-all ${timeRemaining <= 5 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${(timeRemaining / session.timeLimit) * 100}%` }} />
              </div>
              <span className="text-sm text-muted-foreground">{answeredCount}/{playerList.length} answered</span>
            </div>
            <p className="font-bold text-base mb-3">{currentQ.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {currentQ.options.map((opt, i) => (
                <div key={i} className={`p-3 rounded-xl border text-sm font-semibold ${i === currentQ.correctIndex ? "border-green-500 bg-green-500/10 text-green-500" : "bg-muted"}`}>
                  {i === currentQ.correctIndex && <CheckCircle className="w-3.5 h-3.5 inline mr-1" />}
                  {opt}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Results after question */}
        {session.phase === "results" && currentQ && (
          <>
            <p className="font-bold mb-3">Results — Q{session.currentQuestion + 1}</p>
            <div className="space-y-2 mb-4">
              {playerList.map(p => {
                const answered = session.answers[p.id] !== undefined;
                const correct = session.answers[p.id] === currentQ.correctIndex;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2.5">
                    <span>{p.avatar}</span>
                    <span className="flex-1 font-semibold text-sm">{p.name}</span>
                    {answered ? (
                      correct ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />
                    ) : <span className="text-xs text-muted-foreground">No answer</span>}
                    <span className="font-bold text-sm text-secondary">{p.score} pts</span>
                  </div>
                );
              })}
            </div>
            <button onClick={nextQuestion}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
              {session.currentQuestion + 1 >= quiz.questions.length ? "Finish" : "Next Question"} <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Final leaderboard */}
        {session.phase === "finished" && (
          <>
            <p className="font-bold text-lg mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-secondary" /> Final Results</p>
            <div className="space-y-2 mb-4">
              {playerList.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${i === 0 ? "bg-secondary/10 border border-secondary/30" : "bg-muted"}`}>
                  <span className="font-bold text-lg w-8">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <span className="text-lg">{p.avatar}</span>
                  <span className="flex-1 font-bold">{p.name}</span>
                  {i === 0 && <Crown className="w-4 h-4 text-secondary" />}
                  <span className="font-black text-secondary">{p.score}</span>
                </div>
              ))}
            </div>
            <button onClick={endSession}
              className="w-full py-2.5 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-muted/80 transition">
              End Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── STUDENT JOIN VIEW ────────────────────────────────────────────────────────
function StudentView() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [session, setSession] = useState<LiveSession | null>(null);
  const [joined, setJoined] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevPhase = useRef<GamePhase | null>(null);
  const prevQ = useRef<number>(-1);

  // Poll for session changes
  useEffect(() => {
    if (!joined || !session) return;
    pollRef.current = setInterval(() => {
      const fresh = readSession(session.code);
      if (!fresh) { setSession(null); setJoined(false); return; }
      // Reset answered flag on new question
      if (fresh.currentQuestion !== prevQ.current) {
        setAnswered(false);
        setSelectedAnswer(null);
        prevQ.current = fresh.currentQuestion;
      }
      prevPhase.current = fresh.phase;
      setSession({ ...fresh });
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [joined, session?.code]);

  // Countdown
  useEffect(() => {
    if (!session || session.phase !== "question") return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const rem = session.timeLimit - Math.floor((Date.now() - session.questionStart) / 1000);
      setTimeRemaining(Math.max(0, rem));
    }, 200);
    return () => clearInterval(timerRef.current);
  }, [session?.phase, session?.currentQuestion]);

  const joinSession = () => {
    if (!user || !code.trim()) return;
    const s = readSession(code.toUpperCase());
    if (!s) { toast.error("Session not found. Check the code!"); return; }
    if (s.phase !== "lobby") { toast.error("Session has already started."); return; }
    const updated = {
      ...s,
      players: {
        ...s.players,
        [user.id]: { id: user.id, name: user.name, avatar: user.avatar, score: 0, streak: 0, lastAnswered: 0 }
      }
    };
    writeSession(updated);
    setSession(updated);
    setJoined(true);
    prevQ.current = 0;
    toast.success("Joined! Waiting for the teacher to start…");
  };

  const submitAnswer = (idx: number) => {
    if (answered || !session || !user) return;
    setSelectedAnswer(idx);
    setAnswered(true);

    const fresh = readSession(session.code)!;
    const quiz = MOCK_QUIZZES.find(q => q.id === fresh.quizId)!;
    const correct = idx === quiz.questions[fresh.currentQuestion].correctIndex;
    const pts = calcScore(fresh.timeLimit, fresh.questionStart, correct);

    const updated = {
      ...fresh,
      answers: { ...fresh.answers, [user.id]: idx },
      players: {
        ...fresh.players,
        [user.id]: {
          ...fresh.players[user.id],
          score: (fresh.players[user.id]?.score || 0) + pts,
          streak: correct ? (fresh.players[user.id]?.streak || 0) + 1 : 0,
          lastAnswered: Date.now(),
        }
      }
    };
    writeSession(updated);
    setSession(updated);

    if (correct) toast.success(`Correct! +${pts} points 🎉`);
    else toast.error("Wrong answer 😕");
  };

  // Not joined yet
  if (!joined) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-card border rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <span className="text-5xl">🎮</span>
            <h2 className="font-bold text-lg mt-3">Join Live Quiz</h2>
            <p className="text-sm text-muted-foreground">Enter the code from your teacher</p>
          </div>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6} placeholder="ABC123"
            className="w-full text-center text-3xl font-mono font-black tracking-widest py-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            onKeyDown={e => e.key === "Enter" && joinSession()}
          />
          <button onClick={joinSession} disabled={code.length < 4}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition">
            Join Session
          </button>
        </div>
      </div>
    );
  }

  if (!session) return <p className="text-center text-muted-foreground py-16">Session ended.</p>;

  const quiz = MOCK_QUIZZES.find(q => q.id === session.quizId)!;
  const currentQ = quiz?.questions[session.currentQuestion];
  const myScore = session.players[user!.id]?.score || 0;
  const playersSorted = Object.values(session.players).sort((a, b) => b.score - a.score);
  const myRank = playersSorted.findIndex(p => p.id === user!.id) + 1;

  // Waiting in lobby
  if (session.phase === "lobby") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <div className="bg-card border rounded-2xl p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
          </div>
          <h2 className="font-bold text-xl mb-1">You're in! 🎉</h2>
          <p className="text-muted-foreground text-sm mb-4">Waiting for {session.hostName} to start…</p>
          <div className="bg-muted rounded-xl px-6 py-3 inline-block">
            <p className="font-mono font-black text-2xl text-primary tracking-widest">{session.code}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {Object.values(session.players).map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-card border px-3 py-1.5 rounded-full text-sm">
                <span>{p.avatar}</span><span className="font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Live question
  if (session.phase === "question" && currentQ) {
    const COLORS = ["bg-blue-500", "bg-red-500", "bg-yellow-500", "bg-green-500"];
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">Q{session.currentQuestion + 1}/{quiz.questions.length}</span>
          <div className={`font-black text-2xl font-mono ${timeRemaining <= 5 ? "text-destructive animate-pulse" : "text-primary"}`}>
            {timeRemaining}s
          </div>
          <span className="text-sm font-semibold text-secondary flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{myScore} pts</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${timeRemaining <= 5 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${(timeRemaining / session.timeLimit) * 100}%` }} transition={{ duration: 0.2 }} />
        </div>
        <div className="bg-card border rounded-2xl p-5 text-center">
          <p className="font-bold text-lg">{currentQ.text}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {currentQ.options.map((opt, i) => (
            <button key={i} onClick={() => submitAnswer(i)} disabled={answered}
              className={`p-4 rounded-2xl font-bold text-sm transition ${
                answered
                  ? selectedAnswer === i
                    ? i === currentQ.correctIndex ? "bg-green-500 text-white" : "bg-destructive text-white"
                    : i === currentQ.correctIndex ? "bg-green-500/20 border-2 border-green-500 text-green-500" : "bg-muted text-muted-foreground opacity-50"
                  : `${COLORS[i]} text-white hover:opacity-90 active:scale-95`
              }`}>
              {opt}
            </button>
          ))}
        </div>
        {answered && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-2 text-sm font-semibold text-muted-foreground">
            Answer locked in! Waiting for results…
          </motion.div>
        )}
      </div>
    );
  }

  // Results phase
  if (session.phase === "results") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <div className="bg-card border rounded-2xl p-8 space-y-3">
          <p className="text-4xl">{selectedAnswer === currentQ?.correctIndex ? "✅" : "❌"}</p>
          <p className="font-bold text-lg">{selectedAnswer === currentQ?.correctIndex ? "Correct!" : "Wrong answer"}</p>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className="font-black text-3xl text-secondary">{myScore}</p>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Users className="w-4 h-4" /> Rank: #{myRank} of {playersSorted.length}
          </p>
          <p className="text-xs text-muted-foreground animate-pulse">Waiting for next question…</p>
        </div>
      </div>
    );
  }

  // Finished
  if (session.phase === "finished") {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-5xl">{myRank === 1 ? "🏆" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : "🎓"}</p>
            <h2 className="font-bold text-xl mt-2">Quiz Finished!</h2>
            <p className="text-muted-foreground text-sm">Final rank: <strong>#{myRank}</strong></p>
          </div>
          <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Final Score</p>
            <p className="font-black text-4xl text-secondary">{myScore}</p>
          </div>
          <div className="space-y-2">
            {playersSorted.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${p.id === user!.id ? "bg-primary/10 border border-primary/30" : "bg-muted"}`}>
                <span className="w-6 text-center font-bold text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span className="text-base">{p.avatar}</span>
                <span className="flex-1 font-semibold text-sm">{p.name}</span>
                <span className="font-black text-secondary text-sm">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveQuizPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="w-7 h-7 text-primary" />
          Live Quiz
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">LIVE</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isTeacher ? "Host a real-time quiz for your students" : "Join a live quiz session with your class"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={isTeacher ? "host" : "student"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {isTeacher ? <HostView /> : <StudentView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
