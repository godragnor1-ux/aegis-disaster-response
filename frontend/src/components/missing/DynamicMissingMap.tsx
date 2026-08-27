'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MissingPerson } from '@/types';

const MissingPersonMap = dynamic(
  () => import('./MissingPersonMap').then((mod) => mod.MissingPersonMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-tactical-950 border border-tactical-700/80 flex items-center justify-center font-mono text-xs text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>INITIALIZING GIS REGISTRY MAP...</span>
        </div>
      </div>
    ),
  }
);

interface DynamicMissingMapProps {
  persons: MissingPerson[];
  onSelectPerson?: (person: MissingPerson) => void;
}

export const DynamicMissingMap: React.FC<DynamicMissingMapProps> = (props) => {
  return <MissingPersonMap {...props} />;
};
export default DynamicMissingMap;
