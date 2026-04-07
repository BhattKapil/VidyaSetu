import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import { Question } from "@/lib/mockData";
import { toast } from "sonner";

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [timeLimit, setTimeLimit] = useState(10);
  const [xpReward, setXpReward] = useState(50);
  const [questions, setQuestions] = useState<Omit<Question, "id">[]>([
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string | number) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newQuiz = {
      id: `custom-${Date.now()}`,
      title,
      subject,
      timeLimit,
      xpReward,
      teacherId: "t1",
      createdAt: new Date().toISOString().split("T")[0],
      questions: questions.map((q, i) => ({ ...q, id: `q-${Date.now()}-${i}` })),
    };

    const existing = JSON.parse(localStorage.getItem("vidyasetu_quizzes") || "[]");
    localStorage.setItem("vidyasetu_quizzes", JSON.stringify([...existing, newQuiz]));

    toast.success("Quiz created successfully! ✏️");
    navigate("/quizzes");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Create New Quiz ✏️</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-2xl border p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Quiz Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Basic Mathematics" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Math" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Time Limit (minutes)</label>
              <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} min={1} max={60}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">XP Reward</label>
              <input type="number" value={xpReward} onChange={(e) => setXpReward(+e.target.value)} min={10} max={500}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <motion.div key={qIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">Question {qIdx + 1}</span>
              <button type="button" onClick={() => removeQuestion(qIdx)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input type="text" value={q.text} onChange={(e) => updateQuestion(qIdx, "text", e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none" placeholder="Enter question" />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${qIdx}`} checked={q.correctIndex === oIdx}
                    onChange={() => updateQuestion(qIdx, "correctIndex", oIdx)} className="accent-primary" />
                  <input type="text" value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} required
                    className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Select the radio button next to the correct answer</p>
          </motion.div>
        ))}

        <button type="button" onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-primary/30 rounded-2xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition">
          <PlusCircle className="w-5 h-5" /> Add Question
        </button>

        <button type="submit"
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition">
          Create Quiz
        </button>
      </form>
    </div>
  );
}
