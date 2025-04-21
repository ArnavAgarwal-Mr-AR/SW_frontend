import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, CircleDot, Share2, Check, UserPlus, X } from 'lucide-react';
import './PodcastSession.css';
import { usePodcastStore } from '../../store/podcastStore';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../utils/socket';
const twilio = require("twilio"); 

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
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

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
    const init = async () => {
      await initLocalStream();
      socket.emit('join-room', inviteKey);
    };

    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        });
        localStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsVideoOn(true);
        setIsMuted(false);
      } catch (err) {
        console.error('Failed to access media devices:', err);
      }
    };

    init();
    window.onbeforeunload = cleanupWebRTC;   

    socket.on('user-connected', async (newUserId: string) => {
      if (!localStreamRef.current) {
        console.warn("Local stream not ready, skipping offer.");
        return;
      }
      const peerConnection = createPeerConnection(newUserId);
      peerConnectionsRef.current.set(newUserId, peerConnection);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId: inviteKey, targetId: newUserId });

      setParticipants((prev) => [...prev, { id: newUserId, isActiveSpeaker: false }]);
    });

    socket.on('existing-participants', async (existingIds: string[]) => {
      if (!localStreamRef.current) await initLocalStream();
      for (const id of existingIds) {
        const peerConnection = createPeerConnection(id);
        peerConnectionsRef.current.set(id, peerConnection);
    
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer, roomId: inviteKey, targetId: id });
    
        setParticipants((prev) => [...prev, { id, isActiveSpeaker: false }]);
      }
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

    socket.on('session-ended', () => {
      alert("Session ended by host.");
      cleanupWebRTC();
      stopLocalTracks();
      navigate('/dashboard');
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
      cleanupWebRTC();
    };
  }, [inviteKey]);

  // Create RTCPeerConnection
  const myIceServers = ICE_SERVERS;
  const configuration = { iceServers: myIceServers };
  function createPeerConnection(userId: string) {
    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: inviteKey,
          targetId: userId
        });
      }
    };

    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId: inviteKey, targetId: userId });
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE state with ${userId}:`, peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'disconnected') {
        peerConnection.close();
        peerConnectionsRef.current.delete(userId);
      }
    };    

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
    
      const tryAssignStream = () => {
        const videoElement = document.getElementById(`video-${userId}`) as HTMLVideoElement | null;
        if (videoElement) {
          videoElement.srcObject = remoteStream;
        } else {
          setTimeout(tryAssignStream, 100); 
        }
      };
    
      tryAssignStream();
    };
    

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    return peerConnection;
  }

  function stopLocalTracks() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  function stopAndCleanupMedia() {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  
  async function toggleVideo() {
    if (isVideoOn) {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
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
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
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
    if (user?.id !== currentSession?.host_id) {
      alert("Only the host can control recording.");
      return;
    }

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
      const response = await fetch('https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/upload', {
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
      const response = await fetch('https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/api/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ roomId: inviteKey })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData.error);
        throw new Error('Failed to end session');
      }

      console.log('Session ended successfully');
      // ❗️Also update Zustand state after backend confirms end
      usePodcastStore.getState().endSession();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  function cleanupWebRTC() {
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
  
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    socket.disconnect();
    stopAndCleanupMedia();
  }  

  async function handleEndSession() {
    if (user?.id === currentSession?.host_id && participants.length > 0) {
      alert("Guests are still in the session. Ask them to leave before ending it.");
      return;
    }    
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
    cleanupWebRTC();
    stopAndCleanupMedia();
    stopLocalTracks();
    await endSession();
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
Podcast Invitation! Your presence is needed!

Hey! ${user.name} would love to have you as a guest on their podcast.

Login to spinningwheel.app and enter this invite key in join podcast session. 
Your Invite Key: ${inviteKey}

Looking forward to having you on the show!
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
              muted={participant.id === user?.id} // <-- Only mute yourself
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

        {user?.id === currentSession?.host_id && (
          <button
            onClick={handleToggleRecording}
            className={`control-button ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <CircleDot />
          </button>
        )} 

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
