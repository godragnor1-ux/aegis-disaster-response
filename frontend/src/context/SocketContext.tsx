'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const serverUrl = getSocketUrl();
    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
      socketInstance.emit('channel:join', activeChannel);
      socketInstance.emit('channel:join', 'command_ops');
    });

    socketInstance.on('disconnect', () => {
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
