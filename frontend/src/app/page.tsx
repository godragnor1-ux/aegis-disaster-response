'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { OneTapSOSModal } from '@/components/sos/OneTapSOSModal';
import {
  Bar,
  EmptyState,
  Panel,
  PanelHeader,
  Stat,
  StatusDot,
  StatusLabel,
  severityTone,
} from '@/components/ui/primitives';
import { useEmergency } from '@/context/EmergencyContext';
import { RadioTower, Users, Building2, Flame } from 'lucide-react';

type Tone = 'neutral' | 'critical' | 'warning' | 'ok' | 'brand';

const FLEET_TONE: Record<string, Tone> = {
  available: 'ok',
  en_route: 'warning',
  on_scene: 'warning',
  busy: 'neutral',
  off_duty: 'neutral',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

export default function OverviewPage() {
  const { incidents, sosBeacons, responders, shelters, chatMessages } = useEmergency();
  const [sosOpen, setSosOpen] = useState(false);

  const pendingSOS = useMemo(
    () =>
      sosBeacons
        .filter((b) => b.status === 'pending')
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [sosBeacons]
  );
  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const available = responders.filter((r) => r.status === 'available');
  const capacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
  const occupied = shelters.reduce((sum, s) => sum + s.occupied, 0);
  const peopleAtRisk = pendingSOS.reduce((sum, b) => sum + (b.peopleCount || 0), 0);

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="mx-auto w-full max-w-[1400px] flex-1 space-y-5 px-4 py-6 md:px-6">
        {/* Page header — exactly one primary action on this screen */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.6px] text-ink">
              Command overview
            </h1>
            <p className="mt-1 text-[13px] text-ink-subtle">
              Live operational picture across every sector in the response grid.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/map"
              className="rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-2"
            >
              Open map
            </Link>
            <button
              type="button"
              onClick={() => setSosOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <RadioTower className="h-3.5 w-3.5" />
              Report emergency
            </button>
          </div>
        </div>

        {/* KPI strip — one panel, hairline dividers */}
        <Panel padded={false}>
          <div className="grid grid-cols-2 divide-x divide-hairline md:grid-cols-4">
            <Stat
              label="Active incidents"
              value={activeIncidents.length}
              hint={`${incidents.length} logged this session`}
            />
            <Stat
              label="Open SOS"
              value={pendingSOS.length}
              hint={pendingSOS.length ? `${peopleAtRisk} people awaiting a unit` : 'none unassigned'}
              tone={pendingSOS.length ? 'critical' : 'neutral'}
            />
            <Stat
              label="Units available"
              value={`${available.length}/${responders.length}`}
              hint={
                responders.length - available.length > 0
                  ? `${responders.length - available.length} committed`
                  : 'all units idle'
              }
              tone={available.length ? 'ok' : 'neutral'}
            />
            <Stat
              label="Shelter occupancy"
              value={capacity ? `${Math.round((occupied / capacity) * 100)}%` : '—'}
              hint={capacity ? `${occupied} of ${capacity} spaces` : 'no shelters reporting'}
            />
          </div>
        </Panel>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* Left column: worklist + incidents */}
          <div className="space-y-5 lg:col-span-2">
            <Panel padded={false}>
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3.5 md:px-5">
                <div>
                  <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
                    Priority queue
                  </h2>
                  <p className="mt-0.5 text-[12px] text-ink-subtle">
                    Unassigned SOS beacons, oldest first
                  </p>
                </div>
                <Link
                  href="/rescue"
                  className="text-[12px] text-ink-subtle transition-colors hover:text-ink"
                >
                  Open dispatch
                </Link>
              </div>

              {pendingSOS.length === 0 ? (
                <div className="p-4 md:p-5">
                  <EmptyState
                    icon={<Users className="h-5 w-5" />}
                    title="No unassigned beacons"
                    body="Every SOS in the grid has a unit attached. New beacons appear here the moment they are relayed."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-hairline">
                  {pendingSOS.slice(0, 6).map((b) => {
                    const lowBattery = b.batteryLevel <= 20;
                    return (
                      <li
                        key={b._id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 md:px-5"
                      >
                        <StatusDot tone={severityTone(b.urgency)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="truncate text-[13px] font-medium text-ink">
                              {b.userName || 'Unknown caller'}
                            </span>
                            <span className="whitespace-nowrap font-mono text-[11px] text-ink-subtle">
                              {b.sosId}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-subtle">
                            <span className="capitalize">
                              {b.emergencyType.replace(/_/g, ' ')}
                            </span>
                            <span>·</span>
                            <span>
                              {b.peopleCount} {b.peopleCount === 1 ? 'person' : 'people'}
                            </span>
                            {b.meshRelayed && (
                              <>
                                <span>·</span>
                                <span>
                                  mesh relay, {b.meshHops ?? 1}{' '}
                                  {(b.meshHops ?? 1) === 1 ? 'hop' : 'hops'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-[11px] tabular-nums text-ink-subtle">
                            {timeAgo(b.createdAt)}
                          </div>
                          <div className="mt-0.5 flex items-center justify-end gap-1.5 font-mono text-[11px] text-ink-subtle">
                            {lowBattery && <StatusDot tone="critical" />}
                            battery {b.batteryLevel}%
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel padded={false}>
              <div className="border-b border-hairline px-4 py-3.5 md:px-5">
                <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
                  Active incidents
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-subtle">
                  Hazards currently open across the grid
                </p>
              </div>
              {activeIncidents.length === 0 ? (
                <div className="p-4 md:p-5">
                  <EmptyState
                    icon={<Flame className="h-5 w-5" />}
                    title="No active hazards"
                    body="All logged incidents are contained or resolved."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-hairline">
                  {activeIncidents.map((i) => (
                    <li key={i._id} className="px-4 py-3 md:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-1.5">
                            <StatusDot tone={severityTone(i.severity)} />
                          </span>
                          <div>
                            <p className="text-[13px] font-medium text-ink">{i.title}</p>
                            <p className="mt-0.5 text-[12px] text-ink-subtle">
                              {i.location?.address || 'Location pending'} · {i.affectedCount}{' '}
                              affected
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-subtle">
                          {timeAgo(i.reportedAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Right rail */}
          <div className="space-y-5">
            <Panel>
              <PanelHeader title="Fleet readiness" caption="Responders by availability" />
              {responders.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-5 w-5" />}
                  title="No units on the grid"
                  body="Responder telemetry has not arrived yet."
                />
              ) : (
                <div className="space-y-3">
                  {['available', 'en_route', 'on_scene', 'busy', 'off_duty'].map((status) => {
                    const count = responders.filter((r) => r.status === status).length;
                    if (!count) return null;
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[12px]">
                          <StatusLabel tone={FLEET_TONE[status] ?? 'neutral'}>
                            <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                          </StatusLabel>
                          <span className="font-mono tabular-nums text-ink-subtle">{count}</span>
                        </div>
                        <Bar
                          value={count}
                          max={responders.length}
                          tone={FLEET_TONE[status] ?? 'neutral'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Shelters" caption="Occupancy against capacity" />
              {shelters.length === 0 ? (
                <EmptyState
                  icon={<Building2 className="h-5 w-5" />}
                  title="No shelters reporting"
                  body="Capacity telemetry is unavailable."
                />
              ) : (
                <ul className="space-y-3">
                  {shelters.slice(0, 5).map((s) => {
                    const pct = s.capacity ? Math.round((s.occupied / s.capacity) * 100) : 0;
                    return (
                      <li key={s._id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[12px]">
                          <span className="truncate text-ink-muted">{s.name}</span>
                          <span className="shrink-0 font-mono tabular-nums text-ink-subtle">
                            {s.occupied}/{s.capacity}
                          </span>
                        </div>
                        <Bar
                          value={s.occupied}
                          max={s.capacity}
                          tone={pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'ok'}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Latest traffic" caption="Most recent channel message" />
              {chatMessages.length === 0 ? (
                <EmptyState
                  icon={<RadioTower className="h-5 w-5" />}
                  title="No traffic yet"
                  body="Channel messages appear here as responders and citizens transmit."
                />
              ) : (
                <ul className="space-y-3">
                  {chatMessages.slice(-3).reverse().map((m) => (
                    <li key={m._id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-ink">
                          {m.senderName}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-subtle">
                          {timeAgo(m.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-subtle">
                        {m.message}
                      </p>
                      <p className="mt-1 font-mono text-[11px] capitalize text-ink-subtle">
                        {m.channel.replace(/_/g, ' ')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>

      <OneTapSOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />
    </main>
  );
}
