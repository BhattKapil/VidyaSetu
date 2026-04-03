import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload, FileText, Trash2, Download, Eye, BookOpen,
  CheckCircle, AlertCircle, X, Search, Filter, Plus
} from "lucide-react";
import { toast } from "sonner";

interface UploadedNote {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileData: string; // base64
  uploadedBy: string;
  uploadedAt: string;
  downloads: number;
  class: string;
}

const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Computer Science", "Other"];
const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const STORAGE_KEY = "vidyasetu_notes";

function getNotes(): UploadedNote[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveNotes(notes: UploadedNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUpload }: { onClose: () => void; onUpload: (note: UploadedNote) => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", subject: "Mathematics", description: "", class: "Class 8" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { toast.error("Only PDF files are supported"); return; }
    if (f.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB"); return; }
    setFile(f);
    if (!form.title) setForm(p => ({ ...p, title: f.name.replace(".pdf", "") }));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async () => {
    if (!file || !form.title.trim()) { toast.error("Please fill all fields and select a PDF"); return; }
    setUploading(true);

    // Simulate progress
    for (let i = 0; i <= 90; i += 10) {
      await new Promise(r => setTimeout(r, 60));
      setProgress(i);
    }

    // Read file as base64 for offline storage
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const note: UploadedNote = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        subject: form.subject,
        description: form.description.trim(),
        fileName: file.name,
        fileSize: file.size,
        fileData: base64,
        uploadedBy: user?.name || "Teacher",
        uploadedAt: new Date().toISOString(),
        downloads: 0,
        class: form.class,
      };
      setProgress(100);
      setTimeout(() => {
        onUpload(note);
        toast.success("Notes uploaded successfully! 📄");
        onClose();
      }, 300);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-lg">Upload Study Notes</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary/5" : file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            }`}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-primary" />
                <p className="font-semibold text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <p className="font-semibold text-sm">Drop PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF only · Max 20MB · Saved offline</p>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Chapter 5 — Fractions"
                className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                <select
                  value={form.class}
                  onChange={(e) => setForm(p => ({ ...p, class: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of these notes..."
                rows={2}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Saving offline…</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {uploading ? <><span className="animate-spin">⏳</span> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Notes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PDFViewerModal({ note, onClose, onDownload }: { note: UploadedNote; onClose: () => void; onDownload: () => void }) {
  const pdfSrc = `data:application/pdf;base64,${note.fileData}`;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
        <div>
          <p className="font-bold text-sm">{note.title}</p>
          <p className="text-xs text-muted-foreground">{note.subject} · {note.class}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button onClick={onClose} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe src={pdfSrc} className="w-full h-full" title={note.title} />
      </div>
    </div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({ note, isTeacher, onDelete, onView, onDownload }: {
  note: UploadedNote; isTeacher: boolean;
  onDelete: () => void; onView: () => void; onDownload: () => void;
}) {
  const subjectColors: Record<string, string> = {
    "Mathematics": "bg-blue-500/10 text-blue-400",
    "Science": "bg-green-500/10 text-green-400",
    "English": "bg-purple-500/10 text-purple-400",
    "Social Studies": "bg-orange-500/10 text-orange-400",
    "Hindi": "bg-red-500/10 text-red-400",
    "Computer Science": "bg-cyan-500/10 text-cyan-400",
    "Other": "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-2xl p-5 hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-tight truncate">{note.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${subjectColors[note.subject] || subjectColors["Other"]}`}>
              {note.subject}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{note.class}</span>
          </div>
        </div>
        {isTeacher && (
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {note.description && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{note.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-muted-foreground">
          <p>{formatFileSize(note.fileSize)}</p>
          <p className="mt-0.5">{new Date(note.uploadedAt).toLocaleDateString("en-IN")} · {note.uploadedBy}</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={onView} className="flex items-center gap-1 px-2.5 py-1.5 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg text-xs font-semibold transition">
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button onClick={onDownload} className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition">
            <Download className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const [notes, setNotes] = useState<UploadedNote[]>(getNotes);
  const [showUpload, setShowUpload] = useState(false);
  const [viewNote, setViewNote] = useState<UploadedNote | null>(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");

  const handleUpload = (note: UploadedNote) => {
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    toast.success("Notes deleted");
  };

  const handleDownload = (note: UploadedNote) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${note.fileData}`;
    link.download = note.fileName;
    link.click();
    // Increment download count
    const updated = notes.map(n => n.id === note.id ? { ...n, downloads: n.downloads + 1 } : n);
    setNotes(updated);
    saveNotes(updated);
    toast.success("Downloading…");
  };

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === "All" || n.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-7 h-7 text-primary" /> Study Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher ? "Upload and manage study materials for your students" : "Download notes from your teachers — available offline"}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition shadow-lg"
          >
            <Plus className="w-4 h-4" /> Upload Notes
          </button>
        )}
      </div>

      {/* Offline notice */}
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-sm">
        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
        <span className="text-primary font-semibold">Offline ready</span>
        <span className="text-muted-foreground">— All uploaded notes are saved to your device and accessible without internet.</span>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>All</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Stats bar (teacher only) */}
      {isTeacher && notes.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Notes", value: notes.length, icon: "📄" },
            { label: "Total Size", value: formatFileSize(notes.reduce((a, n) => a + n.fileSize, 0)), icon: "💾" },
            { label: "Downloads", value: notes.reduce((a, n) => a + n.downloads, 0), icon: "⬇️" },
          ].map(s => (
            <div key={s.label} className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl">{s.icon}</p>
              <p className="font-bold text-lg">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">{notes.length === 0 ? "📂" : "🔍"}</p>
          <p className="font-bold text-lg">{notes.length === 0 ? "No notes yet" : "No results found"}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {isTeacher && notes.length === 0 ? "Click 'Upload Notes' to add your first PDF" : "Try a different search or filter"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isTeacher={isTeacher}
              onDelete={() => handleDelete(note.id)}
              onView={() => setViewNote(note)}
              onDownload={() => handleDownload(note)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
      </AnimatePresence>
      {viewNote && <PDFViewerModal note={viewNote} onClose={() => setViewNote(null)} onDownload={() => handleDownload(viewNote)} />}
    </div>
  );
}
