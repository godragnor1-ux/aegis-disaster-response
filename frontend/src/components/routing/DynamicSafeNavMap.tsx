'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Incident, Shelter, SafeRouteResult } from '@/types';

const SafeNavigationMap = dynamic(
  () => import('./SafeNavigationMap').then((mod) => mod.SafeNavigationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-tactical-950 border border-tactical-700/80 flex items-center justify-center font-mono text-xs text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>CALCULATING HAZARD-AVOIDANCE GIS ROUTE MAP...</span>
        </div>
      </div>
    ),
  }
);

interface DynamicSafeNavMapProps {
  startCoords: [number, number];
  destinationCoords: [number, number];
  startName?: string;
  destinationName?: string;
  routeResult: SafeRouteResult | null;
  incidents: Incident[];
  shelters: Shelter[];
}

export const DynamicSafeNavMap: React.FC<DynamicSafeNavMapProps> = (props) => {
  return <SafeNavigationMap {...props} />;
};
export default DynamicSafeNavMap;
