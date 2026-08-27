'use client';

import React, { useState, useEffect } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Milestone,
  Truck,
  Ship,
  Footprints,
  Compass,
  ArrowRight,
  CheckCircle,
  MapPin,
  Hospital,
  Sparkles,
  Zap
} from 'lucide-react';
import { SafeRouteResult } from '@/types';
import { DynamicSafeNavMap } from './DynamicSafeNavMap';

export const DynamicRoutingView: React.FC = () => {
  const { incidents, shelters, sosBeacons } = useEmergency();
  const { playBeep, speakAlert } = useAudioSiren();

  const [mode, setMode] = useState<'rescue_vehicle' | 'rescue_boat' | 'foot'>('rescue_vehicle');
  const [startPoint, setStartPoint] = useState<string>('SOS-2026-8812');
  const [destinationPoint, setDestinationPoint] = useState<string>('shelter-1');
  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResult | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  const locationPresets: Record<string, { name: string; coords: [number, number] }> = {
    'SOS-2026-8812': { name: 'Trapped Family (Sector 4 Flood Balcony)', coords: [28.6185, 77.2115] },
    'SOS-2026-9041': { name: 'Basement Parking Collapse (Pragati Metro)', coords: [28.6380, 77.2380] },
    'SOS-2026-6420': { name: 'Connaught Central Smoke Plume', coords: [28.6295, 77.2210] },
    'shelter-1': { name: 'Indira Memorial Sports Complex Safe Haven', coords: [28.5950, 77.2050] },
    'shelter-2': { name: 'AIIMS Field Emergency Hospital Delta', coords: [28.5680, 77.2100] },
    'shelter-3': { name: 'Northern Sector Technical College Relief Camp', coords: [28.6650, 77.2180] }
  };

  const getStartCoords = (): [number, number] => locationPresets[startPoint]?.coords || [28.6185, 77.2115];
  const getDestCoords = (): [number, number] => locationPresets[destinationPoint]?.coords || [28.5950, 77.2050];

  // Compute Safe Route
  const handleComputeRoute = async () => {
    setIsLoading(true);
    try {
      const startCoords = getStartCoords();
      const destCoords = getDestCoords();

      const res = await fetch(`${serverUrl}/api/routing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startCoords,
          destination: destCoords,
          mode
        })
      });

      const data = await res.json();
      if (data.success) {
        setRouteResult(data);
      }
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleComputeRoute();
  }, [mode, startPoint, destinationPoint]);

  // "Find Nearest Safe Location" Algorithm
  const handleFindNearestSafeHaven = () => {
    const startCoords = getStartCoords();
    let bestShelterKey = 'shelter-1';
    let minDistance = Infinity;

    Object.entries(locationPresets).forEach(([key, val]) => {
      if (key.startsWith('shelter')) {
        const dLat = val.coords[0] - startCoords[0];
        const dLng = val.coords[1] - startCoords[1];
        const distSq = dLat * dLat + dLng * dLng;
        if (distSq < minDistance) {
          minDistance = distSq;
          bestShelterKey = key;
        }
      }
    });

    setDestinationPoint(bestShelterKey);
    playBeep(1150, 'sine');
    speakAlert(`Nearest safe evacuation haven locked: ${locationPresets[bestShelterKey]?.name}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-mono">
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tactical-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-6 h-6 text-cyan-400 animate-pulse" />
            SAFE ZONE NAVIGATION & HAZARD-AVOIDANCE ROUTING
          </h2>
          <p className="text-xs text-slate-400">
            AUTONOMOUS GEOSPATIAL PATHFINDING AVOIDING FLOOD INUNDATIONS, FIRE PERIMETERS & STRUCTURAL DEBRIS
          </p>
        </div>

        <button
          onClick={handleFindNearestSafeHaven}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400 transition-all"
        >
          <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span>🎯 FIND NEAREST SAFE HAVEN</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Controls & Active Hazard Indicators */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Route Parameters Card */}
          <div className="tactical-card p-4 rounded-xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-200 uppercase flex items-center gap-1.5 border-b border-tactical-700 pb-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              1. Route Parameters
            </h3>

            {/* Evacuation Mode */}
            <div>
              <label className="text-slate-400 mb-1.5 block font-bold">EVACUATION / TRANSIT MODE:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rescue_vehicle', label: 'Ambulance / Truck', icon: Truck },
                  { id: 'rescue_boat', label: 'Rescue Boat', icon: Ship },
                  { id: 'foot', label: 'Foot Patrol', icon: Footprints }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as typeof mode)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        mode === m.id
                          ? 'bg-tactical-800 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'bg-tactical-900/60 border-tactical-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Origin Location */}
            <div>
              <label className="text-slate-400 mb-1.5 block font-bold">ORIGIN / VICTIM DISTRESS LOCATION:</label>
              <select
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-tactical-900 border border-tactical-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-bold"
              >
                <option value="SOS-2026-8812">📍 SOS-8812: Sector 4 Flood Balcony</option>
                <option value="SOS-2026-9041">📍 SOS-9041: Pragati Metro Collapse</option>
                <option value="SOS-2026-6420">📍 SOS-6420: Connaught Fire Smoke</option>
              </select>
            </div>

            {/* Destination Safe Zone */}
            <div>
              <label className="text-slate-400 mb-1.5 block font-bold">DESTINATION SAFE HAVEN / FIELD HOSPITAL:</label>
              <select
                value={destinationPoint}
                onChange={(e) => setDestinationPoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-tactical-900 border border-tactical-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-bold"
              >
                <option value="shelter-1">🏥 Indira Memorial Sports Complex (Safe Haven)</option>
                <option value="shelter-2">🏥 AIIMS Field Hospital Delta</option>
                <option value="shelter-3">🏥 Northern Sector Technical College Camp</option>
              </select>
            </div>

            <button
              onClick={handleComputeRoute}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_#00f0ff]"
            >
              {isLoading ? 'CALCULATING SAFE PATH...' : 'RE-CALCULATE EVACUATION ROUTE'}
            </button>
          </div>

          {/* Active Hazards Avoided */}
          <div className="tactical-card p-4 rounded-xl border border-red-500/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>ACTIVE HAZARDS AVOIDED ALONG CORRIDOR</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>🌊 Yamuna River Flash Flood:</span>
                <span className="text-cyan-400 font-bold">2.4m Depth (Bypassed)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🔥 Connaught Gas Pipeline Fire:</span>
                <span className="text-orange-400 font-bold">580°C (500m Standoff)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🏚️ Metro Plaza Structural Collapse:</span>
                <span className="text-yellow-400 font-bold">94% Damage Index</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Navigation Map & Telemetry HUD */}
        <div className="lg:col-span-8 space-y-4">
          {/* Telemetry Metric Cards */}
          {routeResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="tactical-card p-3.5 rounded-xl border border-cyan-500/40">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Milestone className="w-3.5 h-3.5 text-cyan-400" />
                  TOTAL DISTANCE
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {routeResult.distanceKm} <span className="text-xs text-cyan-400 font-normal">km</span>
                </div>
              </div>

              <div className="tactical-card p-3.5 rounded-xl border border-cyan-500/40">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  ESTIMATED TIME (ETA)
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  ~{routeResult.etaMinutes} <span className="text-xs text-yellow-400 font-normal">mins</span>
                </div>
              </div>

              <div className="tactical-card p-3.5 rounded-xl border border-emerald-500/40">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  CORRIDOR SAFETY RATING
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-1 uppercase">
                  {routeResult.riskScore}
                </div>
              </div>
            </div>
          )}

          {/* Interactive GIS Navigation Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-cyan-400" />
                TACTICAL HAZARD-AVOIDANCE GIS ROUTE MAP
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                ● Solid Cyan = Safe Bypass | ╌ Dashed Red = Blocked Path
              </span>
            </div>

            <DynamicSafeNavMap
              startCoords={getStartCoords()}
              destinationCoords={getDestCoords()}
              startName={locationPresets[startPoint]?.name}
              destinationName={locationPresets[destinationPoint]?.name}
              routeResult={routeResult}
              incidents={incidents}
              shelters={shelters}
            />
          </div>

          {/* Turn-by-turn Clearance Guidance */}
          {routeResult?.turnByTurn && (
            <div className="tactical-card p-4 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 uppercase flex items-center gap-1.5 border-b border-tactical-700 pb-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                Turn-by-Turn Safe Clearance Guidance
              </h4>

              <div className="space-y-2">
                {routeResult.turnByTurn.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-tactical-900/60 border border-tactical-800 text-xs">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 text-slate-300">{step.instruction}</div>
                    <span className="text-amber-400 font-bold text-[11px]">{step.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
