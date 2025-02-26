import { io } from 'socket.io-client';
import { getToken } from './auth'; // implement this to get token from storage

export const socket = io('https://backend-pdis.onrender.com', {
  auth: {
    token: getToken(),
  },
});
