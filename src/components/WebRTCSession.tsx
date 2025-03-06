import React, { useRef, useEffect, useState } from 'react';
import './WebRTCSession.css';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

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

  const startRecording = () => {
    if (socketRef.current) {
      socketRef.current.emit('start-recording', { roomId });
    }
  };
  
  const stopRecording = () => {
    if (socketRef.current) {
      socketRef.current.emit('stop-recording', { roomId });
    }
  };
  
  useEffect(() => {
    if (!socketRef.current) return;
  
    socketRef.current.on('recording-started', () => {
      console.log('Recording started');
    });
  
    socketRef.current.on('recording-stopped', async () => {
      console.log('Recording stopped. Processing...');
      
      const response = await fetch('/api/process-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: roomId }),
      });
  
      const data = await response.json();
      console.log('Final video available at:', data.finalRecording);
    });
  
    return () => {
      socketRef.current?.off('recording-started');
      socketRef.current?.off('recording-stopped');
    };
  }, []);
  

  useEffect(() => {
    const startWebRTC = async () => {
      try {
        // Initialize socket connection
        socketRef.current = io('https://backend-pdis.onrender.com');
        const socket = socketRef.current;

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: true 
        });
        localStreamRef.current = stream;
        
        // Add local participant
        setParticipants([{
          id: 'local',
          stream,
          name: 'You'
        }]);

        // Join room
        socket.emit('join-room', roomId);

        // Handle new participant joining
        socket.on('user-connected', async (userId: string) => {
          const peerConnection = createPeerConnection(userId, stream);
          peerConnectionsRef.current.set(userId, peerConnection);
          
          // Create and send offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('offer', { offer, roomId, targetId: userId });
        });

        // Handle participant leaving
        socket.on('user-disconnected', (userId: string) => {
          if (peerConnectionsRef.current.has(userId)) {
            peerConnectionsRef.current.get(userId)?.close();
            peerConnectionsRef.current.delete(userId);
          }
          setParticipants(prev => prev.filter(p => p.id !== userId));
        });
      
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

      } catch (error) {
        console.error('Error starting WebRTC:', error);
      }
    };

    startWebRTC();

    return () => {
      cleanup();
    };
  }, [roomId]);

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
  
      if (socketRef.current) {
        socketRef.current.emit('audio-level', { roomId, userId: 'local', level: volume });
      }
      requestAnimationFrame(sendAudioLevel);
    };
  
    sendAudioLevel();
  
    return () => {
      audioContext.close();
    };
  }, []);
  

  const createPeerConnection = (userId: string, stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local tracks
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
          targetId: userId
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => {
        if (prev.some(p => p.id === userId)) return prev;
        return [...prev, {
          id: userId,
          stream: remoteStream,
          name: `Participant ${prev.length}`
        }];
      });
    };

    return peerConnection;
  };

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    peerConnectionsRef.current.forEach(connection => {
      connection.close();
    });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const handleEndCall = () => {
    cleanup();
    // Navigate away or handle end call
  };

  return (
    <div className="studio-container">
      <div className="studio-background" />
      <div className="studio-overlay">
        <div className="studio-circle">
          {participants.map((participant, index) => (
            <div key={participant.id} className="participant-seat">
              <div className="seat-container">
                <div className="chair" />
                <div className="video-container">
                  <video
                    className="video-stream"
                    ref={el => {
                      if (el) {
                        el.srcObject = participant.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={participant.id === 'local'}
                  />
                </div>
                <div className="participant-name">{participant.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button 
          className="control-button" 
          onClick={startRecording}
          >
          Start Recording
        </button>
        <button 
          className="control-button" 
          onClick={stopRecording}
          >
          Stop Recording
        </button>
        <button 
          className={`control-button ${isAudioMuted ? 'active' : ''}`}
          onClick={toggleAudio}
        >
          {isAudioMuted ? <MicOff /> : <Mic />}
        </button>
        <button 
          className={`control-button ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff /> : <Video />}
        </button>
        <button 
          className="control-button active"
          onClick={handleEndCall}
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default WebRTCSession;
