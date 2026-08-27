'use client';

import React, { useState, useEffect } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useSocket } from '@/context/SocketContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  Flame,
  Clock,
  RadioTower,
  Bell
} from 'lucide-react';

export const Header: React.FC = () => {
  const { isConnected } = useSocket();
  const { sosBeacons, incidents, isOfflineMode, setIsOfflineMode, setActiveTab } = useEmergency();
  const { isMuted, isPlayingSiren, toggleMute, playSiren, stopSiren } = useAudioSiren();
  const [timeString, setTimeString] = useState('');
  const [utcString, setUtcString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString());
      setUtcString(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pendingSOSCount = sosBeacons.filter((b) => b.status === 'pending').length;
  const activeIncidentsCount = incidents.filter((i) => i.status === 'active').length;

  return (
    <header className="sticky top-0 z-30 border-b border-tactical-700/60 bg-tactical-950/90 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/60 text-red-500 shadow-[0_0_15px_rgba(255,0,60,0.5)]">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                AEGIS<span className="text-tactical-accent">PULSE</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/80 font-mono font-bold tracking-wider animate-pulse">
                CODE RED ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              TACTICAL REAL-TIME DISASTER RESPONSE & RESCUE GRID
            </p>
          </div>
        </div>

        {/* Center: Live Telemetry Metrics */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-tactical-900/80 border border-tactical-700/50">
            <Clock className="w-3.5 h-3.5 text-tactical-accent" />
            <span className="text-slate-200">{timeString}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{utcString}</span>
          </div>

          <button
            onClick={() => setActiveTab('sos')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/60 border border-red-600/60 text-red-400 hover:bg-red-900/50 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            <span>CRITICAL SOS:</span>
            <span className="font-bold text-white bg-red-600 px-1.5 rounded-full text-[10px]">
              {pendingSOSCount}
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-tactical-900/80 border border-tactical-700/50 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            <span>INCIDENTS:</span>
            <span className="font-bold text-yellow-400">{activeIncidentsCount}</span>
          </div>
        </div>

        {/* Right: Controls (Audio Siren, Mesh Offline Toggle, SOS Quick) */}
        <div className="flex items-center gap-2">
          {/* Offline Mode Simulator Toggle */}
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
              isOfflineMode
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-tactical-900/60 border-tactical-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Offline Mesh Simulation"
          >
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden lg:inline">OFFLINE MESH</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">LIVE 5G/NET</span>
              </>
            )}
          </button>

          {/* Siren Synthesizer Toggle */}
          <div className="flex items-center bg-tactical-900/80 border border-tactical-700 rounded-md p-0.5">
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded text-xs transition-colors ${
                isMuted ? 'text-slate-500 hover:text-slate-400' : 'text-tactical-accent hover:bg-tactical-800'
              }`}
              title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (isPlayingSiren) stopSiren();
                else playSiren(10);
              }}
              className={`px-2 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                isPlayingSiren
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_12px_rgba(255,0,0,0.8)]'
                  : 'text-red-400 hover:bg-red-950/50'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${isPlayingSiren ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isPlayingSiren ? 'SIREN WAILING' : 'TEST SIREN'}</span>
            </button>
          </div>

          {/* Quick SOS Trigger Button */}
          <button
            onClick={() => setActiveTab('sos')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(255,0,60,0.6)] border border-red-400/50 transition-all transform hover:scale-105"
          >
            <RadioTower className="w-4 h-4 animate-ping" />
            <span>TRIGGER SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
