import { io } from 'socket.io-client';
import { config } from '../config/env.js';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(config.socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
