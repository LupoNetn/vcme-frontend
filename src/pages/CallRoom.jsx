import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Video, PhoneOff } from 'lucide-react';
import WaitingRoomApproval from '../components/WaitingRoomApproval';
import useWebsocketStore from '../store/WebsocketStore.jsx';
import useAuthStore from '../store/AuthStore';
import useCallStore from '../store/CallStore';
import useVideoStore from '../store/VideoStore.js';

const CallRoom = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const send = useWebsocketStore((state) => state.send)
  const user = useAuthStore((state) => state.user)
  const currentCall = useCallStore((state) => state.currentCall)
  const localStream = useVideoStore((state) => state.localStream)
  const remoteStream = useVideoStore((state) => state.remoteStream)
  const remoteStreamRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    if(localStream && localStreamRef.current) {
        localStreamRef.current.srcObject = localStream
    }
  },[localStream])

  useEffect(() => {
    if(remoteStream && remoteStreamRef.current) {
        remoteStreamRef.current.srcObject = remoteStream
    }
  },[remoteStream])

  const getCallInitiator = () => {
    console.log("heyj")
    const payload = {
      event_type: "get_initiator",
      payload: {
        call_id: currentCall,
        participant_id: user.id,
      }
    }
    send(payload)
  }

  useEffect(() => {
    if (currentCall && user?.id) {
      getCallInitiator()
    }
  }, [currentCall, user?.id])
 

  const handleLeaveRoom = () => {

    const payload = {
    event_type: "leave_room",
    payload: {
      call_id: currentCall,
      participant_id: user.id,
      },
    };
    send(payload);
  }

  useEffect(() => {
    return () => {
        // Optional: you could reset here too, but handleLeftRoom usually covers it
        // resetPeerConnection() 
    }
  }, [])

  return (
    <div className="min-h-screen bg-neutral-900 p-4 flex flex-col items-center justify-center">
      <WaitingRoomApproval />
      <div className="w-full max-w-5xl aspect-video bg-neutral-800 rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
        {/* Remote Video Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <video 
            ref={remoteStreamRef} 
            autoPlay 
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Local Video Placeholder */}
        <div className="absolute bottom-6 right-6 w-48 aspect-video bg-neutral-700 rounded-xl border-2 border-white/10 shadow-lg overflow-hidden flex items-center justify-center">
         <video 
            ref={localStreamRef} 
            autoPlay 
            muted
            playsInline
            className="w-full h-full object-cover -scale-x-100"
         />
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
          <button className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors text-white" title="Toggle Mic">
            <Mic size={20} />
          </button>
          <button className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors text-white" title="Toggle Camera">
            <Video size={20} />
          </button>
          <button 
            onClick={() => handleLeaveRoom()}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white shadow-lg shadow-red-500/30"
            title="End Call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-neutral-500 text-sm">
        Room ID: <span className="text-neutral-300 font-mono">{callId || 'direct-call'}</span>
      </div>
    </div>
  );
};

export default CallRoom;
