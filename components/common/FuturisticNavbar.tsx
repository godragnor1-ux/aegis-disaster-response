'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  ShieldAlert,
  Map,
  Activity,
  Search,
  Navigation,
  MessageSquare,
  RadioTower,
  Sparkles,
  Layers,
  Network
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RealtimeActivityHUD } from './RealtimeActivityHUD';

const navRoutes = [
  { href: '/', label: 'Command Hub', icon: ShieldAlert, badge: 'MAIN' },
  { href: '/map', label: 'Live GIS Map', icon: Map, badge: 'RADAR' },
  { href: '/rescue', label: 'Rescue Dashboard', icon: Activity, badge: 'FLEET' },
  { href: '/missing', label: 'Missing Tracker', icon: Search, badge: null },
  { href: '/navigation', label: 'Safe Navigation', icon: Navigation, badge: 'SAFE' },
  { href: '/communication', label: 'Comms Panel', icon: MessageSquare, badge: 'RADIO' },
];

export const FuturisticNavbar: React.FC = () => {
  const pathname = usePathname();
  const { sosBeacons } = useEmergency();
  const { playBeep } = useAudioSiren();
  const pendingSOS = sosBeacons.filter((b) => b.status === 'pending').length;

  return (
    <nav className="border-b border-tactical-700/60 bg-tactical-950/80 backdrop-blur-xl px-4 py-2 sticky top-[61px] z-20 overflow-x-auto scrollbar-none shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-max">
        <div className="flex items-center gap-1.5">
          {navRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => playBeep(980, 'sine')}
                className={`relative px-3.5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cyber-card-depth ${
                  isActive
                    ? 'bg-gradient-to-r from-tactical-800 to-tactical-850 text-tactical-accent border border-tactical-accent/50 neon-glow-cyan'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-tactical-900/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-tactical-accent animate-pulse' : 'text-slate-500'}`} />
                <span>{route.label}</span>

                {route.badge && !isActive && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-tactical-900 text-slate-400 border border-tactical-700">
                    {route.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="navbarGlow"
                    className="absolute -bottom-2 left-2 right-2 h-0.5 bg-tactical-accent shadow-[0_0_10px_#00f0ff]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <RealtimeActivityHUD />

          {/* Quick SOS Trigger in Navbar */}
          <Link
            href="/rescue"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/80 text-red-300 font-mono text-xs font-bold hover:bg-red-900 transition-all neon-glow-red"
          >
            <RadioTower className="w-3.5 h-3.5 text-red-500 animate-ping" />
            <span>ACTIVE SOS:</span>
            <span className="bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingSOS}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
