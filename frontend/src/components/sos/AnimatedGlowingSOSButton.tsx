'use client';

import React, { useState } from 'react';
import { RadioTower, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';

interface AnimatedGlowingSOSButtonProps {
  size?: 'normal' | 'large' | 'compact';
  onTrigger?: () => void;
}

export const AnimatedGlowingSOSButton: React.FC<AnimatedGlowingSOSButtonProps> = ({
  size = 'large',
  onTrigger,
}) => {
  const { triggerSOS, isOfflineMode } = useEmergency();
  const { playBeep, playSiren, speakAlert } = useAudioSiren();
  const [isPressing, setIsPressing] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isTriggered, setIsTriggered] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };

    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1200);

    setIsPressing(true);
    playBeep(1280, 'sawtooth');
    playSiren(6);

    const result = await triggerSOS({
      userName: 'Citizen SOS (Reactor Trigger)',
      emergencyType: 'trapped',
      urgency: 'critical',
      peopleCount: 1,
      location: { lat: 28.6185, lng: 77.2115, accuracy: 3, altitude: 10 },
      notes: 'Activated via 3D Animated Glowing SOS Reactor.'
    });

    setIsPressing(false);

    if (result.success) {
      setIsTriggered(true);
      speakAlert('Emergency Beacon Activated. Rescue Units Dispatched.');
      if (onTrigger) onTrigger();
      setTimeout(() => setIsTriggered(false), 5000);
    }
  };

  const isLarge = size === 'large';
  const isCompact = size === 'compact';

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Expanding Multi-Ring Energy Pulse Waves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`rounded-full border-2 border-red-500/60 sos-ring-1 ${isLarge ? 'w-56 h-56' : isCompact ? 'w-24 h-24' : 'w-40 h-40'}`} />
        <div className={`rounded-full border border-red-400/50 sos-ring-2 ${isLarge ? 'w-56 h-56' : isCompact ? 'w-24 h-24' : 'w-40 h-40'}`} />
        <div className={`rounded-full border border-tactical-accent/40 sos-ring-3 ${isLarge ? 'w-56 h-56' : isCompact ? 'w-24 h-24' : 'w-40 h-40'}`} />
      </div>

      {/* Rotating Cyber Reticle Brackets */}
      {isLarge && (
        <div className="absolute w-72 h-72 rounded-full border border-dashed border-red-500/30 cyber-spin-slow pointer-events-none flex items-center justify-between p-2">
          <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#ff003c]" />
          <div className="w-2 h-2 rounded-full bg-tactical-accent shadow-[0_0_8px_#00f0ff]" />
          <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#ff003c]" />
          <div className="w-2 h-2 rounded-full bg-tactical-accent shadow-[0_0_8px_#00f0ff]" />
        </div>
      )}

      {isLarge && (
        <div className="absolute w-64 h-64 rounded-full border border-cyan-400/20 cyber-spin-reverse pointer-events-none" />
      )}

      {/* 3D Glowing SOS Button Core */}
      <motion.button
        whileHover={{ scale: 1.06, rotate: 0.5 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        className={`relative z-10 rounded-full font-mono font-black text-white cursor-pointer overflow-hidden sos-glow-button transition-all ${
          isLarge
            ? 'w-48 h-48 p-2 border-4 border-red-300'
            : isCompact
            ? 'w-20 h-20 p-1 border-2 border-red-400'
            : 'w-36 h-36 p-1.5 border-3 border-red-300'
        } bg-gradient-to-tr from-red-800 via-rose-600 to-red-500 shadow-[0_0_50px_rgba(255,0,60,0.85),inset_0_0_30px_rgba(255,255,255,0.4)]`}
      >
        {/* Inner Glass Core Layer */}
        <div className="w-full h-full rounded-full bg-gradient-to-b from-red-950/80 to-black/80 border border-red-400/80 flex flex-col items-center justify-center p-2 backdrop-blur-md relative overflow-hidden">
          {/* Dynamic Laser Shockwave Ripples */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full bg-white/40 pointer-events-none animate-ping"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20,
                width: 40,
                height: 40,
              }}
            />
          ))}

          <RadioTower
            className={`${
              isLarge ? 'w-10 h-10' : isCompact ? 'w-5 h-5' : 'w-8 h-8'
            } text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)] animate-bounce`}
          />

          <span
            className={`${
              isLarge ? 'text-2xl tracking-widest mt-1' : isCompact ? 'text-xs' : 'text-lg tracking-wider'
            } font-black text-white neon-text-red`}
          >
            {isTriggered ? 'SENT!' : 'SOS'}
          </span>

          {isLarge && (
            <span className="text-[9px] font-bold text-red-200 tracking-wider uppercase mt-0.5">
              EMERGENCY BROADCAST
            </span>
          )}
        </div>
      </motion.button>

      {/* Status Tooltip / Trigger Confirmation */}
      <AnimatePresence>
        {isTriggered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute -bottom-12 z-20 px-3 py-1.5 rounded-xl bg-red-950/90 border border-red-500 text-red-300 font-mono text-[11px] font-bold neon-glow-red flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>BEACON ACTIVE & RESCUE DISPATCHED</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
