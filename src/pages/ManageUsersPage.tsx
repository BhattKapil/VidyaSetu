import { LEADERBOARD } from "@/lib/mockData";
import { Users, Search } from "lucide-react";
import { useState } from "react";

export default function ManageUsersPage() {
  const [search, setSearch] = useState("");

  const allUsers = [
    ...LEADERBOARD.map((u, i) => ({ ...u, role: "Student" as const, email: `${u.name.toLowerCase().replace(/[^a-z]/g, "")}@school.com` })),
    { name: "Ms. Sharma", avatar: "👩‍🏫", role: "Teacher" as const, xp: 0, level: 0, email: "teacher@vidyasetu.com" },
    { name: "Mr. Patel", avatar: "👨‍🏫", role: "Teacher" as const, xp: 0, level: 0, email: "teacher2@vidyasetu.com" },
  ];

  const filtered = allUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Manage Users</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
          placeholder="Search users..." />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 text-xs font-bold text-muted-foreground border-b">
          <span>User</span><span>Email</span><span>Role</span><span>Status</span>
        </div>
        {filtered.map((u, i) => (
          <div key={i} className="grid grid-cols-4 items-center px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition">
            <span className="font-semibold text-sm flex items-center gap-2"><span>{u.avatar}</span> {u.name}</span>
            <span className="text-xs text-muted-foreground truncate">{u.email}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
              u.role === "Teacher" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
            }`}>{u.role}</span>
            <span className="text-xs font-bold text-primary">Active</span>
          </div>
        ))}
      </div>
    </div>
  );
}
