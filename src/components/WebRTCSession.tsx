import React, { useRef, useEffect, useState } from 'react';
import './WebRTCSession.css';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { VideoProcessor } from './podcast/VideoProcessor';

interface WebRTCSessionProps {
  roomId?: string;
}

interface Participant {
  id: string;
  stream: MediaStream;
  name: string;
}

const WebRTCSession: React.FC<WebRTCSessionProps> = ({ roomId = 'default-room' }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Connect to the backend WebSocket
        socketRef.current = io('https://backend-pdis.onrender.com');
        const socket = socketRef.current;

        // Get user media (audio + video)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream;

        // Set local participant
        setParticipants([{ id: 'local', stream, name: 'You' }]);

        // Display video on local screen
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Emit event to join the WebRTC session
        socket.emit('join-room', roomId);

        // Handle when a new user joins
        socket.on('user-connected', async (userId: string) => {
          console.log(`User connected: ${userId}`);
          const peerConnection = createPeerConnection(userId, stream);
          peerConnectionsRef.current.set(userId, peerConnection);

          // Create and send offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('offer', { offer, roomId, targetId: userId });
        });

        // Handle when a user leaves
        socket.on('user-disconnected', (userId: string) => {
          console.log(`User disconnected: ${userId}`);
          if (peerConnectionsRef.current.has(userId)) {
            peerConnectionsRef.current.get(userId)?.close();
            peerConnectionsRef.current.delete(userId);
          }
          setParticipants(prev => prev.filter(p => p.id !== userId));
        });

        // Handle incoming offers
        socket.on('offer', async ({ offer, senderId }: { offer: RTCSessionDescriptionInit; senderId: string }) => {
          console.log(`Received offer from: ${senderId}`);
          const peerConnection = createPeerConnection(senderId, stream);
          peerConnectionsRef.current.set(senderId, peerConnection);

          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socket.emit('answer', { answer, roomId, targetId: senderId });
        });

        // Handle answers
        socket.on('answer', ({ answer, senderId }: { answer: RTCSessionDescriptionInit; senderId: string }) => {
          console.log(`Received answer from: ${senderId}`);
          const peerConnection = peerConnectionsRef.current.get(senderId);
          if (peerConnection) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        // Handle ICE candidates
        socket.on('ice-candidate', ({ candidate, senderId }: { candidate: RTCIceCandidateInit; senderId: string }) => {
          console.log(`Received ICE candidate from: ${senderId}`);
          const peerConnection = peerConnectionsRef.current.get(senderId);
          if (peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

      } catch (error) {
        console.error('Error initializing WebRTC:', error);
      }
    };

    initializeWebRTC();
    return cleanup;
  }, [roomId]);

  // Active Speaker Detection
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('active-speaker', ({ userId }) => {
      setParticipants(prev =>
        prev.map(p => ({
          ...p,
          isActiveSpeaker: p.id === userId,
        }))
      );
    });

    return () => {
      socketRef.current?.off('active-speaker');
    };
  }, []);

  // Audio Level Detection
  useEffect(() => {
    if (!localStreamRef.current || !socketRef.current) return;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStreamRef.current);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    analyser.fftSize = 512;
    microphone.connect(analyser);

    const sendAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      socketRef.current?.emit('audio-level', { roomId, userId: 'local', level: volume });
      requestAnimationFrame(sendAudioLevel);
    };

    sendAudioLevel();
    return () => audioContext.close();
  }, []);

  const createPeerConnection = (userId: string, stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', { candidate: event.candidate, roomId, targetId: userId });
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => (prev.some(p => p.id === userId) ? prev : [...prev, { id: userId, stream: remoteStream, name: `Participant ${prev.length}` }]));
    };

    return peerConnection;
  };

  const cleanup = () => {
    socketRef.current?.disconnect();
    peerConnectionsRef.current.forEach(connection => connection.close());
    localStreamRef.current?.getTracks().forEach(track => track.stop());
  };

  return (
    <div className="studio-container">
      <div className="studio-background" />
      <div className="studio-overlay">
        <div className="studio-circle">
          {participants.map(participant => (
            <div key={participant.id} className="participant-seat">
              <div className="seat-container">
                <div className="video-container">
                  <video className="video-stream" ref={el => { if (el && participant.id === 'local') el.srcObject = participant.stream; }} autoPlay playsInline muted={participant.id === 'local'} />
                </div>
                <div className="participant-name">{participant.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="controls">
        <button className="control-button" onClick={() => setIsAudioMuted(!isAudioMuted)}>{isAudioMuted ? <MicOff /> : <Mic />}</button>
        <button className="control-button" onClick={() => setIsVideoOff(!isVideoOff)}>{isVideoOff ? <VideoOff /> : <Video />}</button>
        <button className="control-button active" onClick={cleanup}><PhoneOff /></button>
      </div>
    </div>
  );
};

export default WebRTCSession;
