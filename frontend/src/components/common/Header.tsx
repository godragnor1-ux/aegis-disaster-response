'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEmergency } from '@/context/EmergencyContext';
import { useSocket } from '@/context/SocketContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import { ShieldAlert, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';

/**
 * Top bar. One accent (lavender) for brand and focus only. Severity colour
 * appears as a status dot, never as a panel fill (DESIGN.md: single accent).
 */
export const Header: React.FC = () => {
  const { sosBeacons, isOfflineMode, setIsOfflineMode } = useEmergency();
  const { isConnected } = useSocket();
  const { isMuted, toggleMute } = useAudioSiren();
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pending = sosBeacons.filter((b) => b.status === 'pending').length;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand">
            <ShieldAlert className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Aegis Pulse
          </span>
          <span className="ml-1 hidden border-l border-hairline pl-3 text-[12px] text-ink-subtle sm:inline">
            Disaster Response
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span className="hidden items-center gap-2 rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 text-[12px] text-ink-subtle md:flex">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: isConnected ? 'var(--ok)' : 'var(--warning)' }}
            />
            {isConnected ? 'Live' : 'Reconnecting'}
          </span>

          <Link
            href="/rescue"
            className="flex items-center gap-2 rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 text-[12px] text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: pending > 0 ? 'var(--critical)' : 'var(--ink-tertiary)' }}
            />
            {pending} open SOS
          </Link>

          <span className="hidden rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 font-mono text-[12px] tabular-nums text-ink-subtle lg:block">
            {clock}
          </span>

          <button
            type="button"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            title="Simulate offline mesh mode"
            aria-label="Toggle offline mesh simulation"
            className={`grid h-8 w-8 place-items-center rounded-md border transition-colors ${
 isOfflineMode
 ? 'border-hairline-strong bg-surface-2 text-ink'
 : 'border-hairline bg-surface-1 text-ink-subtle hover:bg-surface-2 hover:text-ink'
 }`}
          >
            {isOfflineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            className="grid h-8 w-8 place-items-center rounded-md border border-hairline bg-surface-1 text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
