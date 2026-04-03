import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload, Video, Trash2, Play, X, Search,
  Filter, Plus, CheckCircle, Clock, Eye
} from "lucide-react";
import { toast } from "sonner";

interface UploadedVideo {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileData: string; // base64
  thumbnail: string; // base64 of first frame or placeholder
  duration: string;
  uploadedBy: string;
  uploadedAt: string;
  views: number;
  class: string;
}

const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Computer Science", "Other"];
const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const STORAGE_KEY = "vidyasetu_videos";
const MAX_SIZE_MB = 100;

function getVideos(): UploadedVideo[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveVideos(v: UploadedVideo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
function formatDuration(secs: number) {
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Capture video thumbnail ──────────────────────────────────────────────────
function captureThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.onloadeddata = () => {
      video.currentTime = 1;
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, 320, 180);
      const thumb = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      URL.revokeObjectURL(video.src);
      resolve(thumb);
    };
    video.onerror = () => resolve(""); // fallback: no thumbnail
  });
}

function getDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      const dur = isFinite(video.duration) ? formatDuration(video.duration) : "—";
      URL.revokeObjectURL(video.src);
      resolve(dur);
    };
    video.onerror = () => resolve("—");
  });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUpload }: { onClose: () => void; onUpload: (v: UploadedVideo) => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", subject: "Mathematics", description: "", class: "Class 8" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { toast.error("Only video files are supported (MP4, WebM, MOV)"); return; }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`File must be under ${MAX_SIZE_MB}MB`); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async () => {
    if (!file || !form.title.trim()) { toast.error("Please fill title and select a video"); return; }
    setUploading(true);

    setStage("Extracting thumbnail…"); setProgress(10);
    const [thumb, duration] = await Promise.all([captureThumbnail(file), getDuration(file)]);

    setStage("Reading video…"); setProgress(30);
    const base64 = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.readAsDataURL(file);
      // Fake progress
      const iv = setInterval(() => setProgress(p => Math.min(p + 5, 88)), 200);
      r.onloadend = () => clearInterval(iv);
    });

    setStage("Saving offline…"); setProgress(92);
    await new Promise(r => setTimeout(r, 300));

    const vid: UploadedVideo = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      subject: form.subject,
      description: form.description.trim(),
      fileName: file.name,
      fileSize: file.size,
      fileData: base64,
      thumbnail: thumb,
      duration,
      uploadedBy: user?.name || "Teacher",
      uploadedAt: new Date().toISOString(),
      views: 0,
      class: form.class,
    };
    setProgress(100);
    setTimeout(() => {
      onUpload(vid);
      toast.success("Video uploaded successfully! 🎬");
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-lg">Upload Lesson Video</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone / preview */}
          {preview ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video src={preview} controls className="w-full h-full object-contain" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
              }`}
            >
              <input ref={fileRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-sm">Drop video here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV · Max {MAX_SIZE_MB}MB · Saved offline</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</label>
              <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Fractions — Part 1"
                className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                <select value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                <select value={form.class} onChange={(e) => setForm(p => ({ ...p, class: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What will students learn from this video?"
                rows={2}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stage}</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={uploading || !file}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2">
            {uploading ? <><span className="animate-spin">⏳</span> Processing…</> : <><Upload className="w-4 h-4" /> Upload Video</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Video Player Modal ───────────────────────────────────────────────────────
function VideoPlayer({ video, onClose }: { video: UploadedVideo; onClose: () => void }) {
  const src = `data:video/mp4;base64,${video.fileData}`;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur border-b">
        <div>
          <p className="font-bold text-sm">{video.title}</p>
          <p className="text-xs text-muted-foreground">{video.subject} · {video.class} · {video.duration}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 flex items-center justify-center bg-black">
        <video src={src} controls autoPlay className="max-w-full max-h-full" controlsList="nodownload" />
      </div>
      {video.description && (
        <div className="px-4 py-3 bg-card border-t text-sm text-muted-foreground">{video.description}</div>
      )}
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video, isTeacher, onDelete, onPlay }: {
  video: UploadedVideo; isTeacher: boolean; onDelete: () => void; onPlay: () => void;
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted cursor-pointer" onClick={onPlay}>
        {video.thumbnail ? (
          <img src={`data:image/jpeg;base64,${video.thumbnail}`} alt={video.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-primary ml-0.5" fill="currentColor" />
          </div>
        </div>
        {video.duration !== "—" && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            {video.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm leading-tight line-clamp-2 flex-1">{video.title}</h3>
          {isTeacher && (
            <button onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-destructive hover:bg-destructive/10 transition shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${subjectColors[video.subject] || subjectColors["Other"]}`}>
            {video.subject}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{video.class}</span>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views} views</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(video.uploadedAt).toLocaleDateString("en-IN")}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VideosPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const [videos, setVideos] = useState<UploadedVideo[]>(getVideos);
  const [showUpload, setShowUpload] = useState(false);
  const [playVideo, setPlayVideo] = useState<UploadedVideo | null>(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");

  const handleUpload = (v: UploadedVideo) => {
    const updated = [v, ...videos];
    setVideos(updated);
    saveVideos(updated);
  };

  const handleDelete = (id: string) => {
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    saveVideos(updated);
    toast.success("Video deleted");
  };

  const handlePlay = (video: UploadedVideo) => {
    const updated = videos.map(v => v.id === video.id ? { ...v, views: v.views + 1 } : v);
    setVideos(updated);
    saveVideos(updated);
    setPlayVideo(video);
  };

  const filtered = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.subject.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === "All" || v.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-7 h-7 text-primary" /> Video Lessons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher ? "Upload lesson videos for your students" : "Watch lesson videos — available offline after first view"}
          </p>
        </div>
        {isTeacher && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition shadow-lg">
            <Plus className="w-4 h-4" /> Upload Video
          </button>
        )}
      </div>

      {/* Offline notice */}
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-sm">
        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
        <span className="text-primary font-semibold">Offline ready</span>
        <span className="text-muted-foreground">— Videos are stored locally on your device and play without internet.</span>
      </div>

      {/* Stats (teacher) */}
      {isTeacher && videos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Videos", value: videos.length, icon: "🎬" },
            { label: "Total Size", value: formatSize(videos.reduce((a, v) => a + v.fileSize, 0)), icon: "💾" },
            { label: "Total Views", value: videos.reduce((a, v) => a + v.views, 0), icon: "👁️" },
          ].map(s => (
            <div key={s.label} className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl">{s.icon}</p>
              <p className="font-bold text-lg">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option>All</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">{videos.length === 0 ? "🎬" : "🔍"}</p>
          <p className="font-bold text-lg">{videos.length === 0 ? "No videos yet" : "No results found"}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {isTeacher && videos.length === 0 ? "Click 'Upload Video' to add your first lesson" : "Try a different search or filter"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(v => (
            <VideoCard key={v.id} video={v} isTeacher={isTeacher}
              onDelete={() => handleDelete(v.id)} onPlay={() => handlePlay(v)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
      </AnimatePresence>
      {playVideo && <VideoPlayer video={playVideo} onClose={() => setPlayVideo(null)} />}
    </div>
  );
}
