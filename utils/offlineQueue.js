import { getApiUrl } from './apiConfig.js';

const OFFLINE_QUEUE_KEY = 'aegis_offline_request_queue_v1';

/**
 * Retrieve all currently buffered requests
 * @returns {Array<{id: string, type: string, endpoint: string, method: string, payload: any, createdAt: string, retryCount: number}>}
 */
export const getOfflineQueue = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    return [];
  }
};

/**
 * Save request queue to localStorage
 */
const saveQueue = (queue) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to persist offline queue:', err);
  }
};

/**
 * Buffer a failed or offline request
 * @param {'SOS' | 'CHAT' | 'MISSING_REPORT' | 'SIGHTING_TIP' | 'TASK_UPDATE'} type
 * @param {string} endpoint
 * @param {'POST' | 'PATCH' | 'PUT'} method
 * @param {Object} payload
 */
export const enqueueOfflineRequest = (type, endpoint, method, payload) => {
  const queue = getOfflineQueue();
  const newRequest = {
    id: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    endpoint,
    method,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  queue.push(newRequest);
  saveQueue(queue);

  console.warn(`📦 [Offline Queue] Enqueued ${type} request (${queue.length} total queued)`);
  return newRequest;
};

/**
 * Remove a specific request by ID
 * @param {string} id
 */
export const dequeueOfflineRequest = (id) => {
  const queue = getOfflineQueue().filter((req) => req.id !== id);
  saveQueue(queue);
};

/**
 * Clear the entire offline queue
 */
export const clearOfflineQueue = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

/**
 * Sync and replay all buffered requests to the backend server
 * @param {string} serverUrl
 */
export const syncOfflineQueue = async (serverUrl = getApiUrl()) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { totalSynced: 0, failedCount: 0, results: [] };
  }

  console.log(`🔄 [Offline Queue] Starting replay sync of ${queue.length} requests...`);
  const results = [];
  const remainingQueue = [];

  for (const req of queue) {
    try {
      const fullUrl = req.endpoint.startsWith('http') ? req.endpoint : `${serverUrl}${req.endpoint}`;
      const response = await fetch(fullUrl, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.payload),
      });

      if (response.ok) {
        results.push({ id: req.id, success: true });
        console.log(`✅ [Offline Queue] Synced ${req.type} (${req.id}) successfully`);
      } else {
        req.retryCount += 1;
        remainingQueue.push(req);
        results.push({ id: req.id, success: false, error: `HTTP ${response.status}` });
      }
    } catch (err) {
      req.retryCount += 1;
      remainingQueue.push(req);
      results.push({ id: req.id, success: false, error: err.message || 'Network error' });
    }
  }

  saveQueue(remainingQueue);

  return {
    totalSynced: results.filter((r) => r.success).length,
    failedCount: remainingQueue.length,
    results,
  };
};
