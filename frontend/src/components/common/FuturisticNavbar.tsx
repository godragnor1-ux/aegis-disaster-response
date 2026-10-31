'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAudioSiren } from '@/context/AudioSirenContext';

/**
 * Primary section nav. Linear geometry: 8px radius, hairline rule, and the
 * active state is ink plus a 1px accent underline — not a glowing pill.
 */
const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/map', label: 'Live Map' },
  { href: '/rescue', label: 'Rescue' },
  { href: '/navigation', label: 'Safe Routes' },
  { href: '/missing', label: 'Missing Persons' },
  { href: '/communication', label: 'Comms' },
];

export const FuturisticNavbar: React.FC = () => {
  const pathname = usePathname();
  const { playBeep } = useAudioSiren();

  return (
    <nav className="sticky top-14 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      {/* mask fades the right edge so it is obvious the tab strip scrolls on narrow screens */}
      <div
        className="mx-auto flex h-11 max-w-[1400px] items-center overflow-x-auto px-2 md:px-5"
        style={{
          maskImage: 'linear-gradient(to right, #000 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, #000 90%, transparent 100%)',
        }}
      >
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => playBeep(720, 'sine')}
              className={`relative flex h-11 shrink-0 items-center px-3 text-[13px] transition-colors ${
 active ? 'text-ink' : 'text-ink-subtle hover:text-ink-muted'
 }`}
            >
              {item.label}
              {active && <span className="absolute inset-x-2 bottom-0 h-px bg-brand" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
