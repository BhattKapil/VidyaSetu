/**
 * VidyaSetu Offline Store
 * Uses IndexedDB for persistent offline storage of:
 * - Quiz results (pending sync)
 * - Cached content (notes, quiz data)
 * - User progress
 */

const DB_NAME = "vidyasetu-offline";
const DB_VERSION = 1;

type StoreNames = "pendingSync" | "cachedQuizzes" | "cachedNotes" | "userProgress";

interface PendingSync {
  id?: number;
  type: "quiz_result" | "progress" | "xp_update";
  data: unknown;
  timestamp: number;
  retries: number;
}

interface CachedQuiz {
  id: string;
  data: unknown;
  cachedAt: number;
}

// ── Open DB ──────────────────────────────────────────────────────────────────
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("pendingSync")) {
        const syncStore = db.createObjectStore("pendingSync", {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("type", "type", { unique: false });
        syncStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains("cachedQuizzes")) {
        db.createObjectStore("cachedQuizzes", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("cachedNotes")) {
        db.createObjectStore("cachedNotes", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("userProgress")) {
        db.createObjectStore("userProgress", { keyPath: "userId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// ── Generic helpers ──────────────────────────────────────────────────────────
function tx<T>(
  storeName: StoreNames,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ── Pending Sync Queue ────────────────────────────────────────────────────────
export const offlineQueue = {
  add(item: Omit<PendingSync, "id" | "timestamp" | "retries">) {
    return tx("pendingSync", "readwrite", (store) =>
      store.add({ ...item, timestamp: Date.now(), retries: 0 })
    );
  },

  getAll(): Promise<PendingSync[]> {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction("pendingSync", "readonly")
            .objectStore("pendingSync")
            .getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    );
  },

  remove(id: number) {
    return tx("pendingSync", "readwrite", (store) => store.delete(id));
  },

  count(): Promise<number> {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction("pendingSync", "readonly")
            .objectStore("pendingSync")
            .count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    );
  },
};

// ── Cached Quizzes ────────────────────────────────────────────────────────────
export const quizCache = {
  save(quiz: CachedQuiz) {
    return tx("cachedQuizzes", "readwrite", (store) => store.put(quiz));
  },

  get(id: string): Promise<CachedQuiz | undefined> {
    return tx("cachedQuizzes", "readonly", (store) => store.get(id));
  },

  getAll(): Promise<CachedQuiz[]> {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction("cachedQuizzes", "readonly")
            .objectStore("cachedQuizzes")
            .getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    );
  },
};

// ── User Progress ─────────────────────────────────────────────────────────────
export const progressStore = {
  save(userId: string, data: unknown) {
    return tx("userProgress", "readwrite", (store) =>
      store.put({ userId, data, updatedAt: Date.now() })
    );
  },

  get(userId: string): Promise<{ userId: string; data: unknown; updatedAt: number } | undefined> {
    return tx("userProgress", "readonly", (store) => store.get(userId));
  },
};

// ── Background Sync trigger ───────────────────────────────────────────────────
export async function triggerBackgroundSync(tag = "sync-quiz-results") {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const reg = await navigator.serviceWorker.ready;
    // @ts-expect-error SyncManager types not always available
    await reg.sync.register(tag);
    console.log("[OfflineStore] Background sync registered:", tag);
  }
}
