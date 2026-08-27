'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import {
  Building2,
  Droplets,
  Zap,
  HeartPulse,
  Package,
  MapPin,
  Users,
  ArrowRight
} from 'lucide-react';
import { Shelter } from '@/types';

export const SafeZonesView: React.FC = () => {
  const { shelters, setActiveTab, fetchInitialData } = useEmergency();
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkinCount, setCheckinCount] = useState(1);

  const serverUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  const handleCheckin = async (shelter: Shelter) => {
    setIsUpdating(true);
    try {
      const newOccupied = Math.min(shelter.capacity, shelter.occupied + checkinCount);
      const newWater = Math.max(0, shelter.supplies.waterLiters - checkinCount * 15);
      const newFood = Math.max(0, shelter.supplies.foodMREs - checkinCount * 3);

      await fetch(`${serverUrl}/api/shelters/${shelter._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupied: newOccupied,
          supplies: {
            ...shelter.supplies,
            waterLiters: newWater,
            foodMREs: newFood
          },
          status: newOccupied >= shelter.capacity ? 'full' : 'open'
        })
      });

      await fetchInitialData();
    } catch (err) {
      console.error('Shelter checkin error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400 animate-pulse" />
            SAFE ZONES & RELIEF SHELTER DIRECTORY
          </h2>
          <p className="text-xs font-mono text-slate-400">
            REAL-TIME CAPACITY GAUGES, MEDICAL BEDS, DRINKING WATER & RELIEF INVENTORY
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
        {shelters.map((shelter) => {
          const occupancyPct = Math.round((shelter.occupied / shelter.capacity) * 100);
          const isFull = shelter.status === 'full' || occupancyPct >= 95;

          return (
            <div
              key={shelter._id}
              className={`tactical-card p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isFull
                  ? 'border-red-500/60 shadow-[0_0_20px_rgba(255,0,0,0.2)]'
                  : 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isFull
                          ? 'bg-red-950 text-red-300 border border-red-600'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                      }`}
                    >
                      {shelter.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase">
                      {shelter.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide">
                    {shelter.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{shelter.location.address}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-tactical-900 border border-tactical-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Occupancy:</span>
                    <span className="text-white font-bold">
                      {shelter.occupied} / {shelter.capacity} Beds ({occupancyPct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        occupancyPct > 85 ? 'bg-red-500' : occupancyPct > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-tactical-900/60 border border-tactical-700 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">Clean Water</div>
                      <div className="font-bold text-white">{shelter.supplies.waterLiters.toLocaleString()} L</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-tactical-900/60 border border-tactical-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">Food MREs</div>
                      <div className="font-bold text-white">{shelter.supplies.foodMREs.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-tactical-900/60 border border-tactical-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">Generators</div>
                      <div className="font-bold text-white">{shelter.supplies.powerGenerators} Units</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-tactical-900/60 border border-tactical-700 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">ICU Bays</div>
                      <div className="font-bold text-white">{shelter.supplies.medicalBays} Beds</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {shelter.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-tactical-900 text-slate-300 text-[10px] border border-tactical-700"
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-tactical-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={checkinCount}
                    onChange={(e) => setCheckinCount(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 rounded bg-tactical-900 border border-tactical-700 text-white text-xs text-center"
                  />
                  <button
                    onClick={() => handleCheckin(shelter)}
                    disabled={isUpdating || isFull}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Check-in Survivors</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('routing')}
                  className="w-full py-1.5 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-cyan-300 text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-tactical-700"
                >
                  <span>Route Evacuation Path</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
