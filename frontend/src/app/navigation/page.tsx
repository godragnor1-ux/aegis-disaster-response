'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { DynamicRoutingView } from '@/components/routing/DynamicRoutingView';
import { SafeZonesView } from '@/components/shelters/SafeZonesView';
import {
  Navigation,
  Building2,
  ShieldCheck,
  Compass,
  Milestone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SafeNavigationPage() {
  const [activeTab, setActiveTab] = useState<'routing' | 'shelters'>('routing');

  return (
    <main className="flex-1 flex flex-col min-h-screen hologram-grid relative">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Sub-tab switcher */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 border transition-all cyber-card-depth ${
              activeTab === 'routing'
                ? 'glass-panel border-tactical-accent text-cyan-300 neon-glow-cyan'
                : 'glass-panel border-tactical-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4 text-tactical-accent" />
            <span>1. DYNAMIC RESCUE ROUTING SOLVER</span>
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 border transition-all cyber-card-depth ${
              activeTab === 'shelters'
                ? 'glass-panel border-emerald-400 text-emerald-300 neon-glow-cyan'
                : 'glass-panel border-tactical-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>2. SAFE ZONES & RELIEF CAMPS DIRECTORY</span>
          </button>
        </div>

        <div className="glass-panel p-4 md:p-6 rounded-2xl border-tactical-700/80 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'routing' ? <DynamicRoutingView /> : <SafeZonesView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
