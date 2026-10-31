'use client';

import { Header } from '@/components/common/Header';
import { EmergencyBroadcastBanner } from '@/components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@/components/common/FuturisticNavbar';
import { TacticalCommsView } from '@/components/comms/TacticalCommsView';

export default function CommunicationPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="mx-auto w-full max-w-[1400px] flex-1 space-y-5 px-4 py-6 md:px-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.6px] text-ink">
            Communications
          </h1>
          <p className="mt-1 text-[13px] text-ink-subtle">
            Channel traffic between citizens, responders and command.
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-1 p-4 md:p-5">
          <TacticalCommsView />
        </div>
      </div>
    </main>
  );
}
