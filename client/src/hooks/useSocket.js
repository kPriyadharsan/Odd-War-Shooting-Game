import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket.js';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);
      setSocketId(socket.id);
    }

    // Ping check
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        const start = performance.now();
        socket.emit('ping', {}, () => {
          setLatency(Math.round(performance.now() - start));
        });
      }
    }, 5000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      clearInterval(pingInterval);
    };
  }, []);

  return { isConnected, socketId, latency };
};
