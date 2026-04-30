import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Search, Trash2, Shield, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  level: number;
  avatar: string;
  streak: number;
  badges: string[];
  createdAt: string;
}

export default function ManageUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/user/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
        toast.success(`${name} has been removed`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove user");
      }
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const students = users.filter(u => u.role === "student");
  const teachers = users.filter(u => u.role === "teacher");

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Manage Users</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Users className="w-5 h-5 text-primary" />, label: "Total Users", value: users.length, bg: "bg-primary/10" },
          { icon: <BookOpen className="w-5 h-5 text-accent" />, label: "Teachers", value: teachers.length, bg: "bg-accent/10" },
          { icon: <GraduationCap className="w-5 h-5 text-secondary" />, label: "Students", value: students.length, bg: "bg-secondary/10" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border flex items-center gap-3`}>
            {s.icon}
            <div>
              <p className="text-xs text-muted-foreground font-semibold">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
            placeholder="Search by name or email..."
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="grid grid-cols-5 px-4 py-3 text-xs font-bold text-muted-foreground border-b">
          <span className="col-span-2">User</span>
          <span>Role</span>
          <span>XP / Level</span>
          <span>Action</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No users found
          </div>
        ) : (
          filtered.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-5 items-center px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition"
            >
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xl">{u.avatar}</span>
                <div>
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${
                u.role === "admin" ? "bg-destructive/20 text-destructive" :
                u.role === "teacher" ? "bg-accent/20 text-accent" :
                "bg-primary/20 text-primary"
              }`}>
                {u.role === "admin" && <Shield className="w-3 h-3 inline mr-1" />}
                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
              </span>
              <div>
                <p className="text-sm font-bold">{u.xp} XP</p>
                <p className="text-xs text-muted-foreground">Level {u.level}</p>
              </div>
              {u.role !== "admin" ? (
                <button
                  onClick={() => handleDelete(u._id, u.name)}
                  disabled={deletingId === u._id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === u._id ? "Removing..." : "Remove"}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">Protected</span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}