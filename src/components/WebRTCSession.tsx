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
        //socketRef.current = io('https://backend-pdis.onrender.com');
        socketRef.current = io('https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app');
        const socket = socketRef.current;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream;

        setParticipants([{ id: 'local', stream, name: 'You' }]);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('join-room', roomId);

        socket.on('user-connected', async (userId: string) => {
          console.log(`User connected: ${userId}`);
          const peerConnection = createPeerConnection(userId, stream);
          peerConnectionsRef.current.set(userId, peerConnection);

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('offer', { offer, roomId, targetId: userId });
        });

        socket.on('user-disconnected', (userId: string) => {
          console.log(`User disconnected: ${userId}`);
          if (peerConnectionsRef.current.has(userId)) {
            peerConnectionsRef.current.get(userId)?.close();
            peerConnectionsRef.current.delete(userId);
          }
          setParticipants(prev => prev.filter(p => p.id !== userId));
          socket.emit('update-participant-count', { roomId });
        });

        socket.on('offer', async ({ offer, senderId }: { offer: RTCSessionDescriptionInit; senderId: string }) => {
          console.log(`Received offer from: ${senderId}`);
          const peerConnection = createPeerConnection(senderId, stream);
          peerConnectionsRef.current.set(senderId, peerConnection);

          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socket.emit('answer', { answer, roomId, targetId: senderId });
        });

        socket.on('answer', ({ answer, senderId }: { answer: RTCSessionDescriptionInit; senderId: string }) => {
          console.log(`Received answer from: ${senderId}`);
          const peerConnection = peerConnectionsRef.current.get(senderId);
          if (peerConnection) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

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
 
  // 🔹 FIXED: Update participant count
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('participant-count', (count: number) => {
      console.log(`Updated participant count: ${count}`);
    });

    return () => {
      socketRef.current?.off('participant-count');
    };
  }, []);

  // 🔹 FIXED: Active Speaker Detection
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

  // 🔹 FIXED: Audio Level Detection
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

  const createPeerConnection = (userId: string) => {
    const peerConnection = new RTCPeerConnection({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }]});

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', { candidate: event.candidate, roomId, targetId: userId });
      }
    };

    // 🔹 FIXED: Assign remote stream to participants
    peerConnection.ontrack = (event) => {
      console.log(`Receiving remote track from ${userId}`);
      const [remoteStream] = event.streams;
      setTimeout(() => {
        setParticipants(prev => {
          if (prev.some(p => p.id === userId)) return prev;
          return [...prev, { id: userId, stream: remoteStream, name: `Participant ${prev.length + 1}` }];
        });
      }, 100); // Small delay ensures DOM is ready
    };

    return peerConnection;
  };

  const cleanup = () => {
    socketRef.current?.off('user-connected');
    socketRef.current?.off('user-disconnected');
    socketRef.current?.off('offer');
    socketRef.current?.off('answer');
    socketRef.current?.off('ice-candidate');
    socketRef.current?.off('participant-count');
    socketRef.current?.off('active-speaker');
  
    socketRef.current?.disconnect();
    peerConnectionsRef.current.forEach(connection => connection.close());
    peerConnectionsRef.current.clear();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
  
    setParticipants([]); // Clear UI
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
                  <video
                    className="video-stream"
                    ref={el => { if (el && participant.id === 'local') el.srcObject = participant.stream; }}
                    autoPlay
                    playsInline
                    muted={participant.id === 'local'}
                    ref={(el) => {
                      if (el && participant.stream) {
                        el.srcObject = participant.stream;
                      }
                    }}
                  />
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
