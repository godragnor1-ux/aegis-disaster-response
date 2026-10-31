import type { Metadata } from 'next';
import './globals.css';
import { SocketProvider } from '@/context/SocketContext';
import { AudioSirenProvider } from '@/context/AudioSirenContext';
import { EmergencyProvider } from '@/context/EmergencyContext';

export const metadata: Metadata = {
  title: 'Aegis Pulse — Disaster Response',
  description:
    'Real-time disaster response coordination: hazard mapping, SOS triage, responder dispatch and safe-route navigation.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#010102',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <AudioSirenProvider>
          <SocketProvider>
            <EmergencyProvider>
              <div className="relative flex min-h-screen flex-col">{children}</div>
            </EmergencyProvider>
          </SocketProvider>
        </AudioSirenProvider>
      </body>
    </html>
  );
}
