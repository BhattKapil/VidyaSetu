import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Role } from "@/lib/mockData";
import { motion } from "framer-motion";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(name, email, password, role);
    setLoading(false);
    navigate("/dashboard");
  };

  const roles: { value: Role; label: string; icon: string }[] = [
    { value: "student", label: "Student", icon: "🧑‍🎓" },
    { value: "teacher", label: "Teacher", icon: "👩‍🏫" },
    { value: "admin", label: "Admin", icon: "👨‍💼" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">📚</span>
          <h1 className="text-3xl font-bold text-primary mt-2">Join VidyaSetu</h1>
          <p className="text-muted-foreground mt-1">Start your learning adventure</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                placeholder="Your name" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                placeholder="you@school.com" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">I am a...</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`py-3 rounded-xl border text-sm font-bold transition ${
                      role === r.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    }`}
                  >
                    <span className="text-lg block">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Log In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
