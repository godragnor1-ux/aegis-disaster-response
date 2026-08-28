'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { AnimatedGlowingSOSButton } from '@/components/sos/AnimatedGlowingSOSButton';
import { OneTapSOSModal } from '@/components/sos/OneTapSOSModal';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  Map,
  Activity,
  Search,
  Navigation,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Layers,
  Flame,
  Droplets,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { incidents, sosBeacons, responders, shelters } = useEmergency();
  const { playBeep } = useAudioSiren();
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);

  const pendingSOS = sosBeacons.filter((b) => b.status === 'pending');
  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const availableResponders = responders.filter((r) => r.status === 'available');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen hologram-grid relative">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-8">
        {/* Top Hero Section: Holographic HUD Title + Giant 3D SOS Glowing Reactor */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Left Column: Mission Control Intro & Quick Metrics */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 font-mono text-xs font-bold neon-glow-red">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>DEFCON 1 | PLANETARY DISASTER DEFENSE ACTIVE</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider font-mono">
                AEGIS<span className="text-tactical-accent neon-text-cyan">PULSE</span>
                <span className="block text-2xl md:text-3xl text-slate-300 font-bold mt-1">
                  TACTICAL RESCUE OS
                </span>
              </h1>

              <p className="text-sm font-mono text-slate-300 max-w-xl leading-relaxed">
                Mission-critical real-time response grid connecting stranded citizens, drone reconnaissance, and first-responder tactical fleets with AI vision damage assessment and dynamic hazard-avoidance routing.
              </p>
            </div>

            {/* 3D Glassmorphism Telemetry Badges with Hover Elevations */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono"
            >
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.04, translateY: -3 }}
                className="glass-panel p-3.5 rounded-2xl border-cyan-500/30 text-center cyber-card-depth cursor-default"
              >
                <div className="text-[10px] text-slate-400">ACTIVE HAZARDS</div>
                <div className="text-2xl font-bold text-cyan-300 mt-1 neon-text-cyan">{activeIncidents.length}</div>
                <div className="text-[9px] text-slate-500">Sector Zones</div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.04, translateY: -3 }}
                className="glass-alert-panel p-3.5 rounded-2xl text-center cyber-card-depth cursor-default"
              >
                <div className="text-[10px] text-red-300">CRITICAL SOS</div>
                <div className="text-2xl font-bold text-red-400 mt-1 neon-text-red">{pendingSOS.length}</div>
                <div className="text-[9px] text-red-300/70">Awaiting Unit</div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.04, translateY: -3 }}
                className="glass-panel p-3.5 rounded-2xl border-emerald-500/30 text-center cyber-card-depth cursor-default"
              >
                <div className="text-[10px] text-slate-400">UNITS ON GRID</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{responders.length}</div>
                <div className="text-[9px] text-emerald-300/70">{availableResponders.length} Ready</div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.04, translateY: -3 }}
                className="glass-panel p-3.5 rounded-2xl border-amber-500/30 text-center cyber-card-depth cursor-default"
              >
                <div className="text-[10px] text-slate-400">SAFE HAVENS</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{shelters.length}</div>
                <div className="text-[9px] text-slate-500">Hospitals & Camps</div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Giant 3D Holographic Animated Glowing SOS Reactor */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-6">
            <AnimatedGlowingSOSButton size="large" onTrigger={() => setIsSOSModalOpen(true)} />
            <p className="text-xs font-mono text-slate-400 text-center max-w-xs mt-6">
              Tap the glowing reactor core for automated GPS location lock, dual-camera hazard capture & MongoDB dispatch.
            </p>
          </div>
        </section>

        {/* Automated One-Tap SOS Modal */}
        <OneTapSOSModal isOpen={isSOSModalOpen} onClose={() => setIsSOSModalOpen(false)} />

        {/* Core Navigation Portal Cards (3D Depth & Stagger Hover Effects) */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-tactical-800 pb-2">
            <h2 className="text-lg font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-tactical-accent animate-pulse" />
              MISSION CONTROL ACCESS MODULES
            </h2>
            <span className="text-xs font-mono text-slate-400">6 DEDICATED SECTORS</span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono"
          >
            {/* Portal 1: Live GIS Map */}
            <motion.div variants={itemVariants}>
              <Link
                href="/map"
                onClick={() => playBeep(880, 'sine')}
                className="glass-panel p-5 rounded-2xl border-cyan-500/30 hover:border-cyan-400 transition-all cyber-card-depth flex flex-col justify-between group h-full block"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Map className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    1. Live Tactical GIS Map
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Real-time radar sweeps, active danger polygons (floods, fires, collapses), casualty heatmaps, and live responder telemetry.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-tactical-700/60 text-xs text-cyan-300 font-bold">
                  <span>Launch Interactive Radar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Portal 2: Rescue Dashboard */}
            <motion.div variants={itemVariants}>
              <Link
                href="/rescue"
                onClick={() => playBeep(920, 'sine')}
                className="glass-panel p-5 rounded-2xl border-red-500/30 hover:border-red-400 transition-all cyber-card-depth flex flex-col justify-between group h-full block"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500 text-red-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                    2. Rescue Dashboard & AI Vision
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Automated responder task assignment, proximity scoring matrix, and AI computer vision structural damage inspection.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-tactical-700/60 text-xs text-red-300 font-bold">
                  <span>Access Fleet & AI Dispatch</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Portal 3: Safe Navigation */}
            <motion.div variants={itemVariants}>
              <Link
                href="/navigation"
                onClick={() => playBeep(960, 'sine')}
                className="glass-panel p-5 rounded-2xl border-emerald-500/30 hover:border-emerald-400 transition-all cyber-card-depth flex flex-col justify-between group h-full block"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    3. Safe Route Navigation
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Dynamic routing solver bypassing inundated flood corridors and fires to guide survivors safely to relief shelters.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-tactical-700/60 text-xs text-emerald-300 font-bold">
                  <span>Calculate Safe Evacuation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Portal 4: Missing Person Tracker */}
            <motion.div variants={itemVariants}>
              <Link
                href="/missing"
                onClick={() => playBeep(1000, 'sine')}
                className="glass-panel p-5 rounded-2xl border-rose-500/30 hover:border-rose-400 transition-all cyber-card-depth flex flex-col justify-between group h-full block"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-400 text-rose-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                    4. Missing Person Tracker
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Searchable registry with photo recognition, clothing tags, community sighting logs, and family reconnection status.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-tactical-700/60 text-xs text-rose-300 font-bold">
                  <span>Search & Log Sighting</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Portal 5: Communication Panel */}
            <motion.div variants={itemVariants}>
              <Link
                href="/communication"
                onClick={() => playBeep(1040, 'sine')}
                className="glass-panel p-5 rounded-2xl border-purple-500/30 hover:border-purple-400 transition-all cyber-card-depth flex flex-col justify-between group h-full block"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-400 text-purple-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    5. Tactical Radio & Sirens
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Multi-channel WebSockets radio chat, civil defense audio sirens, and text-to-speech emergency directive broadcasts.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-tactical-700/60 text-xs text-purple-300 font-bold">
                  <span>Open Tactical Radio Net</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Portal 6: Offline Mesh & SMS */}
            <motion.div variants={itemVariants}>
              <Link
                href="/rescue"
                onClick={() => playBeep(1080, 'sine')}
                className="glass-panel p-5 rounded-2xl border-amber-500/30 hover:border-amber-400 transition-all cyber-card-depth flex flex-col justify-between group h-full block"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-400 text-amber-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    6. Offline Mesh & SMS Fallback
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Decentralized P2P node-to-node relay simulation and zero-bandwidth 64-byte compressed emergency SMS transmission.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-tactical-700/60 text-xs text-amber-300 font-bold">
                  <span>Inspect P2P Topology</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>

      <footer className="border-t border-tactical-800 bg-tactical-950/80 px-4 py-3 text-center font-mono text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>AEGIS-PULSE DISASTER DEFENSE OS v2.4</span>
          <span className="text-slate-400">ENHANCED GLOWING SOS & SMOOTH FRAMER MOTION TRANSITIONS</span>
          <span className="text-tactical-accent">DEFCON 1 ACTIVE</span>
        </div>
      </footer>
    </main>
  );
}
