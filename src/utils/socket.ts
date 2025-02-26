import { io } from 'socket.io-client';
import { getToken } from './auth'; // implement this to get token from storage
const backendUrl = import.meta.env.BACKEND_URL | 'https://backend-pdis.onrender.com';
export const socket = io(backendUrl, {
  auth: {
    token: getTokenFromLocalStorageOrWherever(),
  },
});
