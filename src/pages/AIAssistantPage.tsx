import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Send, Bot, User, Sparkles, WifiOff,
  BookOpen, Brain, Clock, Star, Trash2, Copy, Check, Lightbulb
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const STORAGE_KEY = "vidyasetu_chat_history";
const MAX_HISTORY = 20;

const QUICK_PROMPTS = [
  { icon: "🌱", label: "Explain photosynthesis" },
  { icon: "📐", label: "Solve a maths problem" },
  { icon: "📋", label: "Make me a study plan" },
  { icon: "🧠", label: "Quiz me on science" },
  { icon: "✏️", label: "Help with English grammar" },
  { icon: "💡", label: "Simplify Newton's laws" },
];

const SYSTEM_PROMPT = `You are VidyaSetu AI — a friendly, encouraging study assistant for school students (Class 6-10) in India, especially Odisha.

Your personality:
- Warm, patient, encouraging like a good teacher
- Use simple English; occasionally use "Bahut accha!" or "Shabash!" for encouragement
- Explain concepts with real-life Indian examples
- Use emojis to make responses engaging
- Keep answers concise — students may be on slow internet/small screens

Your capabilities:
- Explain any school subject (Math, Science, English, Social Studies, Hindi)
- Create custom study plans
- Quiz students on any topic
- Guide homework step by step
- Provide memory tricks and mnemonics

Rules:
- NEVER do homework FOR students — guide them to the answer
- Always encourage, never discourage
- Format math equations clearly
- Use bullet points and headers for long answers
- Keep responses under 300 words unless asked for more`;

async function callClaude(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not found. Check your .env file.");

  const contents = messages.slice(-MAX_HISTORY).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 1000 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response received.";
}

const OFFLINE_RESPONSES: Record<string, string> = {
  default: `I'm offline right now 📡\n\nBut here are some things you can do:\n- Check your previous chat history above\n- Try the **Quiz** section — works offline!\n- Your question will be answered when you reconnect\n\nReconnect to get full AI-powered answers. 💪`,
  math: `📐 **Quick Math Tip (Offline)**\n\nFor algebra, always do the same operation to **both sides**.\n\nExample: x + 5 = 12\n→ Subtract 5 from both sides → **x = 7**\n\nReconnect for personalized help! 🌐`,
  science: `🔬 **Quick Science (Offline)**\n\n- Mitochondria = powerhouse of the cell ⚡\n- Photosynthesis: CO₂ + H₂O + Light → Glucose + O₂\n- Newton's 1st Law: Objects stay at rest or in motion unless acted on\n\nReconnect for more! 🌐`,
};

function getOfflineResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("math") || lower.includes("algebra")) return OFFLINE_RESPONSES.math;
  if (lower.includes("science") || lower.includes("biology")) return OFFLINE_RESPONSES.science;
  return OFFLINE_RESPONSES.default;
}

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (t: string) => void }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
        isUser ? "bg-primary/10" : msg.isError ? "bg-destructive/10" : "bg-accent/10"
      }`}>
        {isUser ? <User className="w-4 h-4 text-primary" />
          : msg.isError ? <span className="text-sm">⚠️</span>
          : <Bot className="w-4 h-4 text-accent" />}
      </div>
      <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-primary text-primary-foreground"
            : msg.isError ? "bg-destructive/10 border border-destructive/30 text-destructive"
            : "bg-card border"
        }`}>
          {isUser ? <p>{msg.content}</p> : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-code:text-accent">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && (
          <button onClick={() => { onCopy(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1">
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        <span className="text-[10px] text-muted-foreground px-1">
          {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-card border rounded-2xl px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 bg-muted-foreground rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { isOnline } = usePWA();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch { /* ignore */ }
    return [{
      id: "welcome", role: "assistant" as const,
      content: `Namaste ${user?.name?.split(" ")[0] || ""}! 🙏✨\n\nI'm your **VidyaSetu AI Study Buddy**. I can:\n- 📚 **Explain** any topic simply\n- 📋 **Create** a study plan\n- 🧠 **Quiz** you on any subject\n- ✏️ **Guide** you through homework\n\nWhat would you like to learn today?`,
      timestamp: new Date(),
    }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY))); } catch { /* full */ }
  }, [messages]);

  const addMessage = (msg: Omit<Message, "id" | "timestamp">) => {
    const full: Message = { ...msg, id: crypto.randomUUID(), timestamp: new Date() };
    setMessages(prev => [...prev, full]);
    return full;
  };

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    const history = messages.filter(m => !m.isError).slice(-16).map(m => ({ role: m.role, content: m.content }));
    addMessage({ role: "user", content: text });
    setLoading(true);
    try {
      let reply: string;
      if (!isOnline) {
        await new Promise(r => setTimeout(r, 400));
        reply = getOfflineResponse(text);
      } else {
        reply = await callClaude([...history, { role: "user", content: text }]);
      }
      addMessage({ role: "assistant", content: reply });
    } catch (err) {
      addMessage({ role: "assistant", content: `⚠️ Error: ${err instanceof Error ? err.message : "Unknown error"}\n\nPlease try again.`, isError: true });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, isOnline, messages]);

  const clearChat = () => {
    setMessages([{ id: "w2", role: "assistant", content: "Chat cleared! 🌟 What would you like to learn?", timestamp: new Date() }]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Chat cleared");
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-2xl flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">AI Study Buddy</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-amber-500"}`} />
              {isOnline ? "Online · Powered by Claude AI" : "Offline · Limited mode"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Offline
            </div>
          )}
          <button onClick={clearChat} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide mb-1">
        {[
          { icon: <BookOpen className="w-3 h-3" />, label: "Explain Topics" },
          { icon: <Brain className="w-3 h-3" />, label: "Quiz Me" },
          { icon: <Clock className="w-3 h-3" />, label: "Study Plan" },
          { icon: <Lightbulb className="w-3 h-3" />, label: "Homework Help" },
          { icon: <Star className="w-3 h-3" />, label: "Mnemonics" },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-1.5 bg-card border rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground shrink-0">
            {f.icon}{f.label}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} onCopy={t => navigator.clipboard.writeText(t).then(() => toast.success("Copied!"))} />)}
        {loading && <TypingIndicator />}
      </div>

      {/* Quick prompts */}
      <AnimatePresence>
        {messages.length <= 1 && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 shrink-0">
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} onClick={() => send(p.label)}
                className="flex items-center gap-2 px-3 py-2.5 bg-card border rounded-xl text-xs font-semibold hover:border-primary/50 hover:bg-primary/5 transition text-left">
                <span className="text-base shrink-0">{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2 bg-card border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary transition">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} disabled={loading}
            placeholder={isOnline ? "Ask me anything about your studies…" : "Ask (offline mode)…"}
            className="flex-1 px-2 py-1.5 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground" />
          <button type="submit" disabled={loading || !input.trim()}
            className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-1.5">
          AI can make mistakes · Verify with your teacher
        </p>
      </div>
    </div>
  );
}
