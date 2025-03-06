import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Define the base Session type from the database
interface Session {
  id: string;
  room_id: string;
  title: string;
  host_id: string;
  status: string;
}

// Extended Session type for frontend use
export interface ExtendedSession extends Session {
  recording?: boolean;
  inviteKey?: string;
  host?: string;
  participants?: string[];
  isAISession?: boolean;
  endTime?: Date;
  startTime?: Date;
  duration?: string;
}

interface Participant {
  id: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  isMuted: boolean;
}

interface PodcastState {
  currentSession: ExtendedSession | null;
  savedPodcasts: ExtendedSession[];
  participants: Participant[];
  socket: Socket | null;
  createSession: (title: string) => Promise<boolean>;
  joinSession: (session: Session) => boolean;
  leaveSession: () => void;
  endSession: () => void;
  toggleRecording: () => void;
  savePodcast: (session: ExtendedSession) => void;
  deletePodcast: (sessionId: string) => void;
  fetchSavedPodcasts: () => void;
  setSession: (session: ExtendedSession) => void;
  setSocket: (socket: Socket) => void;
}

export const usePodcastStore = create<PodcastState>((set, get) => ({
  currentSession: null,
  savedPodcasts: [],
  participants: [],
  socket: null,

  createSession: async (title: string) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();
      set({ currentSession: session });
      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      return false;
    }
  },

  joinSession: (session: Session) => {
    try {
      io.emit('join-room', session.room_id);
      set({ currentSession: session });
      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      return false;
    }
  },

  leaveSession: () => {
    if (io) {
      io.emit('leave-room');
    }
    set({ currentSession: null, participants: [] });
  },

  endSession: () => {
    const session = get().currentSession;
    if (session) {
      const endedSession: ExtendedSession = {
        ...session,
        endTime: new Date(),
        status: 'ended'
      };
      get().savePodcast(endedSession);
      set({ currentSession: null, participants: [] });
    }
  },

  toggleRecording: () => {
    const session = get().currentSession;
    const socket = get().socket;
  
    if (session && socket) {
      if (session.recording) {
        socket.emit('stop-recording', { roomId: session.room_id });
      } else {
        socket.emit('start-recording', { roomId: session.room_id });
      }
  
      set({
        currentSession: {
          ...session,
          recording: !session.recording,
        },
      });
    }
  },
  

  savePodcast: (session: ExtendedSession) => {
    set((state) => ({
      savedPodcasts: [...state.savedPodcasts, session],
    }));
  },

  deletePodcast: (sessionId: string) => {
    set((state) => ({
      savedPodcasts: state.savedPodcasts.filter((podcast) => podcast.id !== sessionId),
    }));
  },

  fetchSavedPodcasts: async () => {
    try {
      const response = await fetch('https://backend-pdis.onrender.com/api/savedPodcasts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved podcasts');
      }

      const savedPodcasts = await response.json();
      set({ savedPodcasts });
    } catch (error) {
      console.error('Error fetching saved podcasts:', error);
    }
  },

  setSession: (session: ExtendedSession) => set({ currentSession: session }),
  setSocket: (socket: Socket) => set({ socket }),
}));

// Initialize socket connection somewhere in your app
const socket = io('https://your-socket-server.com');
usePodcastStore.getState().setSocket(socket);