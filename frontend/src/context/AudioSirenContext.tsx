'use client';

import React, { createContext, useContext, useState, useRef } from 'react';

interface AudioSirenContextType {
  isMuted: boolean;
  isPlayingSiren: boolean;
  toggleMute: () => void;
  playSiren: (durationSec?: number) => void;
  stopSiren: () => void;
  playBeep: (freq?: number, type?: OscillatorType) => void;
  speakAlert: (text: string) => void;
}

const AudioSirenContext = createContext<AudioSirenContextType>({
  isMuted: false,
  isPlayingSiren: false,
  toggleMute: () => {},
  playSiren: () => {},
  stopSiren: () => {},
  playBeep: () => {},
  speakAlert: () => {},
});

export const AudioSirenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playBeep = (freq = 880, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio Beep Error:', e);
    }
  };

  const playSiren = (durationSec = 8) => {
    if (isMuted) return;
    try {
      stopSiren();
      const ctx = getAudioContext();
      if (!ctx) return;

      setIsPlayingSiren(true);

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const masterGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);

      lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(osc.frequency);

      masterGain.gain.setValueAtTime(0.2, ctx.currentTime);

      osc.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start();
      lfo.start();

      oscillatorRef.current = osc;
      lfoRef.current = lfo;

      setTimeout(() => {
        stopSiren();
      }, durationSec * 1000);
    } catch (e) {
      console.warn('Audio Siren Error:', e);
    }
  };

  const stopSiren = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      setIsPlayingSiren(false);
    } catch (e) {
      // ignore
    }
  };

  const speakAlert = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const toggleMute = () => {
    if (!isMuted && isPlayingSiren) {
      stopSiren();
    }
    setIsMuted(!isMuted);
  };

  return (
    <AudioSirenContext.Provider
      value={{
        isMuted,
        isPlayingSiren,
        toggleMute,
        playSiren,
        stopSiren,
        playBeep,
        speakAlert
      }}
    >
      {children}
    </AudioSirenContext.Provider>
  );
};

export const useAudioSiren = () => useContext(AudioSirenContext);
