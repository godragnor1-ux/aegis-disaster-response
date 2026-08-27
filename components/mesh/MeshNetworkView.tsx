'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  Network,
  Radio,
  WifiOff,
  Zap,
  MessageSquare
} from 'lucide-react';

export const MeshNetworkView: React.FC = () => {
  const { isOfflineMode, setIsOfflineMode } = useEmergency();
  const { playBeep } = useAudioSiren();
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);
  const [meshLogs, setMeshLogs] = useState<{
    packetId: string;
    totalHops: number;
    totalLatencyMs: number;
    hops: { hopIndex: number; from: string; to: string; latencyMs: number; protocol: string; rssi: number; status: string }[];
  } | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  const handleSimulateMeshRelay = async () => {
    setIsSimulatingPacket(true);
    playBeep(900, 'square');

    try {
      const res = await fetch(`${serverUrl}/api/mesh/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            sosId: `SOS-MESH-${Date.now().toString().slice(-4)}`,
            coordinates: [28.6185, 77.2115],
            type: 'TRAPPED_WATER_RISING',
            peopleCount: 4,
            batteryPct: 68
          },
          originNodeId: 'VICTIM-PWA-NODE-8812',
          targetGatewayId: 'AEGIS-COMMAND-HQ'
        })
      });

      const data = await res.json();
      if (data.success) {
        setMeshLogs(data);
        playBeep(1200, 'sine');
      }
    } catch (err) {
      console.error('Mesh Simulation Error:', err);
    } finally {
      setIsSimulatingPacket(false);
    }
  };

  const sampleSMSPayload = 'SOS#28.6185,77.2115#FLOOD#CRITICAL#P:4#BAT:68#T:1724800000';

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Network className="w-6 h-6 text-amber-400 animate-pulse" />
            OFFLINE RESILIENCE & P2P MESH NETWORK SIMULATOR
          </h2>
          <p className="text-xs text-slate-400">
            DECENTRALIZED NODE RELAY (BLE 5.0 / LORA 915MHz / WEBRTC) & SMS DISPATCH GATEWAY
          </p>
        </div>

        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border transition-all ${
            isOfflineMode
              ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-tactical-900 border-tactical-700 text-slate-400 hover:text-white'
          }`}
        >
          <WifiOff className="w-4 h-4" />
          <span>{isOfflineMode ? 'OFFLINE MESH MODE ACTIVE' : 'SWITCH TO OFFLINE MESH'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="tactical-card p-5 rounded-2xl border border-amber-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-tactical-700 pb-2 text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-spin" />
                ACTIVE AD-HOC P2P RELAY TOPOLOGY
              </span>
              <span className="text-[10px] text-slate-400">HOP TOLERANCE: 7 NODES</span>
            </div>

            <div className="p-4 rounded-xl bg-tactical-900/80 border border-tactical-700 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="p-3 rounded-xl bg-red-950/80 border-2 border-red-500 text-center w-full sm:w-28 space-y-1 shadow-[0_0_12px_rgba(255,0,60,0.3)]">
                  <div className="text-[10px] text-red-400 font-bold">NODE 0 (ORIGIN)</div>
                  <div className="text-white font-bold text-xs">VICTIM PWA</div>
                  <div className="text-[9px] text-slate-400">RSSI -68 dBm</div>
                </div>

                <div className="text-amber-400 font-bold rotate-90 sm:rotate-0 animate-pulse">➔</div>

                <div className="p-3 rounded-xl bg-tactical-800 border border-tactical-600 text-center w-full sm:w-28 space-y-1">
                  <div className="text-[10px] text-cyan-400 font-bold">RELAY ALPHA</div>
                  <div className="text-white font-bold text-xs">LoRa Node 1</div>
                  <div className="text-[9px] text-slate-400">BLE 5.0 Mesh</div>
                </div>

                <div className="text-amber-400 font-bold rotate-90 sm:rotate-0 animate-pulse">➔</div>

                <div className="p-3 rounded-xl bg-tactical-800 border border-tactical-600 text-center w-full sm:w-28 space-y-1">
                  <div className="text-[10px] text-cyan-400 font-bold">RELAY BRAVO</div>
                  <div className="text-white font-bold text-xs">Drone Mesh 2</div>
                  <div className="text-[9px] text-slate-400">915MHz LoRa</div>
                </div>

                <div className="text-amber-400 font-bold rotate-90 sm:rotate-0 animate-pulse">➔</div>

                <div className="p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 text-center w-full sm:w-28 space-y-1 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <div className="text-[10px] text-emerald-400 font-bold">BASE GATEWAY</div>
                  <div className="text-white font-bold text-xs">COMMAND HQ</div>
                  <div className="text-[9px] text-emerald-300">SATCOM LINK</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulateMeshRelay}
              disabled={isSimulatingPacket}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isSimulatingPacket ? 'BROADCASTING PACKET THROUGH MESH...' : 'TRANSMIT TEST MESH SOS PACKET'}</span>
            </button>
          </div>

          {meshLogs && (
            <div className="tactical-card p-4 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
                <span className="font-bold text-white">PACKET RELAY TELEMETRY ({meshLogs.packetId})</span>
                <span className="text-cyan-400 font-bold">Total Latency: {meshLogs.totalLatencyMs}ms</span>
              </div>

              <div className="space-y-2">
                {meshLogs.hops.map((hop) => (
                  <div
                    key={hop.hopIndex}
                    className="p-2.5 rounded-lg bg-tactical-900 border border-tactical-700 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-tactical-800 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                        {hop.hopIndex}
                      </span>
                      <span className="text-slate-300">
                        {hop.from} ➔ {hop.to}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{hop.protocol}</span>
                      <span className="text-cyan-300 font-bold">{hop.latencyMs}ms</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold">
                        {hop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="tactical-card p-4 rounded-xl border border-tactical-700 space-y-3 text-xs">
            <h3 className="font-bold text-amber-300 uppercase flex items-center gap-1.5 border-b border-tactical-700 pb-2">
              <MessageSquare className="w-4 h-4" />
              Cellular SMS Fallback Engine
            </h3>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              When all cellular internet and fiber infrastructure collapse, the platform utilizes an automated zero-bandwidth SMS fallback gateway. Emergency telemetry is compressed into a 64-byte encrypted payload.
            </p>

            <div className="p-3 rounded-lg bg-black/60 border border-tactical-700 space-y-2">
              <span className="text-[10px] text-slate-400 block">STANDARD COMPRESSED EMERGENCY SMS PAYLOAD:</span>
              <div className="text-amber-300 font-bold text-xs break-all bg-tactical-900 p-2 rounded border border-tactical-700 select-all">
                {sampleSMSPayload}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Payload Size:</span>
                <span className="text-white font-bold">58 Bytes (Fits in single SMS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway Parsing:</span>
                <span className="text-emerald-400 font-bold">Instant Auto-Ingest</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SMS Dispatch Number:</span>
                <span className="text-cyan-300 font-bold">911 / +1-555-RESQ-SMS</span>
              </div>
            </div>

            <a
              href={`sms:911?body=${encodeURIComponent(sampleSMSPayload)}`}
              className="inline-block w-full text-center py-2.5 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-amber-300 font-bold text-xs transition-colors border border-amber-500/50 mt-2"
            >
              📲 TEST LAUNCH NATIVE SMS CLIENT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
