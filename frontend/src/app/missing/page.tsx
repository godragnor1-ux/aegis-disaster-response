'use client';

import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { MissingPersonsView } from '@/components/missing/MissingPersonsView';

export default function MissingPersonsPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="mx-auto w-full max-w-[1400px] flex-1 space-y-5 px-4 py-6 md:px-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.6px] text-ink">
            Missing persons
          </h1>
          <p className="mt-1 text-[13px] text-ink-subtle">
            Registry, sighting log and reunification status for displaced people.
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-1 p-4 md:p-5">
          <MissingPersonsView />
        </div>
      </div>
    </main>
  );
}
