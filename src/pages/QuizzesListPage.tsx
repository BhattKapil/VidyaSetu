import { MOCK_QUIZZES } from "@/lib/mockData";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuizzesListPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Available Quizzes</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_QUIZZES.map((q) => (
          <Link key={q.id} to={`/quiz/${q.id}`} className="bg-card rounded-2xl border p-5 card-hover">
            <h3 className="font-bold text-lg">{q.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{q.subject} • {q.questions.length} questions</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">⏱ {q.timeLimit} min</span>
              <span className="text-xs font-bold bg-secondary/20 text-secondary px-2 py-1 rounded-full">+{q.xpReward} XP</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
