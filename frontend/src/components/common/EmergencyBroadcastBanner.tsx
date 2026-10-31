'use client';

import React from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { AlertOctagon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Broadcast strip. Severity colour is confined to a 2px rule — no gradient
 * fill, no bounce. DESIGN.md: no atmospheric gradients.
 */
export const EmergencyBroadcastBanner: React.FC = () => {
  const { latestBroadcast, dismissBroadcast } = useEmergency();

  if (!latestBroadcast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden border-b border-hairline bg-surface-1"
      >
        <div
          className="absolute inset-y-0 left-0 w-0.5"
          style={{ background: 'var(--critical)' }}
        />
        <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-start gap-3">
            <AlertOctagon
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: 'var(--critical)' }}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-ink">{latestBroadcast.title}</span>
                <span className="font-mono text-[11px] text-ink-subtle">
                  {new Date(latestBroadcast.timestamp).toLocaleTimeString('en-GB')}
                </span>
              </div>
              <p className="mt-0.5 max-w-3xl text-[13px] leading-relaxed text-ink-subtle">
                {latestBroadcast.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissBroadcast}
            aria-label="Acknowledge broadcast"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
