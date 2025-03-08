import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, CircleDot, Share2, Check, UserPlus, X } from 'lucide-react';
import './PodcastSession.css';
import { usePodcastStore } from '../../store/podcastStore';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../utils/socket';

interface Participant {
  id: string;
  isActiveSpeaker: boolean;
  // Add other properties as needed
}

export const PodcastSession = () => {
  const { inviteKey } = useParams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const currentSession = usePodcastStore((state) => state.currentSession);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const getVideoContainerClass = () => {
    const count = participants.length + 1; // +1 for local user
  
    if (currentSession?.recording) {
      return 'video-container-single'; // Show only the active speaker
    }
  
    if (count === 1) return 'video-container-full';
    if (count === 2) return 'video-container-split';
    return 'video-container-grid';
  };
  

  useEffect(() => {
    console.log("Joining room with invite key:", inviteKey);
    
    socket.on('connect', () => {
      console.log("Socket connected successfully");
      socket.emit('join-room', inviteKey);
    });

    socket.on('connect_error', (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on('user-connected', async (newUserId: string) => {
      const peerConnection = createPeerConnection(newUserId);
      peerConnectionsRef.current.set(newUserId, peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId: inviteKey, targetId: newUserId });

      setParticipants((prev) => [...prev, { id: newUserId, isActiveSpeaker: false }]);
    });

    socket.on('existing-participants', (existingIds: string[]) => {
      setParticipants(existingIds.map(id => ({ id, isActiveSpeaker: false })));
    });

    socket.on('user-disconnected', (disconnectedId: string) => {
      if (peerConnectionsRef.current.has(disconnectedId)) {
        peerConnectionsRef.current.get(disconnectedId)?.close();
        peerConnectionsRef.current.delete(disconnectedId);
      }
      setParticipants((prev) => prev.filter(p => p.id !== disconnectedId));
    });

    socket.on('offer', async ({ offer, senderId }) => {
      const peerConnection = createPeerConnection(senderId);
      peerConnectionsRef.current.set(senderId, peerConnection);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', { answer, roomId: inviteKey, targetId: senderId });
    });

    socket.on('answer', async ({ answer, senderId }) => {
      const peerConnection = peerConnectionsRef.current.get(senderId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      const peerConnection = peerConnectionsRef.current.get(senderId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('active-speaker', ({ userId }) => {
      setParticipants(prev =>
        prev.map(p => ({
          ...p,
          isActiveSpeaker: p.id === userId,
        }))
      );
    });

    socket.on('participant-count', (count: number) => {
      setParticipantCount(count);
    });

    return () => {
      socket.off('user-connected');
      socket.off('existing-participants');
      socket.off('user-disconnected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('participant-count');
      socket.off('active-speaker');
      stopLocalTracks();
    };
  }, [inviteKey]);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Enable tracks by default
        setIsVideoOn(true);
        setIsMuted(false);

        // Notify other users that we're ready to connect
        socket.emit('ready-to-connect', inviteKey);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera/microphone');
      }
    };

    initializeMedia();

    // Clean up function
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [inviteKey]);

  const createPeerConnection = useCallback((targetId: string) => {
    console.log(`Creating peer connection for target: ${targetId}`);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: inviteKey,
          targetId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log(`Received track from peer: ${targetId}`);
      const [remoteStream] = event.streams;
      const videoElement = document.getElementById(`video-${targetId}`) as HTMLVideoElement;
      if (videoElement && remoteStream) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Add local tracks to the peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current.set(targetId, peerConnection);
    return peerConnection;
  }, [inviteKey]);

  useEffect(() => {
    socket.on('user-ready', async (userId) => {
      console.log(`User ${userId} is ready to connect`);
      const peerConnection = createPeerConnection(userId);
      
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('offer', {
          offer,
          roomId: inviteKey,
          targetId: userId,
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    });

    socket.on('offer', async ({ offer, senderId }) => {
      console.log(`Received offer from ${senderId}`);
      const peerConnection = createPeerConnection(senderId);
      
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
          answer,
          roomId: inviteKey,
          targetId: senderId,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socket.on('answer', async ({ answer, senderId }) => {
      console.log(`Received answer from ${senderId}`);
      const peerConnection = peerConnectionsRef.current.get(senderId);
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      console.log(`Received ICE candidate from ${senderId}`);
      const peerConnection = peerConnectionsRef.current.get(senderId);
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    return () => {
      socket.off('user-ready');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [inviteKey, createPeerConnection]);

  function stopLocalTracks() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  async function toggleVideo() {
    if (isVideoOn) {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.stop();
      }
      setIsVideoOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: !isMuted,
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
      } catch (err) {
        console.error('Error turning on video:', err);
      }
    }
  }

  async function toggleAudio() {
    if (!isMuted) {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.stop();
      }
      setIsMuted(true);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: true,
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsMuted(false);
      } catch (err) {
        console.error('Error turning on audio:', err);
      }
    }
  }

  function handleToggleRecording() {
    if (!isRecording) {
      if (localStreamRef.current) {
        recordedChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, {
          mimeType: 'video/webm; codecs=vp9',
        });

        mediaRecorderRef.current.ondataavailable = (evt) => {
          if (evt.data.size > 0) recordedChunksRef.current.push(evt.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          recordedChunksRef.current = [];
          await uploadRecording(blob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);

        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prevTime) => prevTime + 1);
        }, 1000);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }

  async function uploadRecording(blob: Blob) {
    const formData = new FormData();
    const sessionId = currentSession?.id || '';
    const userId = user?.id;
    const activeSpeakerId = participants.find(p => p.isActiveSpeaker)?.id || userId;
  
    if (!sessionId || !userId) {
      console.error('Invalid sessionId or userId:', { sessionId, userId });
      return;
    }
  
    formData.append('video', blob, 'recording.webm');
    formData.append('sessionId', sessionId);
    formData.append('userId', userId);
    formData.append('activeSpeakerId', activeSpeakerId || '');
  
    try {
      const response = await fetch('https://backend-pdis.onrender.com/upload', {
        method: 'POST',
        body: formData,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }
  
      const data = await response.json();
      console.log('Speaker-focused recording uploaded:', data);
    } catch (error) {
      console.error('Error uploading recording:', error);
    }
  }
  

  async function endSession() {
    try {
      const response = await fetch('https://backend-pdis.onrender.com/api/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ roomId: inviteKey })
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      console.log('Session ended successfully');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  function handleEndSession() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    stopLocalTracks();
    endSession();
    navigate('/dashboard');
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleShare = async (platform: 'whatsapp' | 'email' | 'sms') => {
    const shareUrl = `${window.location.origin}/join-podcast?key=${inviteKey}`;
    const message = `
🎙️ Podcast Invitation!

Hey! ${user.name} would love to have you as a guest on their podcast."}"!

📝 Session Details:
• Host: ${user.name}
• Invite Key: ${inviteKey}

🔗 Join using this link:
${shareUrl}

Looking forward to having you on the show! 🎧
`;

    try {
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
          break;
        case 'email':
          const subject = `Join ${user.name}'s Podcast Session`;
          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
          break;
        case 'sms':
          window.open(`sm.opens:sm.opensody=${encodeURIComponent(message)}`, '_blank');
          break;
        default:
          console.error('Unsupported sharing platform');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="podcast-studio">
      <div className={getVideoContainerClass()}>
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="video-stream"
            autoPlay
            playsInline
            muted
          />
        </div>
        
        {participants.map((participant) => (
          <div key={participant.id} className="video-wrapper">
            <video
              id={`video-${participant.id}`}
              className="video-stream"
              autoPlay
              playsInline
            />
          </div>
        ))}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <CircleDot className="indicator-icon" />
          <span className="recording-time">{formatTime(recordingTime)}</span>
        </div>
      )}

      <div className="controls">
        <button
          onClick={toggleVideo}
          className={`control-button ${isVideoOn ? 'active' : ''}`}
          title={isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
        >
          {isVideoOn ? <VideoOff /> : <Video />}
        </button>

        <button
          onClick={toggleAudio}
          className={`control-button ${!isMuted ? 'active' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        <button
          onClick={handleToggleRecording}
          className={`control-button ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <CircleDot />
        </button>

        <button
          onClick={() => setShowInvitePopup(true)}
          className="control-button"
          title="Add Guest"
        >
          <UserPlus />
        </button>

        <button
          onClick={handleEndSession}
          className="control-button end-call"
          title="End Session"
        >
          <PhoneOff />
        </button>
      </div>

      <div className="participant-count">
        Participants: {participantCount}
      </div>

      {showInvitePopup && (
        <div className="invite-popup">
          <div className="invite-popup-content">
            <button 
              className="close-button" 
              onClick={() => setShowInvitePopup(false)}
              title="Close"
            >
              <X />
            </button>
            <h2 className="invite-title">Invite Guest</h2>
            <div className="invite-key-container">
              <p className="invite-key">{inviteKey}</p>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(inviteKey)}
                title="Copy to Clipboard"
              >
                {copied ? (
                  <>
                    <Check className="icon" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="icon" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="share-options">
              <button
                type="button"
                className="share-option whatsapp"
                onClick={() => handleShare('whatsapp')}
              >
                Share via WhatsApp
              </button>
              <button
                type="button"
                className="share-option email"
                onClick={() => handleShare('email')}
              >
                Share via Email
              </button>
              <button
                type="button"
                className="share-option sms"
                onClick={() => handleShare('sms')}
              >
                Share via SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
