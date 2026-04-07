import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Role } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Try demo accounts below.");
      toast.error("Login failed. Check your credentials.");
    }
  };

  const quickLogin = async (email: string) => {
    setLoading(true);
    const passwords: Record<string, string> = {
      "admin@vidyasetu.com": "Admin@123",
      "teacher@vidyasetu.com": "Teacher@123",
      "student@vidyasetu.com": "Student@123",
    };
    const ok = await login(email, passwords[email]);
    setLoading(false);
    if (ok) navigate("/dashboard");
    else setError("Demo login failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-5xl">📚</span>
          <h1 className="text-3xl font-bold text-primary mt-2">VidyaSetu</h1>
          <p className="text-muted-foreground mt-1">Gamified Learning Platform</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Welcome back!</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="you@school.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 bg-card rounded-2xl border p-4">
          <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Quick Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "👨‍💼 Admin", email: "admin@vidyasetu.com" },
              { label: "👩‍🏫 Teacher", email: "teacher@vidyasetu.com" },
              { label: "🧑‍🎓 Student", email: "student@vidyasetu.com" },
            ].map((d) => (
              <button
                key={d.email}
                onClick={() => quickLogin(d.email)}
                className="py-2 px-3 rounded-xl border text-xs font-bold hover:bg-muted transition text-center"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
