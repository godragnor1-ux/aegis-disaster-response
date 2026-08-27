'use client';

import React, { useState } from 'react';
import { Header } from '@components/common/Header';
import { EmergencyBroadcastBanner } from '@components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@components/common/FuturisticNavbar';
import { AutoDispatchHUD } from '@components/dispatch/AutoDispatchHUD';
import { AIDamageScanner } from '@components/ai/AIDamageScanner';
import { SOSBeaconView } from '@components/sos/SOSBeaconView';
import { MeshNetworkView } from '@components/mesh/MeshNetworkView';
import { DisasterPredictionView } from '@components/predict/DisasterPredictionView';
import {
  Activity,
  Sparkles,
  RadioTower,
  Network,
  TrendingUp,
  ShieldAlert,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RescueDashboardPage() {
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'ai-damage' | 'sos' | 'mesh' | 'predict'>('dispatch');

  const subTabs = [
    { id: 'dispatch', label: '1. Auto Dispatch HUD', icon: Users, desc: 'Proximity Task Assignment' },
    { id: 'ai-damage', label: '2. AI Vision Scanner', icon: Sparkles, desc: 'Damage & Bounding Boxes' },
    { id: 'sos', label: '3. SOS Beacon Dispatcher', icon: RadioTower, desc: 'GPS & Dual Camera' },
    { id: 'mesh', label: '4. Offline Mesh Simulator', icon: Network, desc: 'P2P Hop Latency & SMS' },
    { id: 'predict', label: '5. Scenario Forecaster', icon: TrendingUp, desc: 'Storm & Flood Models' },
  ];

  return (
    <main className="flex-1 flex flex-col min-h-screen hologram-grid relative">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-red-500 animate-pulse" />
              RESCUE COMMAND & AI FLEET DISPATCH DASHBOARD
            </h1>
            <p className="text-xs font-mono text-slate-400">
              INTEGRATED TASK ASSIGNMENT MATRIX, COMPUTER VISION STRUCTURAL DAMAGE & OFFLINE MESH RELAY
            </p>
          </div>
        </div>

        {/* Sub-Navigation Selector (3D Glass Pills) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 font-mono">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`p-3 rounded-2xl border text-left transition-all cyber-card-depth flex flex-col justify-between ${
                  isActive
                    ? 'glass-panel border-cyan-400 text-cyan-300 neon-glow-cyan'
                    : 'glass-panel border-tactical-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-tactical-accent animate-pulse' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-white">{tab.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Render Active Tool */}
        <div className="glass-panel p-4 md:p-6 rounded-2xl border-tactical-700/80 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeSubTab === 'dispatch' && <AutoDispatchHUD />}
              {activeSubTab === 'ai-damage' && <AIDamageScanner />}
              {activeSubTab === 'sos' && <SOSBeaconView />}
              {activeSubTab === 'mesh' && <MeshNetworkView />}
              {activeSubTab === 'predict' && <DisasterPredictionView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
