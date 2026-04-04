import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Timer } from "lucide-react";

const EMOJIS = ["🧮", "🔬", "📐", "🌍", "📖", "🎨", "🧬", "⚡"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryMatchPage() {
  const { awardBadge } = useAuth();
  const winAwarded = useRef(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = () => {
    const pairs = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setFlippedIds([]);
    setMoves(0);
    setMatched(0);
    setTime(0);
    setGameOver(false);
  };

  useEffect(() => { initGame(); }, []);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => setTime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  useEffect(() => {
    if (flippedIds.length === 2) {
      const [a, b] = flippedIds;
      setMoves((m) => m + 1);
      if (cards[a].emoji === cards[b].emoji) {
        setCards((c) => c.map((card) => card.id === a || card.id === b ? { ...card, matched: true } : card));
        setMatched((m) => {
          const next = m + 1;
          if (next === EMOJIS.length) {
        setGameOver(true);
        if (!winAwarded.current) {
          winAwarded.current = true;
          const prevWins = parseInt(localStorage.getItem("vidyasetu_memory_wins") || "0");
          const newWins = prevWins + 1;
          localStorage.setItem("vidyasetu_memory_wins", String(newWins));
          if (newWins >= 3) awardBadge("8");
        }
      }
          return next;
        });
        setFlippedIds([]);
      } else {
        setTimeout(() => {
          setCards((c) => c.map((card) => card.id === a || card.id === b ? { ...card, flipped: false } : card));
          setFlippedIds([]);
        }, 800);
      }
    }
  }, [flippedIds, cards]);

  const handleFlip = (id: number) => {
    if (flippedIds.length >= 2 || cards[id].flipped || cards[id].matched || gameOver) return;
    setCards((c) => c.map((card) => card.id === id ? { ...card, flipped: true } : card));
    setFlippedIds((f) => [...f, id]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🧠 Memory Match</h1>
        <button onClick={initGame} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 mb-6 text-sm font-bold">
        <span className="flex items-center gap-1"><Timer className="w-4 h-4 text-primary" />{time}s</span>
        <span>Moves: {moves}</span>
        <span className="text-primary">{matched}/{EMOJIS.length} matched</span>
      </div>

      {gameOver ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-card rounded-2xl border p-8">
          <Trophy className="w-12 h-12 text-secondary mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">You Won! 🎉</h2>
          <p className="text-muted-foreground">Completed in {moves} moves and {time} seconds</p>
          <p className="text-secondary font-bold mt-2">+80 XP earned!</p>
          <button onClick={initGame} className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition">
            Play Again
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square rounded-xl text-3xl font-bold flex items-center justify-center transition-all duration-300 ${
                card.flipped || card.matched
                  ? "bg-card border-2 border-primary"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              } ${card.matched ? "opacity-50" : ""}`}
            >
              {card.flipped || card.matched ? card.emoji : "?"}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
