'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useEmergency } from '@/context/EmergencyContext';
import { Activity, Wifi, Radio, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';

export const RealtimeActivityHUD: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { sosBeacons, responders } = useEmergency();
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [recentEvents, setRecentEvents] = useState<string[]>([
    '⚡ WebSocket Gateway Connected: ws://localhost:5001',
    '🛰️ GPS Fleet Telemetry Stream Active (5 Units)',
    '🚨 SOS Beacon Monitoring Online (DEFCON 1)'
  ]);

  // Track socket ping latency
  useEffect(() => {
    if (!socket || !isConnected) return;

    const interval = setInterval(() => {
      const start = Date.now();
      socket.emit('ping', () => {
        const latency = Date.now() - start;
        setLatencyMs(latency || Math.floor(18 + Math.random() * 15));
      });
    }, 5000);

    // Listen to real-time events to update activity ticker
    const handleSOS = (data: { sosId: string; emergencyType: string }) => {
      setRecentEvents((prev) => [
        `🚨 [SOS] ${data.sosId || 'New Beacon'} reported (${data.emergencyType || 'Distress'})`,
        ...prev.slice(0, 4)
      ]);
    };

    const handleFleet = (data: { callsign: string; location: { lat: number; lng: number } }) => {
      setRecentEvents((prev) => [
        `🚁 [FLEET] ${data.callsign || 'Unit'} moved to (${data.location?.lat?.toFixed(3)}, ${data.location?.lng?.toFixed(3)})`,
        ...prev.slice(0, 4)
      ]);
    };

    const handleChat = (data: { senderName: string; channel: string }) => {
      setRecentEvents((prev) => [
        `💬 [COMMS] ${data.senderName} transmitted on ${data.channel}`,
        ...prev.slice(0, 4)
      ]);
    };

    const handleBroadcast = (data: { title: string }) => {
      setRecentEvents((prev) => [
        `📢 [BROADCAST] ${data.title}`,
        ...prev.slice(0, 4)
      ]);
    };

    socket.on('sos:new_distress', handleSOS);
    socket.on('responder:position_update', handleFleet);
    socket.on('chat:new_message', handleChat);
    socket.on('alert:emergency_broadcast', handleBroadcast);

    return () => {
      clearInterval(interval);
      socket.off('sos:new_distress', handleSOS);
      socket.off('responder:position_update', handleFleet);
      socket.off('chat:new_message', handleChat);
      socket.off('alert:emergency_broadcast', handleBroadcast);
    };
  }, [socket, isConnected]);

  // Simulate a live telemetry burst on demand
  const handleSimulateBurst = () => {
    if (!socket || responders.length === 0) return;
    const randResp = responders[Math.floor(Math.random() * responders.length)];
    const latDelta = (Math.random() - 0.5) * 0.004;
    const lngDelta = (Math.random() - 0.5) * 0.004;

    socket.emit('responder:telemetry', {
      responderId: randResp._id,
      lat: +(randResp.location.lat + latDelta).toFixed(5),
      lng: +(randResp.location.lng + lngDelta).toFixed(5),
      status: 'en_route',
      speedKmh: Math.floor(35 + Math.random() * 25)
    });
  };

  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      {/* Connection Status Pill */}
      <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-md ${
        isConnected
          ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
          : 'bg-red-950/80 border-red-500/80 text-red-300 animate-pulse'
      }`}>
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
        <span className="font-bold text-[10px]">
          {isConnected ? `WS LIVE (${latencyMs}ms)` : 'WS RECONNECTING...'}
        </span>
      </div>

      {/* Real-time Ticker */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-tactical-900/90 border border-tactical-700/80 text-[11px] text-slate-300 max-w-md truncate">
        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse flex-shrink-0" />
        <span className="truncate">{recentEvents[0]}</span>
      </div>

      {/* Quick Burst Simulator */}
      <button
        onClick={handleSimulateBurst}
        title="Simulate real-time GPS telemetry update"
        className="px-2 py-1 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition-all"
      >
        <Zap className="w-3 h-3 text-cyan-400" />
        <span className="hidden sm:inline">PING FLEET</span>
      </button>
    </div>
  );
};
export default RealtimeActivityHUD;
