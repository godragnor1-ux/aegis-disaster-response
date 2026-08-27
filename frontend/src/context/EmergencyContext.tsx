'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAudioSiren } from './AudioSirenContext';
import {
  Incident,
  SOSBeacon,
  Responder,
  Shelter,
  MissingPerson,
  ChatMessage
} from '@/types';
import { enqueueOfflineRequest } from '@utils/offlineQueue';
import { getApiUrl } from '../utils/apiConfig';

interface EmergencyContextType {
  incidents: Incident[];
  sosBeacons: SOSBeacon[];
  responders: Responder[];
  shelters: Shelter[];
  missingPersons: MissingPerson[];
  chatMessages: ChatMessage[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  latestBroadcast: {
    title: string;
    message: string;
    level: string;
    timestamp: string;
  } | null;
  triggerSOS: (sosData: Partial<SOSBeacon>) => Promise<{ success: boolean; data?: unknown }>;
  fetchInitialData: () => Promise<void>;
  dismissBroadcast: () => void;
}

const EmergencyContext = createContext<EmergencyContextType>({
  incidents: [],
  sosBeacons: [],
  responders: [],
  shelters: [],
  missingPersons: [],
  chatMessages: [],
  activeTab: 'map',
  setActiveTab: () => {},
  isOfflineMode: false,
  setIsOfflineMode: () => {},
  latestBroadcast: null,
  triggerSOS: async () => ({ success: false }),
  fetchInitialData: async () => {},
  dismissBroadcast: () => {}
});

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { playSiren, playBeep, speakAlert } = useAudioSiren();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sosBeacons, setSosBeacons] = useState<SOSBeacon[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('map');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [latestBroadcast, setLatestBroadcast] = useState<{
    title: string;
    message: string;
    level: string;
    timestamp: string;
  } | null>(null);

  const serverUrl = getApiUrl();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // High-performance batched initial load
  const fetchInitialData = useCallback(async () => {
    try {
      const [incRes, sosRes, respRes, sheltRes, missRes, chatRes] = await Promise.all([
        fetch(`${serverUrl}/api/incidents`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${serverUrl}/api/sos`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${serverUrl}/api/responders`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${serverUrl}/api/shelters`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${serverUrl}/api/missing`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${serverUrl}/api/chat`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (incRes.success) setIncidents(incRes.incidents);
      if (sosRes.success) setSosBeacons(sosRes.beacons);
      if (respRes.success) setResponders(respRes.responders);
      if (sheltRes.success) setShelters(sheltRes.shelters);
      if (missRes.success) setMissingPersons(missRes.list);
      if (chatRes.success) setChatMessages(chatRes.messages);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  }, [serverUrl]);

  // Debounced fetch to prevent excessive API calls
  const debouncedFetchInitialData = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchInitialData();
    }, 350);
  }, [fetchInitialData]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!socket) return;

    socket.on('sos:new_distress', (newBeacon: SOSBeacon) => {
      setSosBeacons((prev) => [newBeacon, ...prev.filter((b) => b._id !== newBeacon._id)]);
      playBeep(920, 'triangle');
      speakAlert(`Emergency Beacon Triggered in Sector: ${newBeacon.emergencyType}`);
    });

    socket.on('sos:updated', (updated: SOSBeacon) => {
      setSosBeacons((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
    });

    socket.on('dispatch:assigned', (dispatchData: { responder: Responder; sosId: string }) => {
      setResponders((prev) =>
        prev.map((r) => (r._id === dispatchData.responder._id ? dispatchData.responder : r))
      );
      playBeep(1200, 'sine');
    });

    socket.on('responder:position_update', (data: { responderId: string; location: { lat: number; lng: number }; status: Responder['status'] }) => {
      setResponders((prev) =>
        prev.map((r) =>
          r._id === data.responderId
            ? { ...r, location: data.location, status: data.status || r.status }
            : r
        )
      );
    });

    socket.on('chat:new_message', (msg: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      playBeep(440, 'sine');
    });

    socket.on('alert:emergency_broadcast', (alertData: { title: string; message: string; level: string; timestamp: string }) => {
      setLatestBroadcast(alertData);
      playSiren(6);
      speakAlert(`Attention! Emergency alert: ${alertData.title}. ${alertData.message}`);
    });

    socket.on('task:created', () => {
      debouncedFetchInitialData();
      playBeep(880, 'sine');
    });

    socket.on('task:assigned', (data: { responder?: Responder; task?: unknown }) => {
      debouncedFetchInitialData();
      if (data.responder) {
        setResponders((prev) =>
          prev.map((r) => (r._id === data.responder?._id ? data.responder! : r))
        );
      }
      playBeep(1100, 'sine');
    });

    socket.on('task:status_changed', () => {
      debouncedFetchInitialData();
    });

    socket.on('voice_sos:alert', (voiceData: { senderName: string; audioDurationSeconds: number }) => {
      playBeep(1300, 'triangle');
      speakAlert(`Voice distress signal received from ${voiceData.senderName}`);
      debouncedFetchInitialData();
    });

    socket.on('radio:incoming_burst', () => {
      playBeep(1000, 'sine');
    });

    socket.on('incident:new', (inc: Incident) => {
      setIncidents((prev) => [inc, ...prev.filter((i) => i._id !== inc._id)]);
    });

    socket.on('shelter:updated', (shelt: Shelter) => {
      setShelters((prev) => prev.map((s) => (s._id === shelt._id ? shelt : s)));
    });

    socket.on('missing:new_record', (person: MissingPerson) => {
      setMissingPersons((prev) => [person, ...prev.filter((p) => p._id !== person._id)]);
    });

    socket.on('missing:updated', (person: MissingPerson) => {
      setMissingPersons((prev) => prev.map((p) => (p._id === person._id ? person : p)));
    });

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      socket.off('sos:new_distress');
      socket.off('sos:updated');
      socket.off('dispatch:assigned');
      socket.off('responder:position_update');
      socket.off('chat:new_message');
      socket.off('alert:emergency_broadcast');
      socket.off('task:created');
      socket.off('task:assigned');
      socket.off('task:status_changed');
      socket.off('voice_sos:alert');
      socket.off('radio:incoming_burst');
      socket.off('incident:new');
      socket.off('shelter:updated');
      socket.off('missing:new_record');
      socket.off('missing:updated');
    };
  }, [socket, playSiren, playBeep, speakAlert, debouncedFetchInitialData]);

  const triggerSOS = async (sosData: Partial<SOSBeacon>) => {
    if (isOfflineMode || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      // Buffer in localStorage offline queue
      enqueueOfflineRequest('SOS', '/api/sos', 'POST', sosData as Record<string, unknown>);

      const mockOfflineBeacon: SOSBeacon = {
        _id: `offline-${Date.now()}`,
        sosId: `SOS-OFFLINE-${Date.now().toString().slice(-4)}`,
        userName: sosData.userName || 'Offline Citizen',
        userPhone: sosData.userPhone || '+1 (555) 000-0000',
        location: sosData.location || { lat: 28.6185, lng: 77.2115 },
        batteryLevel: sosData.batteryLevel || 75,
        urgency: sosData.urgency || 'critical',
        triageColor: 'red',
        emergencyType: sosData.emergencyType || 'trapped',
        peopleCount: sosData.peopleCount || 1,
        status: 'pending',
        isOfflineSynced: true,
        meshRelayed: true,
        meshHops: 2,
        notes: `[BUFFERED IN OFFLINE QUEUE] ${sosData.notes || ''}`,
        createdAt: new Date().toISOString()
      };

      setSosBeacons((prev) => [mockOfflineBeacon, ...prev]);
      playBeep(700, 'square');
      return { success: true, data: mockOfflineBeacon };
    }

    try {
      const res = await fetch(`${serverUrl}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sosData),
      });
      const data = await res.json();
      return { success: data.success, data: data.beacon };
    } catch (err) {
      console.warn('Trigger SOS HTTP error - buffering in offline queue:', err);
      enqueueOfflineRequest('SOS', '/api/sos', 'POST', sosData as Record<string, unknown>);
      return { success: true, data: { sosId: `SOS-QUEUED-${Date.now().toString().slice(-4)}`, status: 'queued' } };
    }
  };

  const dismissBroadcast = () => {
    setLatestBroadcast(null);
  };

  return (
    <EmergencyContext.Provider
      value={{
        incidents,
        sosBeacons,
        responders,
        shelters,
        missingPersons,
        chatMessages,
        activeTab,
        setActiveTab,
        isOfflineMode,
        setIsOfflineMode,
        latestBroadcast,
        triggerSOS,
        fetchInitialData,
        dismissBroadcast
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => useContext(EmergencyContext);
