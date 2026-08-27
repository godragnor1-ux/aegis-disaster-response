'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useSocket } from '@/context/SocketContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  MessageSquare,
  Radio,
  Send,
  ShieldAlert,
  BellRing,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertTriangle,
  Zap,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ChatMessage } from '@/types';

export const TacticalCommsView: React.FC = () => {
  const { chatMessages, fetchInitialData } = useEmergency();
  const { socket, activeChannel, joinChannel } = useSocket();
  const { playSiren, playBeep, speakAlert } = useAudioSiren();

  const [inputMessage, setInputMessage] = useState('');
  const [senderName, setSenderName] = useState('First-Responder Alpha');
  const [senderRole, setSenderRole] = useState<'citizen' | 'responder' | 'commander'>('responder');

  // Broadcast Alert State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLevel, setBroadcastLevel] = useState<'CODE_RED' | 'DEFCON_1' | 'EVACUATION'>('CODE_RED');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Walkie-Talkie & Voice SOS State
  const [radioFrequency, setRadioFrequency] = useState<'145.500' | '433.920' | '446.006'>('145.500');
  const [isPTTHolding, setIsPTTHolding] = useState(false);
  const [isRecordingVoiceSOS, setIsRecordingVoiceSOS] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Audio squelch chirp synthesizer (Push-to-Talk release click)
  const playSquelchChirp = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Ignore if audioContext not unlocked yet
    }
  };

  // Start Voice Recording (PTT or Voice SOS)
  const startRecording = async (mode: 'ptt' | 'sos') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (mode === 'ptt') {
            sendPTTVoiceBurst(base64Audio, recordingDuration);
          } else {
            sendVoiceSOS(base64Audio, recordingDuration);
          }
        };
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);

      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (mode === 'ptt') {
        setIsPTTHolding(true);
        playBeep(950, 'sine');
      } else {
        setIsRecordingVoiceSOS(true);
        playBeep(1200, 'triangle');
      }
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      // Fallback simulated voice burst if mic is blocked in test environment
      if (mode === 'ptt') {
        setIsPTTHolding(true);
        setRecordingDuration(2);
      } else {
        setIsRecordingVoiceSOS(true);
        setRecordingDuration(3);
      }
    }
  };

  // Stop Recording
  const stopRecording = (mode: 'ptt' | 'sos') => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulation transmission
      if (mode === 'ptt') {
        sendPTTVoiceBurst('', recordingDuration || 2);
      } else {
        sendVoiceSOS('', recordingDuration || 3);
      }
    }

    if (mode === 'ptt') {
      setIsPTTHolding(false);
      playSquelchChirp();
    } else {
      setIsRecordingVoiceSOS(false);
      playBeep(880, 'sine');
    }
  };

  // Transmit PTT Voice Burst via Socket.IO
  const sendPTTVoiceBurst = (audioBase64: string, duration: number) => {
    if (!socket) return;
    socket.emit('radio:voice_burst', {
      callsign: senderName,
      role: senderRole,
      frequencyMHz: radioFrequency,
      audioBase64,
      audioDurationSeconds: duration || 2,
      transcript: `🎙️ Voice transmission on ${radioFrequency} MHz [${duration || 2}s]`
    });
  };

  // Transmit Voice SOS Distress via Socket.IO
  const sendVoiceSOS = (audioBase64: string, duration: number) => {
    if (!socket) return;
    socket.emit('voice_sos:send', {
      senderName,
      audioBase64,
      audioDurationSeconds: duration || 3,
      transcription: `🚨 CRITICAL VOICE SOS RECORDED (${duration || 3}s audio packet)`
    });
    speakAlert('Voice SOS emergency broadcast transmitted.');
  };

  // Play Recorded Voice Message
  const playAudio = (msgId: string, base64: string) => {
    if (!base64) return;
    try {
      const audio = new Audio(base64);
      setPlayingAudioId(msgId);
      audio.play();
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => setPlayingAudioId(null);
    } catch {
      setPlayingAudioId(null);
    }
  };

  // Send Text Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('chat:send_message', {
      channel: activeChannel,
      senderName,
      senderRole,
      message: inputMessage.trim(),
      isEmergencyAlert: false,
      priority: 'normal'
    });

    setInputMessage('');
  };

  // Trigger Admin Broadcast Alert
  const handleTriggerBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim() || !socket) return;

    socket.emit('alert:trigger_broadcast', {
      sender: senderName,
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      threatLevel: broadcastLevel,
    });

    playSiren();
    speakAlert(`CIVIL DEFENSE FLASH DIRECTIVE: ${broadcastTitle.trim()}`);

    setBroadcastTitle('');
    setBroadcastMessage('');
    setIsBroadcasting(false);
  };

  const channelMessages = chatMessages.filter(
    (m) =>
      m.channel === activeChannel ||
      m.priority === 'flash_override' ||
      (activeChannel === 'walkie_talkie' && m.channel === 'walkie_talkie') ||
      (activeChannel === 'voice_sos' && m.channel === 'voice_sos')
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 font-mono">
      {/* Header & Global Broadcast Modal Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-6 h-6 text-tactical-accent animate-pulse" />
            TACTICAL COMMUNICATIONS & EMERGENCY BROADCAST SYSTEM
          </h2>
          <p className="text-xs text-slate-400">
            LOW-BANDWIDTH CHAT (16-BIT OPUS), PTT WALKIE-TALKIE & CIVIL DEFENSE SIREN BROADCASTING
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBroadcasting(!isBroadcasting)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,60,0.5)] border border-red-400 transition-all"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>CIVIL DEFENSE BROADCAST</span>
          </button>
        </div>
      </div>

      {/* Admin Civil Defense Broadcast Composer */}
      {isBroadcasting && (
        <form onSubmit={handleTriggerBroadcast} className="tactical-card-alert p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-red-500 pb-2">
            <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-spin" />
              <span>GLOBAL HIGH-PRIORITY CIVIL DEFENSE SIREN TRANSMISSION (ADMIN OVERRIDE)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBroadcasting(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-black/40 rounded"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2">
              <input
                type="text"
                required
                placeholder="Alert Title (e.g. FLASH FLOOD BARRIER BREACH - EVACUATE SECTOR 4)"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-red-500 text-white placeholder-red-300/50 focus:outline-none"
              />
            </div>
            <div>
              <select
                value={broadcastLevel}
                onChange={(e) => setBroadcastLevel(e.target.value as typeof broadcastLevel)}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-red-500 text-red-300 font-bold focus:outline-none"
              >
                <option value="CODE_RED">DEFCON 1 (Immediate Evacuation)</option>
                <option value="DEFCON_1">Severe Storm & Cyclone Inundation</option>
                <option value="EVACUATION">Toxic Gas Plume Hazard</option>
              </select>
            </div>
          </div>

          <textarea
            rows={2}
            required
            placeholder="Full Emergency Directive to be broadcasted with loud Siren and Text-to-Speech audio across all connected terminals..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/60 border border-red-500 text-white placeholder-red-300/50 text-xs focus:outline-none"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.8)] flex items-center justify-center gap-2"
          >
            <BellRing className="w-4 h-4" />
            <span>🚨 TRANSMIT LIVE SIREN ALERT TO ALL ACTIVE USERS</span>
          </button>
        </form>
      )}

      {/* Main Grid: Channels & Transmission Controls | Chat Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Radio Frequencies, Walkie-Talkie PTT & Voice SOS */}
        <div className="lg:col-span-5 space-y-4">
          {/* Channel Selector */}
          <div className="tactical-card p-4 rounded-xl space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase flex items-center gap-1.5 border-b border-tactical-700 pb-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              1. Radio Net Channels
            </h3>

            <div className="space-y-1.5">
              {[
                { id: 'citizen_public', label: '📢 Public Emergency Net', desc: 'Citizen distress & shelter status' },
                { id: 'responder_tactical', label: '🚁 Responder Tactical Net', desc: 'Boat teams, USAR & Medics' },
                { id: 'command_ops', label: '🛡️ Command HQ Ops Net', desc: 'Civil defense directives & commanders' },
                { id: 'walkie_talkie', label: '📻 Walkie-Talkie PTT Net', desc: 'Direct Push-to-Talk frequency burst' },
                { id: 'voice_sos', label: '🚨 Voice SOS Audio Stream', desc: 'Live recorded voice distress calls' },
              ].map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => joinChannel(chan.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                    activeChannel === chan.id
                      ? 'bg-tactical-800 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-tactical-900/60 border-tactical-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs text-white flex items-center justify-between">
                    <span>{chan.label}</span>
                    {activeChannel === chan.id && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{chan.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Walkie-Talkie Mode (PTT) Panel */}
          <div className="tactical-card p-4 rounded-xl space-y-3 text-xs border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
              <h3 className="font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                2. Walkie-Talkie (PTT)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold">
                {radioFrequency} MHz
              </span>
            </div>

            {/* Frequency Selector */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">RADIO FREQUENCY CHANNEL:</label>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {[
                  { freq: '145.500', name: 'VHF CMD' },
                  { freq: '433.920', name: 'UHF USAR' },
                  { freq: '446.006', name: 'PMR CIV' },
                ].map((f) => (
                  <button
                    key={f.freq}
                    onClick={() => setRadioFrequency(f.freq as typeof radioFrequency)}
                    className={`py-1 rounded border text-center font-bold transition-all ${
                      radioFrequency === f.freq
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                        : 'bg-tactical-900 border-tactical-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Push-to-Talk (PTT) Big Reactor Button */}
            <div className="pt-1">
              <button
                onMouseDown={() => startRecording('ptt')}
                onMouseUp={() => stopRecording('ptt')}
                onTouchStart={() => startRecording('ptt')}
                onTouchEnd={() => stopRecording('ptt')}
                className={`w-full py-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 transition-all select-none border ${
                  isPTTHolding
                    ? 'bg-red-600 text-white border-red-300 shadow-[0_0_30px_#ff003c] scale-98 animate-pulse'
                    : 'bg-gradient-to-br from-tactical-800 to-cyan-950 hover:from-tactical-700 hover:to-cyan-900 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-95'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mic className={`w-5 h-5 ${isPTTHolding ? 'animate-bounce text-white' : 'text-cyan-400'}`} />
                  <span>{isPTTHolding ? `TRANSMITTING (${recordingDuration}s)...` : 'HOLD TO TALK (PTT)'}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-300">
                  {isPTTHolding ? 'Release to Unkey & Squelch' : 'Press & Hold to Broadcast Voice Burst'}
                </span>
              </button>
            </div>
          </div>

          {/* Voice SOS One-Tap Recording Box */}
          <div className="tactical-card p-4 rounded-xl space-y-3 text-xs border border-red-500/40">
            <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
              <h3 className="font-bold text-red-400 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                3. Voice SOS Distress Beacon
              </h3>
              <span className="text-[10px] text-slate-400">16-BIT OPUS COMPRESSED</span>
            </div>

            <button
              onClick={() => {
                if (isRecordingVoiceSOS) {
                  stopRecording('sos');
                } else {
                  startRecording('sos');
                }
              }}
              className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                isRecordingVoiceSOS
                  ? 'bg-red-600 text-white border-white animate-pulse shadow-[0_0_25px_#ff003c]'
                  : 'bg-red-950/70 hover:bg-red-900 text-red-300 border-red-500/60'
              }`}
            >
              <Mic className="w-4 h-4 text-red-400" />
              <span>
                {isRecordingVoiceSOS ? `RECORDING VOICE SOS (${recordingDuration}s) - TAP TO SEND` : '🎙️ RECORD VOICE SOS BEACON'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Chat Message Feed & Transmitter */}
        <div className="lg:col-span-7 space-y-3">
          <div className="tactical-card p-4 rounded-2xl h-[580px] flex flex-col justify-between border border-tactical-700/80 shadow-2xl">
            {/* Active Channel Telemetry Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-tactical-700/80 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-white font-bold uppercase">{activeChannel.replace('_', ' ')} NET</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-cyan-400" />
                  <span>LOW-BANDWIDTH MODE</span>
                </span>
                <span>{channelMessages.length} Messages</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 my-3">
              {channelMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                  <Radio className="w-8 h-8 text-slate-600" />
                  <p>Channel open. No active transmissions on this frequency.</p>
                </div>
              ) : (
                channelMessages.map((msg, idx) => {
                  const isAlert = msg.isEmergencyAlert || msg.priority === 'flash_override';
                  const isRadioBurst = msg.channel === 'walkie_talkie' || msg.channel === 'voice_sos';
                  const isPlaying = playingAudioId === msg._id;

                  return (
                    <div
                      key={msg._id || idx}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isAlert
                          ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_15px_rgba(255,0,0,0.3)]'
                          : msg.senderRole === 'responder' || msg.senderRole === 'commander'
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-slate-200'
                          : 'bg-tactical-900/80 border-tactical-700 text-slate-200'
                      }`}
                    >
                      {/* Message Metadata Header */}
                      <div className="flex items-center justify-between mb-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-cyan-300">{msg.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-tactical-800 text-slate-400 uppercase font-bold text-[9px]">
                            {msg.senderRole}
                          </span>
                          {msg.frequencyMHz && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-600 text-[9px]">
                              {msg.frequencyMHz} MHz
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          {msg.payloadSizeBytes && (
                            <span>{msg.payloadSizeBytes} B</span>
                          )}
                          <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Text Content */}
                      <p className="text-xs leading-relaxed font-sans">{msg.message}</p>

                      {/* Audio Playback Player if Voice Attached */}
                      {msg.audioBase64 && (
                        <div className="mt-2 p-2 rounded-lg bg-black/60 border border-tactical-700 flex items-center justify-between">
                          <button
                            onClick={() => playAudio(msg._id, msg.audioBase64!)}
                            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isPlaying ? 'PLAYING...' : `PLAY AUDIO (${msg.audioDurationSeconds || 3}s)`}</span>
                          </button>
                          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            <span>16kbps OPUS</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-tactical-700/60">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Transmitting on ${activeChannel.toUpperCase()}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-tactical-900 border border-tactical-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_12px_#00f0ff]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
