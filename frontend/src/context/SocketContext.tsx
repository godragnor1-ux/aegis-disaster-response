'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/apiConfig';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeChannel: string;
  joinChannel: (channel: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeChannel: 'citizen_public',
  joinChannel: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeChannel, setActiveChannel] = useState('citizen_public');
  const activeChannelRef = useRef(activeChannel);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  useEffect(() => {
    const serverUrl = getSocketUrl();
    console.log(`📡 [Socket.IO Client] Initializing connection to: ${serverUrl}`);

    const socketInstance = io(serverUrl, {
      transports: ['polling', 'websocket'], // Robust cloud transport negotiation
      reconnectionAttempts: 25,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log(`✅ [Socket.IO Client] Connected to gateway with ID: ${socketInstance.id}`);
      setIsConnected(true);
      socketInstance.emit('channel:join', activeChannelRef.current);
      socketInstance.emit('channel:join', 'command_ops');
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 [Socket.IO Client] Reconnected after ${attemptNumber} attempts.`);
      setIsConnected(true);
      socketInstance.emit('channel:join', activeChannelRef.current);
      socketInstance.emit('channel:join', 'command_ops');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO Client] Connection error:', err.message);
      setIsConnected(false);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('🔌 [Socket.IO Client] Disconnected:', reason);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinChannel = (channel: string) => {
    setActiveChannel(channel);
    if (socket && isConnected) {
      socket.emit('channel:join', channel);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, activeChannel, joinChannel }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
