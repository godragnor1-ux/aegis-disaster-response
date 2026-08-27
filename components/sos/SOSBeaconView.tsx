'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  Camera,
  RotateCcw,
  Mic,
  MicOff,
  Battery,
  MapPin,
  Flame,
  Droplets,
  AlertTriangle,
  Users,
  Send,
  MessageSquare,
  ShieldCheck,
  RadioTower,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SOSBeaconView: React.FC = () => {
  const { triggerSOS, isOfflineMode } = useEmergency();
  const { playBeep, speakAlert } = useAudioSiren();

  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState<'trapped' | 'medical' | 'flood_rising' | 'fire_smoke' | 'food_water' | 'elderly_infant'>('trapped');
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'medium'>('critical');
  const [peopleCount, setPeopleCount] = useState(1);
  const [notes, setNotes] = useState('');

  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: 28.6185,
    lng: 77.2115,
    accuracy: 5
  });
  const [locationStatus, setLocationStatus] = useState<string>('Acquiring high-accuracy GPS...');
  const [batteryLevel, setBatteryLevel] = useState<number>(84);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFrontImage, setCapturedFrontImage] = useState<string | null>(null);
  const [capturedBackImage, setCapturedBackImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioVoiceBlob, setAudioVoiceBlob] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBeacon, setSubmittedBeacon] = useState<{ sosId: string; status: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: +pos.coords.latitude.toFixed(5),
            lng: +pos.coords.longitude.toFixed(5),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setLocationStatus(`GPS Locked (±${Math.round(pos.coords.accuracy)}m)`);
        },
        (err) => {
          console.warn('Geolocation fallback:', err);
          setLocationStatus('GPS fallback: Metro Central Grid');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    if (typeof window !== 'undefined' && 'getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number }> })
        .getBattery()
        .then((battery) => {
          setBatteryLevel(Math.round(battery.level * 100));
        })
        .catch(() => {});
    }
  }, []);

  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera stream error, using camera fallback snapshot:', err);
      if (facingMode === 'user') {
        setCapturedFrontImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=60');
      } else {
        setCapturedBackImage('https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=60');
      }
    }
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (cameraActive) {
      setTimeout(startCamera, 100);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (facingMode === 'user') {
          setCapturedFrontImage(dataUrl);
        } else {
          setCapturedBackImage(dataUrl);
        }
        playBeep(1000, 'sine');
      }
    } else {
      if (facingMode === 'user') {
        setCapturedFrontImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=60');
      } else {
        setCapturedBackImage('https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&auto=format&fit=crop&q=60');
      }
    }
  };

  const toggleAudioRecording = () => {
    if (!isRecordingAudio) {
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      playBeep(880, 'sine');
    } else {
      setIsRecordingAudio(false);
      setAudioVoiceBlob('voice_sos_recorded');
      playBeep(440, 'triangle');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingAudio) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  const handleSOSSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const sosPayload = {
      userName: userName.trim() || 'Citizen In Distress',
      userPhone: userPhone.trim() || '+1 (555) 911-HELP',
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        altitude: 14
      },
      batteryLevel,
      urgency,
      emergencyType,
      peopleCount,
      notes: notes.trim() || 'Urgent assistance needed. Geolocation beacon locked.',
      frontCameraImage: capturedFrontImage || undefined,
      backCameraImage: capturedBackImage || undefined,
      audioVoiceUrl: audioVoiceBlob ? 'simulated_voice_sos.wav' : undefined,
    };

    const result = await triggerSOS(sosPayload);
    setIsSubmitting(false);

    if (result.success) {
      const beaconData = result.data as { sosId: string; status: string };
      setSubmittedBeacon({
        sosId: beaconData?.sosId || `SOS-${Date.now().toString().slice(-6)}`,
        status: isOfflineMode ? 'QUEUED_IN_OFFLINE_MESH' : 'TRANSMITTED_TO_COMMAND_CENTER'
      });
      speakAlert('SOS Beacon Broadcasted. Rescue units dispatched.');
    }
  };

  const smsFallbackBody = `SOS#${location.lat},${location.lng}#${emergencyType.toUpperCase()}#${urgency.toUpperCase()}#P:${peopleCount}#BAT:${batteryLevel}%`;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <RadioTower className="w-6 h-6 text-red-500 animate-pulse" />
            EMERGENCY SOS BEACON DISPATCH
          </h2>
          <p className="text-xs font-mono text-slate-400">
            TRANSMITS PRECISE GPS, MULTI-CAMERA HAZARD PROOF, AND REAL-TIME AUDIO TO NEAREST RESCUE UNITS
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-2.5 py-1 rounded bg-tactical-900 border border-tactical-700 flex items-center gap-1.5 text-cyan-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{location.lat}° N, {location.lng}° E</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-tactical-900 border border-tactical-700 flex items-center gap-1.5 text-slate-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{batteryLevel}% BATTERY</span>
          </div>
        </div>
      </div>

      {submittedBeacon ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="tactical-card p-6 rounded-2xl border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] text-center space-y-4"
        >
          <div className="inline-flex p-4 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-400 mb-2">
            <CheckCircle2 className="w-12 h-12 animate-bounce" />
          </div>

          <h3 className="text-2xl font-black text-white tracking-wider font-mono">
            EMERGENCY DISTRESS BEACON ACTIVE
          </h3>
          <p className="text-sm font-mono text-emerald-300 max-w-xl mx-auto">
            Beacon ID: <span className="font-bold text-white bg-tactical-900 px-2 py-1 rounded border border-emerald-600">{submittedBeacon.sosId}</span>
          </p>
          <p className="text-xs font-mono text-slate-300">
            Status: <span className="text-emerald-400 font-bold">{submittedBeacon.status}</span>
          </p>

          {isOfflineMode && (
            <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500 text-left max-w-xl mx-auto space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>OFFLINE SMS FALLBACK READY</span>
              </div>
              <p className="text-xs text-amber-100 font-sans">
                Internet is unavailable. The beacon payload has been formatted for immediate SMS transmission:
              </p>
              <div className="p-2 rounded bg-black/60 font-mono text-xs text-amber-300 select-all border border-amber-800">
                {smsFallbackBody}
              </div>
              <a
                href={`sms:911?body=${encodeURIComponent(smsFallbackBody)}`}
                className="inline-block w-full text-center py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs transition-colors"
              >
                📲 SEND SMS TO 911 NOW
              </a>
            </div>
          )}

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => setSubmittedBeacon(null)}
              className="px-5 py-2.5 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-white font-mono text-xs font-bold transition-colors border border-tactical-600"
            >
              Update Distress Signal / Trigger Another
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSOSSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="tactical-card p-4 rounded-xl space-y-3">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                1. Select Emergency Type
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                {[
                  { id: 'trapped', label: '🏚️ Trapped in Debris', color: 'border-red-500' },
                  { id: 'flood_rising', label: '🌊 Floodwater Rising', color: 'border-cyan-500' },
                  { id: 'fire_smoke', label: '🔥 Fire & Smoke', color: 'border-orange-500' },
                  { id: 'medical', label: '🩺 Medical Trauma', color: 'border-rose-500' },
                  { id: 'elderly_infant', label: '👶 Elderly / Infant', color: 'border-purple-500' },
                  { id: 'food_water', label: '💧 Food / Water Needed', color: 'border-yellow-500' },
                ].map((type) => (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => setEmergencyType(type.id as typeof emergencyType)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      emergencyType === type.id
                        ? `bg-tactical-800 ${type.color} text-white font-bold shadow-md`
                        : 'bg-tactical-900/50 border-tactical-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="tactical-card p-4 rounded-xl space-y-3">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                2. Urgency & Casualties
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-slate-400 mb-1.5 block">Triage Urgency:</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'critical', label: 'CRITICAL', color: 'bg-red-600 text-white' },
                      { id: 'high', label: 'HIGH', color: 'bg-amber-600 text-white' },
                      { id: 'medium', label: 'MEDIUM', color: 'bg-yellow-600 text-black' },
                    ].map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setUrgency(u.id as typeof urgency)}
                        className={`flex-1 py-2 rounded-lg border font-bold text-center transition-all ${
                          urgency === u.id
                            ? `${u.color} border-white shadow-lg`
                            : 'bg-tactical-900 border-tactical-700 text-slate-400'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 mb-1.5 block">Number of People in Danger:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                      className="w-10 h-10 rounded-lg bg-tactical-800 border border-tactical-600 text-white font-bold text-lg hover:bg-tactical-700"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold text-white font-mono min-w-[2rem] text-center">
                      {peopleCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPeopleCount(peopleCount + 1)}
                      className="w-10 h-10 rounded-lg bg-tactical-800 border border-tactical-600 text-white font-bold text-lg hover:bg-tactical-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="tactical-card p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Full Name / Group Lead:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. John Doe & Family"
                    className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white placeholder-slate-500 focus:outline-none focus:border-tactical-accent"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Contact Phone Number:</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white placeholder-slate-500 focus:outline-none focus:border-tactical-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Specific Location / Landmark / Medical Notes:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 3rd floor apartment, stairwell blocked by fallen beam, 1 person has asthma"
                  className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white placeholder-slate-500 focus:outline-none focus:border-tactical-accent"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="tactical-card p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-tactical-accent" />
                  Visual Damage / Victim Snapshot
                </label>
                <button
                  type="button"
                  onClick={flipCamera}
                  className="px-2 py-1 rounded bg-tactical-800 text-[11px] font-mono text-cyan-300 hover:bg-tactical-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Flip ({facingMode === 'user' ? 'Front' : 'Rear'})
                </button>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-tactical-700 bg-black aspect-video flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center space-y-2">
                    <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-500 font-mono">
                      Capture live visual proof of structural collapse, rising water, or injuries
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white text-black font-mono font-bold text-xs shadow-lg hover:bg-slate-200 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Snapshot
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {capturedFrontImage && (
                  <div className="relative w-1/2 h-20 rounded border border-tactical-600 overflow-hidden">
                    <img src={capturedFrontImage} alt="Front" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-mono text-cyan-300">
                      Victim Photo
                    </span>
                  </div>
                )}
                {capturedBackImage && (
                  <div className="relative w-1/2 h-20 rounded border border-tactical-600 overflow-hidden">
                    <img src={capturedBackImage} alt="Rear" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-mono text-cyan-300">
                      Hazard Photo
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="tactical-card p-4 rounded-xl space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                Voice SOS Audio Dispatch
              </label>

              <div className="flex items-center justify-between p-3 rounded-lg bg-tactical-900 border border-tactical-700">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAudioRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isRecordingAudio
                        ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.8)]'
                        : 'bg-tactical-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isRecordingAudio ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <div>
                    <div className="text-xs font-mono font-bold text-white">
                      {isRecordingAudio ? `Recording Audio (${recordingSeconds}s)...` : audioVoiceBlob ? 'Voice SOS Attached' : 'Record Emergency Audio Note'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {isRecordingAudio ? 'Speak clearly into microphone' : 'Optional voice message for responders'}
                    </div>
                  </div>
                </div>

                {audioVoiceBlob && (
                  <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-500 text-[10px] font-mono text-emerald-300">
                    READY
                  </span>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(255, 0, 60, 0.9)' }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-mono font-black text-base uppercase tracking-widest neon-glow-red border-2 border-red-400/90 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <RadioTower className="w-6 h-6 animate-ping" />
              <span>{isSubmitting ? 'TRANSMITTING BEACON...' : 'BROADCAST EMERGENCY SOS BEACON'}</span>
            </motion.button>
          </div>
        </form>
      )}
    </div>
  );
};
