'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { DynamicRoutingView } from '@/components/routing/DynamicRoutingView';
import { SafeZonesView } from '@/components/shelters/SafeZonesView';
import { Navigation, Building2 } from 'lucide-react';

const TABS = [
  { id: 'routing' as const, label: 'Routing solver', icon: Navigation },
  { id: 'shelters' as const, label: 'Safe zones', icon: Building2 },
];

export default function SafeNavigationPage() {
  const [activeTab, setActiveTab] = useState<'routing' | 'shelters'>('routing');

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="mx-auto w-full max-w-[1400px] flex-1 space-y-5 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.6px] text-ink">
              Safe routes
            </h1>
            <p className="mt-1 text-[13px] text-ink-subtle">
              Hazard-aware evacuation paths and shelter capacity.
            </p>
          </div>

          <div className="flex items-center gap-0.5 rounded-md border border-hairline bg-surface-1 p-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[13px] transition-colors ${
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
        </div>

        <div className="rounded-lg border border-hairline bg-surface-1 p-4 md:p-5">
          {activeTab === 'routing' ? <DynamicRoutingView /> : <SafeZonesView />}
        </div>
      </div>
    </main>
  );
}
