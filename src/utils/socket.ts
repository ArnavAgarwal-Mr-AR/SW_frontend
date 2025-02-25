import { io } from 'socket.io-client';
import { getToken } from './auth'; // implement this to get token from storage
const backendUrl = import.meta.env.BACKEND_URL;
export const socket = io(backendUrl, {
  auth: {
    token: getToken(),
  },
});
