import type { Metadata } from 'next';
import './globals.css';
import { SocketProvider } from '@/context/SocketContext';
import { AudioSirenProvider } from '@/context/AudioSirenContext';
import { EmergencyProvider } from '@/context/EmergencyContext';
import { OfflineStatusBanner } from '@/components/common/OfflineStatusBanner';

export const metadata: Metadata = {
  title: 'AEGIS-PULSE | Real-Time Tactical Disaster Response Platform',
  description: 'Mission-critical real-time disaster management, dynamic rescue routing, AI damage detection, offline mesh relay, and emergency coordination platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-tactical-950 text-slate-100 min-h-screen selection:bg-tactical-accent selection:text-black">
        <AudioSirenProvider>
          <SocketProvider>
            <EmergencyProvider>
              <div className="relative min-h-screen flex flex-col">
                <OfflineStatusBanner />
                <div className="fixed inset-0 scanlines opacity-30 z-40 pointer-events-none" />
                {children}
              </div>
            </EmergencyProvider>
          </SocketProvider>
        </AudioSirenProvider>
      </body>
    </html>
  );
}
