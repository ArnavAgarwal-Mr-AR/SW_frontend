import React, { useRef, useEffect, useState } from 'react';
import './WebRTCSession.css';
import io from 'socket.io-client';
const twilio = require("twilio"); 

//const socket = io('https://backend-pdis.onrender.com'); // Connect to signaling server
const socket = io('https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app'); // Connect to signaling server

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createToken() {
  const token = await client.tokens.create();

  console.log(token.accountSid);
}

createToken();

const WebRTCSession = ({ roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    const startWebRTC = async () => {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;

      // Create RTCPeerConnection
      const myIceServers = ICE_SERVERS;
      const configuration = { iceServers: myIceServers };
      const peerConnection = new RTCPeerConnection(configuration);

      // Add local tracks to the connection
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate, roomId); // Send ICE candidate to server
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnectionRef.current = peerConnection;

      // Signaling events
      socket.on('offer', async (offer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, roomId); // Send answer to server
      });

      socket.on('answer', async (answer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('ice-candidate', async (candidate) => {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      // Join the room
      socket.emit('join-room', roomId); // Emit join-room event with the room ID

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', offer, roomId); // Send offer to server
    };

    startWebRTC();

    return () => {
      // Cleanup
      socket.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [roomId]);

  return (
    <div className="webrtc-container">
      <video ref={localVideoRef} autoPlay muted className="video-local" />
      <video ref={remoteVideoRef} autoPlay className="video-remote" />
    </div>
  );
};

export default WebRTCSession;
