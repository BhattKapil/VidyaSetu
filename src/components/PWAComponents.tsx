import { usePWA } from "@/hooks/usePWA";
import { Wifi, WifiOff, Download, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Offline status bar (shown at top when offline) ────────────────────────────
export function OfflineBar() {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          You're offline — using cached data. Changes will sync when reconnected.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Install App Banner ────────────────────────────────────────────────────────
export function InstallBanner() {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <span className="text-3xl shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">Install VidyaSetu</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to home screen for offline access & faster load times
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition"
              >
                <Download className="w-3.5 h-3.5" /> Install
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 text-muted-foreground rounded-lg text-xs hover:bg-muted transition"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Update Available Banner ───────────────────────────────────────────────────
export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3 text-sm font-semibold max-w-sm w-full">
        <RefreshCw className="w-4 h-4 shrink-0" />
        <span className="flex-1">New version available!</span>
        <button
          onClick={applyUpdate}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-bold transition"
        >
          Update
        </button>
      </div>
    </motion.div>
  );
}

// ── Connectivity indicator (for Navbar use) ───────────────────────────────────
export function ConnectivityDot() {
  const { isOnline } = usePWA();
  return (
    <div
      className={`flex items-center gap-1 text-xs font-semibold ${isOnline ? "text-primary" : "text-amber-500"}`}
      title={isOnline ? "Online" : "Offline – using cached data"}
    >
      {isOnline ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}
