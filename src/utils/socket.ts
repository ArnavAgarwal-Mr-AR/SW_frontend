import { io } from 'socket.io-client';
import { getToken } from './auth';

export const socket = io('https://backend-pdis.onrender.com', {
  auth: { token: getToken() },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
});
