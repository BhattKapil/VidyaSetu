import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { getXPProgress } from "@/lib/mockData";
import { ConnectivityDot } from "@/components/PWAComponents";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = user.role === "student"
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/quizzes", label: "Quizzes" },
        { to: "/live-quiz", label: "🔴 Live" },
        { to: "/notes", label: "Notes" },
        { to: "/videos", label: "Videos" },
        { to: "/recommendations", label: "For You" },
        { to: "/missions", label: "Missions" },
        { to: "/leaderboard", label: "Leaderboard" },
        { to: "/reminders", label: "Reminders" },
        { to: "/ai-assistant", label: "AI Helper" },
      ]
    : user.role === "teacher"
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/quizzes", label: "Quizzes" },
        { to: "/create-quiz", label: "Create Quiz" },
        { to: "/live-quiz", label: "🔴 Live Quiz" },
        { to: "/notes", label: "Notes" },
        { to: "/videos", label: "Videos" },
        { to: "/analytics", label: "Analytics" },
        { to: "/ai-assistant", label: "AI Helper" },
      ]
    : [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/manage-users", label: "Users" },
        { to: "/analytics", label: "Analytics" },
        { to: "/notes", label: "Notes" },
        { to: "/videos", label: "Videos" },
        { to: "/ai-assistant", label: "AI Helper" },
      ];

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌉</span>
          <span className="font-display text-xl font-bold text-primary">VidyaSetu</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname === l.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Online indicator */}
          <ConnectivityDot />

          {user.role === "student" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-xp/20 text-xp-foreground px-2 py-1 rounded-full text-xs font-bold">
                <Zap className="w-3.5 h-3.5 text-secondary" />
                {user.xp} XP
              </div>
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${getXPProgress(user.xp)}%` }} />
              </div>
              <span className="text-xs font-bold text-accent">Lv.{user.level}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl">{user.avatar}</span>
            <span className="text-sm font-semibold">{user.name}</span>
          </div>
          <button onClick={logout} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                location.pathname === l.to ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-destructive">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
