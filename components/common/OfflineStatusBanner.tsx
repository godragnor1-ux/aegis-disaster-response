'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getOfflineQueue, syncOfflineQueue } from '@utils/offlineQueue';
import { useEmergency } from '@/context/EmergencyContext';

interface QueuedItem {
  id: string;
  type: string;
  endpoint: string;
  method: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

export const OfflineStatusBanner: React.FC = () => {
  const { isOfflineMode, setIsOfflineMode, fetchInitialData } = useEmergency();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedRequests, setQueuedRequests] = useState<QueuedItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  // Monitor online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setQueuedRequests(getOfflineQueue());

    const handleOnline = async () => {
      setIsOnline(true);
      console.log('🌐 Internet connection restored. Triggering offline queue sync...');
      await handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn('⚠️ Internet connection lost. Queuing all future requests.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setQueuedRequests(getOfflineQueue());
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue(serverUrl);
      if (result.totalSynced > 0) {
        setSyncMessage(`Synced ${result.totalSynced} offline requests successfully!`);
        setTimeout(() => setSyncMessage(null), 4000);
        await fetchInitialData();
      }
      setQueuedRequests(getOfflineQueue());
    } catch (err) {
      console.error('Manual sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const showBanner = !isOnline || isOfflineMode || queuedRequests.length > 0;

  if (!showBanner) return null;

  return (
    <aside aria-label="Offline Mode Notification" className="w-full bg-gradient-to-r from-amber-950 via-tactical-900 to-amber-950 border-b border-amber-500/50 py-2 px-4 font-mono text-xs text-amber-200 z-[9999] shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span className="font-bold">
            {!isOnline
              ? '⚠️ CELLULAR/INTERNET BLACKOUT DETECTED — OFFLINE MODE ACTIVE'
              : isOfflineMode
              ? '⚡ SIMULATED OFFLINE MESH MODE ACTIVE'
              : '📦 OFFLINE REQUESTS PENDING'}
          </span>
          {queuedRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 text-[10px] font-bold">
              {queuedRequests.length} buffered
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {syncMessage}
            </span>
          )}

          {queuedRequests.length > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Queue'}</span>
            </button>
          )}

          {isOfflineMode && (
            <button
              onClick={() => setIsOfflineMode(false)}
              className="text-slate-400 hover:text-white text-[11px] underline"
            >
              Exit Mesh Mode
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
export default OfflineStatusBanner;
