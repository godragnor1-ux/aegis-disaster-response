'use client';

import React from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { AlertOctagon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EmergencyBroadcastBanner: React.FC = () => {
  const { latestBroadcast, dismissBroadcast } = useEmergency();

  if (!latestBroadcast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        className="relative z-50 bg-gradient-to-r from-red-900 via-rose-950 to-red-900 border-y-2 border-red-500 shadow-[0_0_30px_rgba(255,0,60,0.6)] px-4 py-3 text-white"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg animate-bounce shadow-[0_0_12px_rgba(255,255,255,0.8)]">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-red-300 uppercase tracking-widest border border-red-500/50">
                  NATIONAL CIVIL DEFENSE BROADCAST
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {new Date(latestBroadcast.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-base font-black text-white tracking-wide mt-0.5">
                {latestBroadcast.title}
              </h2>
              <p className="text-xs text-red-100 font-sans max-w-4xl mt-0.5">
                {latestBroadcast.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dismissBroadcast}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white transition-colors border border-red-700/50"
              title="Acknowledge Alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
