'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { AutoDispatchHUD } from '@/components/dispatch/AutoDispatchHUD';
import { AIDamageScanner } from '@/components/ai/AIDamageScanner';
import { SOSBeaconView } from '@/components/sos/SOSBeaconView';
import { MeshNetworkView } from '@/components/mesh/MeshNetworkView';
import { DisasterPredictionView } from '@/components/predict/DisasterPredictionView';
import { Users, Sparkles, RadioTower, Network, TrendingUp } from 'lucide-react';

const SUB_TABS = [
  { id: 'dispatch' as const, label: 'Dispatch', icon: Users },
  { id: 'ai-damage' as const, label: 'Damage scan', icon: Sparkles },
  { id: 'sos' as const, label: 'SOS beacons', icon: RadioTower },
  { id: 'mesh' as const, label: 'Mesh relay', icon: Network },
  { id: 'predict' as const, label: 'Forecast', icon: TrendingUp },
];

type SubTab = (typeof SUB_TABS)[number]['id'];

export default function RescueDashboardPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dispatch');

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="mx-auto w-full max-w-[1400px] flex-1 space-y-5 px-4 py-6 md:px-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.6px] text-ink">
            Rescue dispatch
          </h1>
          <p className="mt-1 text-[13px] text-ink-subtle">
            Task assignment, AI damage inspection and offline mesh relay.
          </p>
        </div>

        <div className="flex items-center gap-0.5 overflow-x-auto rounded-md border border-hairline bg-surface-1 p-0.5">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? 'bg-surface-3 text-ink'
                    : 'text-ink-subtle hover:bg-surface-2 hover:text-ink-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-hairline bg-surface-1 p-4 md:p-5">
          {activeSubTab === 'dispatch' && <AutoDispatchHUD />}
          {activeSubTab === 'ai-damage' && <AIDamageScanner />}
          {activeSubTab === 'sos' && <SOSBeaconView />}
          {activeSubTab === 'mesh' && <MeshNetworkView />}
          {activeSubTab === 'predict' && <DisasterPredictionView />}
        </div>
      </div>
    </main>
  );
}
