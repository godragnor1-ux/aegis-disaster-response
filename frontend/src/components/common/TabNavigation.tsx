'use client';

import React from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import {
  Map,
  RadioTower,
  Navigation,
  Sparkles,
  Users,
  TrendingUp,
  Building2,
  Search,
  MessageSquare,
  Network
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'map', label: 'Tactical Map', icon: Map, badge: null },
  { id: 'sos', label: 'SOS Beacon', icon: RadioTower, badge: 'SOS', isAlert: true },
  { id: 'routing', label: 'Safe Routing', icon: Navigation, badge: null },
  { id: 'ai-damage', label: 'AI Vision Damage', icon: Sparkles, badge: 'AI' },
  { id: 'dispatch', label: 'Auto Dispatch', icon: Users, badge: null },
  { id: 'predict', label: 'Prediction Hub', icon: TrendingUp, badge: 'Forecast' },
  { id: 'shelters', label: 'Safe Shelters', icon: Building2, badge: null },
  { id: 'missing', label: 'Missing Persons', icon: Search, badge: null },
  { id: 'comms', label: 'Radio & Comms', icon: MessageSquare, badge: null },
  { id: 'mesh', label: 'Mesh & Offline', icon: Network, badge: 'P2P' },
];

export const TabNavigation: React.FC = () => {
  const { activeTab, setActiveTab, sosBeacons } = useEmergency();
  const pendingSOS = sosBeacons.filter((b) => b.status === 'pending').length;

  return (
    <nav className="border-b border-tactical-800 bg-tactical-950/70 backdrop-blur-md px-2 py-1.5 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative px-3.5 py-2 rounded-lg font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? item.isAlert
                    ? 'bg-red-950/90 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(255,0,60,0.4)]'
                    : 'bg-tactical-800/90 text-tactical-accent border border-tactical-accent/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? (item.isAlert ? 'text-red-400' : 'text-tactical-accent') : 'text-slate-500'}`} />
              <span>{item.label}</span>

              {item.id === 'sos' && pendingSOS > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                  {pendingSOS}
                </span>
              )}

              {item.badge && item.id !== 'sos' && (
                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-tactical-900 text-slate-400 border border-tactical-700/60">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute bottom-0 left-2 right-2 h-0.5 ${
                    item.isAlert ? 'bg-red-500' : 'bg-tactical-accent'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
