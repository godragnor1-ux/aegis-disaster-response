'use client';

import React, { useState, useEffect } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  Users,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Flame,
  Droplets,
  Truck,
  Ship,
  Sparkles,
  ArrowRight,
  Battery,
  MapPin,
  Zap,
  Gauge,
  Navigation
} from 'lucide-react';
import { Responder, SOSBeacon } from '@/types';

export const AutoDispatchHUD: React.FC = () => {
  const { sosBeacons, responders, fetchInitialData } = useEmergency();
  const { playBeep, speakAlert } = useAudioSiren();
  const [selectedSOS, setSelectedSOS] = useState<SOSBeacon | null>(sosBeacons[0] || null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isAutoDispatchingAll, setIsAutoDispatchingAll] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  const pendingBeacons = sosBeacons.filter((b) => b.status === 'pending');
  const activeResponders = responders;

  // Auto-select first beacon if selected is null
  useEffect(() => {
    if (!selectedSOS && sosBeacons.length > 0) {
      setSelectedSOS(sosBeacons[0]);
    }
  }, [sosBeacons, selectedSOS]);

  // Client-side multi-factor scoring calculation for instant reactive UI
  const calculateCandidateScore = (beacon: SOSBeacon, resp: Responder) => {
    // 1. Distance
    const lat1 = beacon.location.lat;
    const lon1 = beacon.location.lng;
    const lat2 = resp.location.lat;
    const lon2 = resp.location.lng;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = Math.max(0.1, +(R * c).toFixed(2));

    const distanceScore = +(35 / (1 + distKm / 2.5)).toFixed(1);

    // Speed estimate
    const vehicleSpeed =
      resp.role === 'swift_water' ? 35 : resp.role === 'paramedic' ? 50 : resp.role === 'firefighter' ? 40 : 45;
    const etaMinutes = Math.max(2, Math.round((distKm / vehicleSpeed) * 60 + 1.5));

    // 2. Severity Score
    const severityScore = beacon.urgency === 'critical' ? 25 : beacon.urgency === 'high' ? 20 : 14;

    // 3. Availability Score
    const availScore = resp.status === 'available' ? 20 : resp.status === 'en_route' ? 6 : 0;

    // 4. Skill Match
    let skillScore = 8;
    if (beacon.emergencyType.includes('flood') && resp.role === 'swift_water') skillScore = 15;
    else if (beacon.emergencyType.includes('trapped') && (resp.role === 'k9_search' || resp.role === 'firefighter'))
      skillScore = 15;
    else if (beacon.emergencyType.includes('medical') && resp.role === 'paramedic') skillScore = 15;
    else if (beacon.emergencyType.includes('fire') && resp.role === 'firefighter') skillScore = 15;

    // 5. Battery Readiness
    const batteryScore = +(((resp.batteryLevel || 85) / 100) * 5).toFixed(1);

    const totalPct = +Math.min(100, Math.max(10, distanceScore + severityScore + availScore + skillScore + batteryScore)).toFixed(1);

    return {
      distKm,
      etaMinutes,
      distanceScore,
      severityScore,
      availScore,
      skillScore,
      batteryScore,
      totalPct,
      fitRating: totalPct >= 80 ? 'EXCELLENT_MATCH' : totalPct >= 65 ? 'STRONG_MATCH' : 'ADEQUATE_MATCH'
    };
  };

  // Manual Dispatch Trigger
  const handleManualDispatch = async (sos: SOSBeacon, resp: Responder) => {
    setIsDispatching(true);
    try {
      await fetch(`${serverUrl}/api/sos/${sos._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'assigned',
          assignedResponderId: resp._id,
          assignedResponderName: `${resp.callsign} (${resp.name})`,
          notes: `Dispatched ${resp.callsign} (${resp.name})`
        })
      });

      await fetch(`${serverUrl}/api/responders/${resp._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'en_route',
          activeTaskId: sos.sosId
        })
      });

      playBeep(1100, 'sine');
      speakAlert(`Unit ${resp.callsign} dispatched to incident ${sos.sosId}`);
      setDispatchSuccess(`Successfully dispatched ${resp.callsign} to ${sos.sosId}`);

      await fetchInitialData();
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Auto-Assign Optimal Candidate for Selected SOS
  const handleAutoAssignOptimal = async () => {
    if (!selectedSOS) return;
    setIsDispatching(true);

    try {
      // Find highest scoring responder
      const scored = activeResponders
        .map((resp) => ({
          resp,
          metrics: calculateCandidateScore(selectedSOS, resp)
        }))
        .sort((a, b) => b.metrics.totalPct - a.metrics.totalPct);

      if (scored.length > 0) {
        const top = scored[0];
        await handleManualDispatch(selectedSOS, top.resp);
      }
    } catch (err) {
      console.error('Auto Assign error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Global Auto-Dispatch for All Sector Tasks
  const handleAutoDispatchAll = async () => {
    setIsAutoDispatchingAll(true);
    try {
      const res = await fetch(`${serverUrl}/api/tasks/auto-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      playBeep(1200, 'sine');
      speakAlert(`AI Auto-Dispatch complete. ${data.countAssigned || 0} rescue units mobilized.`);
      setDispatchSuccess(`Auto-dispatched ${data.countAssigned || 0} rescue units across active sectors.`);
      await fetchInitialData();
    } catch (err) {
      console.error('Auto dispatch all error:', err);
    } finally {
      setIsAutoDispatchingAll(false);
    }
  };

  const handleResolveTask = async (sos: SOSBeacon, resp?: Responder) => {
    try {
      await fetch(`${serverUrl}/api/sos/${sos._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });

      if (resp) {
        await fetch(`${serverUrl}/api/responders/${resp._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'available', activeTaskId: null })
        });
      }

      playBeep(880, 'sine');
      speakAlert(`Incident ${sos.sosId} marked resolved. Survivors evacuated.`);
      await fetchInitialData();
    } catch (err) {
      console.error('Resolve task error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tactical-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400 animate-pulse" />
            AUTOMATED TASK ASSIGNMENT & FLEET DISPATCH ENGINE
          </h2>
          <p className="text-xs font-mono text-slate-400">
            MULTI-FACTOR SCORING: DISTANCE (35%) + SEVERITY (25%) + AVAILABILITY (20%) + SKILL MATCH (15%) + BATTERY (5%)
          </p>
        </div>

        <button
          onClick={handleAutoDispatchAll}
          disabled={isAutoDispatchingAll}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black font-mono text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
        >
          <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span>{isAutoDispatchingAll ? 'MOBILIZING FLEET...' : '⚡ AUTO-DISPATCH ALL SECTORS'}</span>
        </button>
      </div>

      {dispatchSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 font-mono text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{dispatchSuccess}</span>
          </div>
          <button onClick={() => setDispatchSuccess(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active SOS Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="tactical-card p-4 rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-tactical-700/60 pb-2">
              <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                Active SOS Distress Queue ({sosBeacons.length})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-600 font-bold">
                {pendingBeacons.length} PENDING
              </span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {sosBeacons.map((beacon) => {
                const isSelected = selectedSOS?._id === beacon._id;
                return (
                  <div
                    key={beacon._id}
                    onClick={() => setSelectedSOS(beacon)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-tactical-800 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                        : 'bg-tactical-900/60 border-tactical-700 hover:border-tactical-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs">{beacon.sosId}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          beacon.status === 'pending'
                            ? 'bg-red-950 text-red-400 border border-red-600 animate-pulse'
                            : beacon.status === 'assigned' || beacon.status === 'en_route'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                        }`}
                      >
                        {beacon.status}
                      </span>
                    </div>

                    <div className="text-slate-200 font-sans text-xs font-bold">
                      {beacon.userName}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Type: <strong className="text-red-300">{beacon.emergencyType}</strong></span>
                      <span>Survivors: <strong className="text-white">{beacon.peopleCount}</strong></span>
                      <span>Battery: <strong className="text-emerald-400">{beacon.batteryLevel}%</strong></span>
                    </div>

                    {beacon.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-1.5 truncate">
                        &ldquo;{beacon.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Incident & Candidate Scoring Matrix */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSOS ? (
            <div className="space-y-4">
              {/* Selected Target HUD Banner */}
              <div className="tactical-card p-4 rounded-xl border border-red-500/50 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-400 text-sm">{selectedSOS.sosId}</span>
                    <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-200 text-[10px] font-bold">
                      URGENCY: {selectedSOS.urgency.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedSOS.status === 'pending' && (
                      <button
                        onClick={handleAutoAssignOptimal}
                        disabled={isDispatching}
                        className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center gap-1 shadow-[0_0_10px_#00f0ff] transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>AUTO-ASSIGN OPTIMAL</span>
                      </button>
                    )}

                    {selectedSOS.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveTask(selectedSOS)}
                        className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1 border-t border-tactical-800">
                  <div>Contact: <span className="text-white font-bold">{selectedSOS.userPhone}</span></div>
                  <div>Coords: <span className="text-cyan-400 font-bold">{selectedSOS.location.lat}, {selectedSOS.location.lng}</span></div>
                  <div>People: <span className="text-white font-bold">{selectedSOS.peopleCount}</span></div>
                  <div>Battery: <span className="text-emerald-400 font-bold">{selectedSOS.batteryLevel}%</span></div>
                </div>
              </div>

              {/* Scored First-Responder Candidates Matrix */}
              <div className="tactical-card p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
                  <h3 className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    AI Evaluated Responder Candidates (Ranked)
                  </h3>
                  <span className="text-[10px] text-slate-400">SCORED BY DISTANCE, SEVERITY & AVAILABILITY</span>
                </div>

                <div className="space-y-3">
                  {activeResponders
                    .map((resp) => ({
                      resp,
                      metrics: calculateCandidateScore(selectedSOS, resp)
                    }))
                    .sort((a, b) => b.metrics.totalPct - a.metrics.totalPct)
                    .map(({ resp, metrics }, idx) => {
                      const isTopMatch = idx === 0;
                      return (
                        <div
                          key={resp._id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isTopMatch
                              ? 'bg-tactical-800/90 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                              : 'bg-tactical-900/60 border-tactical-700'
                          }`}
                        >
                          {/* Candidate Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{resp.callsign}</span>
                              <span className="text-xs text-slate-300">({resp.name})</span>
                              {isTopMatch && (
                                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-400 text-[10px] font-bold">
                                  ⭐ OPTIMAL MATCH ({metrics.totalPct}%)
                                </span>
                              )}
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                resp.status === 'available'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                  : resp.status === 'en_route'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500 animate-pulse'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {resp.status}
                            </span>
                          </div>

                          {/* Candidate Role & Vehicle */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 mb-2.5">
                            <div>Role: <strong className="text-cyan-300">{resp.role.toUpperCase()}</strong></div>
                            <div>Vehicle: <strong className="text-slate-200">{resp.vehicleType}</strong></div>
                            <div>Distance: <strong className="text-amber-400">{metrics.distKm} km</strong> (ETA: ~{metrics.etaMinutes}m)</div>
                          </div>

                          {/* Score Breakdown Bar Matrix */}
                          <div className="space-y-1.5 p-2 rounded-lg bg-tactical-950/80 border border-tactical-800 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Distance Score (Max 35):</span>
                              <span className="text-cyan-300 font-bold">{metrics.distanceScore} pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Severity Factor (Max 25):</span>
                              <span className="text-red-300 font-bold">{metrics.severityScore} pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Availability Factor (Max 20):</span>
                              <span className="text-emerald-300 font-bold">{metrics.availScore} pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Skill & Equipment Fit (Max 15):</span>
                              <span className="text-purple-300 font-bold">{metrics.skillScore} pts</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full"
                                style={{ width: `${metrics.totalPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Dispatch Action */}
                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-tactical-700/60">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-400">Fit Rating:</span>
                              <span className="text-emerald-400 font-bold">{metrics.fitRating}</span>
                            </div>

                            <button
                              onClick={() => handleManualDispatch(selectedSOS, resp)}
                              disabled={isDispatching || resp.status === 'busy'}
                              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>DISPATCH {resp.callsign}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="tactical-card p-12 rounded-xl text-center space-y-3 font-mono text-xs text-slate-400">
              <Users className="w-8 h-8 text-cyan-400 mx-auto" />
              <p>Select a pending SOS distress beacon from the queue on the left to evaluate responder matching.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
