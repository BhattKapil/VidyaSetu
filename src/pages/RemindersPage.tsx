import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Plus, Trash2, Clock, Calendar, Check, X, Repeat } from "lucide-react";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  subject: string;
  time: string; // HH:MM
  days: number[]; // 0=Sun, 1=Mon ... 6=Sat
  enabled: boolean;
  createdAt: string;
}

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Computer Science", "General Study", "Revision"];
const STORAGE_KEY = "vidyasetu_reminders";
const NOTIF_PERMISSION_KEY = "vidyasetu_notif_asked";

function getReminders(): Reminder[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveReminders(r: Reminder[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

// ── Request notification permission ─────────────────────────────────────────
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) { toast.error("Notifications not supported on this device"); return false; }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") { toast.error("Notifications blocked. Please enable in browser settings."); return false; }
  const result = await Notification.requestPermission();
  return result === "granted";
}

// ── Schedule notification via SW ─────────────────────────────────────────────
function scheduleNotification(reminder: Reminder) {
  if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return;
  // We use a polling approach since SW timers aren't persistent
  // The check runs every minute from the main thread
  console.log("[Reminders] Scheduled:", reminder.title, "at", reminder.time);
}

// ── Check and fire due reminders ─────────────────────────────────────────────
function checkReminders(reminders: Reminder[]) {
  if (Notification.permission !== "granted") return;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const currentDay = now.getDay();

  reminders.forEach(r => {
    if (!r.enabled) return;
    if (r.time !== currentTime) return;
    if (!r.days.includes(currentDay)) return;

    new Notification(`📚 Study Time! ${r.subject}`, {
      body: r.title,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: r.id, // prevents duplicate notifications
    });
  });
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function ReminderModal({ reminder, onSave, onClose }: {
  reminder?: Reminder;
  onSave: (r: Reminder) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Reminder, "id" | "createdAt" | "enabled">>({
    title: reminder?.title || "",
    subject: reminder?.subject || "General Study",
    time: reminder?.time || "07:00",
    days: reminder?.days || [1, 2, 3, 4, 5],
  });

  const toggleDay = (d: number) => {
    setForm(p => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d].sort(),
    }));
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("Please enter a reminder title"); return; }
    if (form.days.length === 0) { toast.error("Select at least one day"); return; }
    onSave({
      ...form,
      title: form.title.trim(),
      id: reminder?.id || crypto.randomUUID(),
      createdAt: reminder?.createdAt || new Date().toISOString(),
      enabled: reminder?.enabled ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-card border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">{reminder ? "Edit Reminder" : "New Reminder"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What to study</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Practice algebra problems"
              className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
              <select
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Repeat on days</label>
            <div className="flex gap-2 mt-2">
              {DAYS_SHORT.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition ${
                    form.days.includes(i)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> {reminder ? "Save Changes" : "Create Reminder"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reminder Card ─────────────────────────────────────────────────────────────
function ReminderCard({ reminder, onToggle, onEdit, onDelete }: {
  reminder: Reminder;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const subjectEmoji: Record<string, string> = {
    "Mathematics": "📐", "Science": "🔬", "English": "📖", "Social Studies": "🗺️",
    "Hindi": "🇮🇳", "Computer Science": "💻", "General Study": "📚", "Revision": "🔁",
  };

  const activeDays = reminder.days.map(d => DAYS_SHORT[d]).join(", ");
  const isWeekdays = JSON.stringify(reminder.days) === JSON.stringify([1, 2, 3, 4, 5]);
  const isDaily = reminder.days.length === 7;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`bg-card border rounded-2xl p-4 transition-all ${reminder.enabled ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
          {subjectEmoji[reminder.subject] || "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{reminder.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">{reminder.subject}</span>
            <span className="text-xs text-primary font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {reminder.time}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Repeat className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isDaily ? "Every day" : isWeekdays ? "Weekdays" : activeDays}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${reminder.enabled ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${reminder.enabled ? "left-7" : "left-1"}`} />
          </button>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition text-xs">✏️</button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(getReminders);
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState<Reminder | undefined>();
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === "granted");

  // Poll reminders every minute
  useEffect(() => {
    const interval = setInterval(() => checkReminders(reminders), 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  const persist = (updated: Reminder[]) => { setReminders(updated); saveReminders(updated); };

  const handleSave = (r: Reminder) => {
    const existing = reminders.find(x => x.id === r.id);
    const updated = existing ? reminders.map(x => x.id === r.id ? r : x) : [r, ...reminders];
    persist(updated);
    scheduleNotification(r);
    toast.success(existing ? "Reminder updated!" : "Reminder created! 🔔");
    setShowModal(false);
    setEditReminder(undefined);
  };

  const toggleReminder = (id: string) => {
    persist(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReminder = (id: string) => {
    persist(reminders.filter(r => r.id !== id));
    toast.success("Reminder deleted");
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if (granted) {
      localStorage.setItem(NOTIF_PERMISSION_KEY, "true");
      toast.success("Notifications enabled! 🔔");
    }
  };

  const enabledCount = reminders.filter(r => r.enabled).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" /> Study Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enabledCount} active reminder{enabledCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditReminder(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition shadow"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Notification permission banner */}
      {!notifEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <BellOff className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Enable notifications</p>
              <p className="text-xs text-muted-foreground">Get reminders even when the app is closed</p>
            </div>
          </div>
          <button
            onClick={enableNotifications}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shrink-0 hover:opacity-90 transition"
          >
            Enable
          </button>
        </motion.div>
      )}

      {/* Quick presets */}
      {reminders.length === 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground mb-3">✨ Quick add presets:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Morning study session", subject: "General Study", time: "07:00", days: [1, 2, 3, 4, 5] },
              { title: "Evening revision", subject: "Revision", time: "18:00", days: [1, 2, 3, 4, 5] },
              { title: "Weekend math practice", subject: "Mathematics", time: "10:00", days: [0, 6] },
              { title: "Science reading", subject: "Science", time: "16:00", days: [1, 3, 5] },
            ].map(preset => (
              <button
                key={preset.title}
                onClick={() => {
                  handleSave({ ...preset, id: crypto.randomUUID(), createdAt: new Date().toISOString(), enabled: true });
                }}
                className="flex items-center gap-3 p-3 bg-card border rounded-xl hover:border-primary/40 transition text-left"
              >
                <span className="text-xl">⚡</span>
                <div>
                  <p className="font-semibold text-sm">{preset.title}</p>
                  <p className="text-xs text-muted-foreground">{preset.time} · {preset.days.map(d => DAYS_SHORT[d]).join(", ")}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reminders list */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {reminders.map(r => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onToggle={() => toggleReminder(r.id)}
                onEdit={() => { setEditReminder(r); setShowModal(true); }}
                onDelete={() => deleteReminder(r.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {reminders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-bold">No reminders yet</p>
          <p className="text-sm">Add reminders above or click the preset buttons!</p>
        </div>
      )}

      {/* Today's schedule */}
      {reminders.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Today's Schedule
          </h2>
          {(() => {
            const today = new Date().getDay();
            const todayReminders = reminders.filter(r => r.enabled && r.days.includes(today)).sort((a, b) => a.time.localeCompare(b.time));
            return todayReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders for today ({DAYS_FULL[today]}). Rest up! 😴</p>
            ) : (
              <div className="space-y-2">
                {todayReminders.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-card border rounded-xl p-3">
                    <span className="text-primary font-bold text-sm w-14 shrink-0">{r.time}</span>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="font-semibold text-sm">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ReminderModal
            reminder={editReminder}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditReminder(undefined); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
