import { io } from 'socket.io-client';
import { getToken } from './auth';

export const socket = io('https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app', {
  auth: { token: () => getToken(), },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
});
