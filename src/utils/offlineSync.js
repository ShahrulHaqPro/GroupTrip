// Simple offline queue: stores pending mutations in AsyncStorage and
// replays them when the device comes back online.
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const QUEUE_KEY = "@grouptrip:offline_queue";
const CACHE_PREFIX = "@grouptrip:cache:";

// ─── Queue management ────────────────────────────────────────────────────────

export const enqueueOperation = async (operation) => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({
      ...operation,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to enqueue offline operation:", e);
  }
};

export const getQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};

export const removeFromQueue = async (id) => {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((op) => op.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to remove from queue:", e);
  }
};

// ─── Cache helpers ───────────────────────────────────────────────────────────

export const cacheData = async (key, data) => {
  try {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ data, cachedAt: Date.now() })
    );
  } catch (e) {
    console.error("Cache write failed:", e);
  }
};

export const getCachedData = async (key, maxAgeMs = 5 * 60 * 1000) => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > maxAgeMs) return null; // stale
    return data;
  } catch {
    return null;
  }
};

// ─── Connectivity check ───────────────────────────────────────────────────────

export const isOnline = async () => {
  try {
    // NetInfo might not be available in all Expo setups; try fetch as fallback
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch {
    try {
      const resp = await fetch("https://www.google.com", { method: "HEAD" });
      return resp.ok;
    } catch {
      return false;
    }
  }
};

// ─── Sync runner ──────────────────────────────────────────────────────────────
// Call this when the app comes back online.

export const syncOfflineQueue = async (handlers) => {
  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} offline operations...`);

  for (const op of queue) {
    try {
      const handler = handlers[op.type];
      if (handler) {
        await handler(op.payload);
        await removeFromQueue(op.id);
      }
    } catch (e) {
      console.error(`Failed to sync operation ${op.type}:`, e);
      // Keep in queue to retry later
    }
  }
};
