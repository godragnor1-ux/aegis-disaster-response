'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { DynamicTacticalMap } from '@/components/map/DynamicTacticalMap';
import { useEmergency } from '@/context/EmergencyContext';
import { Panel, PanelHeader, StatusLabel } from '@/components/ui/primitives';
import { Droplets, Flame, Building2 } from 'lucide-react';

const HAZARDS = [
  {
    icon: Droplets,
    title: 'Hydrological surge',
    body: 'Yamuna Sector 4 breach active at 2.4 m depth. Swift-water craft hold priority along the Ridge corridor.',
  },
  {
    icon: Flame,
    title: 'Thermal perimeter',
    body: 'Connaught gas main rupture at 580 °C, smoke plume 850 m south-west. Respiratory gear mandatory on approach.',
  },
  {
    icon: Building2,
    title: 'Structural collapse',
    body: 'Pragati Metro basement failure, damage index 94%. USAR seismic listening running on 30-minute cycles.',
  },
];

export default function LiveMapPage() {
  const { sosBeacons, responders } = useEmergency();
  const [activeHazardFilter, setActiveHazardFilter] = useState<string>('all');

  const pendingSOS = sosBeacons.filter((b) => b.status === 'pending');

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="mx-auto w-full max-w-[1400px] flex-1 space-y-5 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.6px] text-ink">
              Live map
            </h1>
            <p className="mt-1 text-[13px] text-ink-subtle">
              Hazard polygons, SOS beacons and responder positions on one basemap.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5">
              <StatusLabel tone={pendingSOS.length ? 'critical' : 'neutral'}>
                {pendingSOS.length} open SOS
              </StatusLabel>
            </span>
            <span className="rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5">
              <StatusLabel tone={responders.length ? 'ok' : 'neutral'}>
                {responders.length} units on grid
              </StatusLabel>
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
          <DynamicTacticalMap />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {HAZARDS.map((h) => {
            const Icon = h.icon;
            return (
              <Panel key={h.title}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-ink-subtle" />
                  <h2 className="font-display text-[14px] font-medium text-ink">{h.title}</h2>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-subtle">{h.body}</p>
              </Panel>
            );
          })}
        </div>
      </div>
    </main>
  );
}
