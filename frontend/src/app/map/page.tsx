'use client';

import React, { useState } from 'react';
import { Header } from '@components/common/Header';
import { EmergencyBroadcastBanner } from '@components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@components/common/FuturisticNavbar';
import { DynamicTacticalMap } from '@components/map/DynamicTacticalMap';
import { useEmergency } from '@/context/EmergencyContext';
import {
  Map,
  Layers,
  Flame,
  Droplets,
  AlertTriangle,
  RadioTower,
  ShieldCheck,
  Compass,
  Activity,
  Maximize2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LiveMapPage() {
  const { incidents, sosBeacons, responders, shelters } = useEmergency();
  const [activeHazardFilter, setActiveHazardFilter] = useState<string>('all');

  const pendingSOS = sosBeacons.filter((b) => b.status === 'pending');

  return (
    <main className="flex-1 flex flex-col min-h-screen hologram-grid relative">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
              <Map className="w-6 h-6 text-tactical-accent animate-pulse" />
              LIVE TACTICAL DISASTER MAP & GIS HEATMAP
            </h1>
            <p className="text-xs font-mono text-slate-400">
              SATELLITE RADAR SWEEP, POLYGON DANGER ZONES, PULSING SOS BEACONS & LIVE RESCUE FLEET
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="glass-panel px-3 py-1 rounded-lg border-red-500/40 text-red-400 font-bold flex items-center gap-1.5 neon-glow-red">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{pendingSOS.length} SOS ACTIVE</span>
            </div>

            <div className="glass-panel px-3 py-1 rounded-lg border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{responders.length} UNITS ONLINE</span>
            </div>
          </div>
        </div>

        {/* 3D Glass Tactical Map Container */}
        <div className="glass-panel p-2.5 rounded-2xl border-cyan-500/30 overflow-hidden shadow-2xl relative">
          <DynamicTacticalMap />
        </div>

        {/* Bottom Telemetry Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="glass-panel p-3.5 rounded-xl space-y-2 border-cyan-500/30">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>HYDROLOGICAL SURGE POLYGON</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Yamuna River Sector 4 breach is active at 2.4m depth. Swift-water rescue crafts have priority routing along Ridge corridor.
            </p>
          </div>

          <div className="glass-panel p-3.5 rounded-xl space-y-2 border-orange-500/30">
            <div className="font-bold text-orange-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>THERMAL COMBUSTION PERIMETER</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Connaught gas line rupture core at 580°C with toxic smoke cloud extending 850m south-west. Respiratory gear mandatory.
            </p>
          </div>

          <div className="glass-panel p-3.5 rounded-xl space-y-2 border-yellow-500/30">
            <div className="font-bold text-yellow-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>STRUCTURAL COLLAPSE ZONE</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Pragati Metro multi-tier basement failure (94% damage index). USAR seismic listening active on 30-minute cycles.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
