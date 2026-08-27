'use client';

import React from 'react';
import { Header } from '@components/common/Header';
import { EmergencyBroadcastBanner } from '@components/common/EmergencyBroadcastBanner';
import { FuturisticNavbar } from '@components/common/FuturisticNavbar';
import { MissingPersonsView } from '@components/missing/MissingPersonsView';
import {
  Search,
  Heart,
  UserCheck,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function MissingPersonsPage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen hologram-grid relative">
      <Header />
      <EmergencyBroadcastBanner />
      <FuturisticNavbar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        <div className="glass-panel p-4 md:p-6 rounded-2xl border-rose-500/30 shadow-2xl">
          <MissingPersonsView />
        </div>
      </div>
    </main>
  );
}
