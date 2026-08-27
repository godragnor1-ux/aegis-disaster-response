'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';

const TacticalMapInternal = dynamic(
  () => import('./TacticalDisasterMap').then((mod) => mod.TacticalDisasterMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-140px)] min-h-[600px] rounded-xl flex flex-col items-center justify-center bg-tactical-950 border border-tactical-800 text-slate-400 font-mono">
        <Loader2 className="w-8 h-8 text-tactical-accent animate-spin mb-3" />
        <span className="text-sm tracking-wider">INITIALIZING SATELLITE RADAR & GIS TELEMETRY...</span>
      </div>
    ),
  }
);

export const DynamicTacticalMap = (): any => {
  return React.createElement(TacticalMapInternal, null);
};
