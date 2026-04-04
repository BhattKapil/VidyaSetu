import { MOCK_QUIZZES } from "@/lib/mockData";
import { BookOpen, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function QuizzesListPage() {
  const { user } = useAuth();

  const [customQuizzes, setCustomQuizzes] = useState(() => {
    return JSON.parse(localStorage.getItem("vidyasetu_quizzes") || "[]");
  });

  const allQuizzes = [...MOCK_QUIZZES, ...customQuizzes];

  const deleteQuiz = (id: string) => {
    const updated = customQuizzes.filter((q: { id: string }) => q.id !== id);
    setCustomQuizzes(updated);
    localStorage.setItem("vidyasetu_quizzes", JSON.stringify(updated));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Available Quizzes</h1>
        </div>
        <span className="text-sm text-muted-foreground">{allQuizzes.length} quizzes</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {allQuizzes.map((q) => (
          <div key={q.id} className="bg-card rounded-2xl border p-5 relative">
            <Link to={`/quiz/${q.id}`} className="block">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{q.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {q.subject} • {q.questions.length} questions
                  </p>
                </div>
                {q.id.startsWith("custom-") && (
                  <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-1 rounded-full">
                    Custom
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">
                  ⏱ {q.timeLimit} min
                </span>
                <span className="text-xs font-bold bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                  +{q.xpReward} XP
                </span>
              </div>
            </Link>

            {user?.role === "teacher" && q.id.startsWith("custom-") && (
              <button
                onClick={() => deleteQuiz(q.id)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}