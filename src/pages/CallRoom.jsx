import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { Mic, Video, PhoneOff, MicOff, VideoOff, User, Smile } from "lucide-react";
import WaitingRoomApproval from "../components/WaitingRoomApproval";
import useWebsocketStore from "../store/WebsocketStore.jsx";
import useAuthStore from "../store/AuthStore";
import useCallStore from "../store/CallStore";
import useVideoStore from "../store/VideoStore.js";
import useCall from "../hooks/useCall";

const FloatingEmoji = ({ emoji, onComplete }) => {
  // We only randomize the horizontal starting point (40% to 60%)
  const [randomLeft] = useState(40 + Math.random() * 20);

  useEffect(() => {
    const timer = setTimeout(onComplete, 2500); // Wait for the 2.5s CSS animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed bottom-32 pointer-events-none select-none z-[100] animate-emoji-simple text-6xl"
      style={{ left: `${randomLeft}%` }}
    >
      <span className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] block">
        {emoji}
      </span>
    </div>
  );
};

const CallRoom = () => {
  const params = useParams();
  const callId = params["*"];
  const navigate = useNavigate();
  const send = useWebsocketStore((state) => state.send);
  const user = useAuthStore((state) => state.user);
  const currentCall = useCallStore((state) => state.currentCall);
  const callParticipants = useCallStore((state) => state.callParticipants);
  const activeEmojis = useCallStore((state) => state.activeEmojis);
  const removeEmoji = useCallStore((state) => state.removeEmoji);
  const localStream = useVideoStore((state) => state.localStream);
  const remoteStream = useVideoStore((state) => state.remoteStream);
  const { findCallByLink } = useCall();
  const remoteStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const { endCall } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  const emoji = [
    "😀", "😂", "🤔", "😎", "😭", "😡", "👍", "👎",
    "❤️", "🔥",
  ];




  useEffect(() => {
    const autoJoin = async () => {
      if (callId && !currentCall && user?.id) {
        console.log("Direct link detected, attempting auto-join...");
        const call = await findCallByLink(callId);
        if (call) {
          const payload = {
            event_type: "join_room",
            payload: {
              call_id: call.id,
              call_link: call.call_link,
            },
          };
          send(payload);
        } else {
          navigate("/");
        }
      }
    };
    autoJoin();
  }, [callId, currentCall, user?.id]);

  useEffect(() => {
    if (localStream && localStreamRef.current) {
      localStreamRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteStreamRef.current) {
      remoteStreamRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoOff(!videoTracks[0].enabled);
      }
    }
  };

  const toggleEmojiPanel = () => {
    setShowEmojiPanel(prev => !prev);
  }

  const getCallInitiator = () => {
    console.log("heyj");
    const payload = {
      event_type: "get_initiator",
      payload: {
        call_id: currentCall,
        participant_id: user.id,
      },
    };
    send(payload);
  };

  useEffect(() => {
    if (currentCall && user?.id) {
      getCallInitiator();
    }
  }, [currentCall, user?.id]);

  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    let interval;
    if (remoteStream) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [remoteStream]);

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => num.toString().padStart(2, "0");
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleLeaveRoom = async () => {
    // robust check for call ID and title
    const callIdToUse = typeof currentCall === 'object' ? currentCall?.id : currentCall;
    const callTitleToUse = typeof currentCall === 'object' ? currentCall?.title : "Video Call"; 

    const res = await endCall({
      user_id: user?.id,
      call_id: callIdToUse, 
      participant_count: callParticipants.length,
      time: new Date().toLocaleTimeString(),
      call_title: callTitleToUse,
      participant: null,
      duration: formatDuration(duration),
    })
    console.log(res)
    
    const payload = {
      event_type: "leave_room",
      payload: {
        call_id: callIdToUse,
        participant_id: user.id,
      },
    };
    send(payload);

  };

  useEffect(() => {
    return () => {
      // Optional: you could reset here too, but handleLeftRoom usually covers it
      // resetPeerConnection()
    };
  }, []);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden z-50">
      <WaitingRoomApproval />

      {/* Remote Video - Full Screen (Long and Wide) */}
      <div className="absolute inset-0 z-0">
        <video
          ref={remoteStreamRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Fallback if no remote stream */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto animate-pulse border border-white/10">
                <User className="text-neutral-500" size={32} />
              </div>
              <p className="text-neutral-400 text-sm font-medium">
                Waiting for participant...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video - PIP (Bottom aligned, inside remote video) */}
      <div className="absolute bottom-28 right-4 w-28 md:w-48 aspect-[3/4] bg-neutral-800 rounded-xl overflow-hidden shadow-2xl border border-white/20 z-20 transition-all duration-300 hover:scale-105">
        <video
          ref={localStreamRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? "hidden" : ""}`}
        />
        {isVideoOff && (
          <div className="w-full h-full flex items-center justify-center bg-neutral-700">
            <VideoOff className="text-white/50" />
          </div>
        )}
      </div>

      {/* Top Bar - Minimal Info */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
            V
          </div>
          <div>
            <p className="text-white/90 text-xs font-mono bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
              {callId?.slice(0, 8)}...
            </p>
          </div>
          
          <div className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-2 transition-all duration-300">
            <div className={`w-2 h-2 rounded-full ${callParticipants.length > 1 ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-white text-xs font-mono font-medium">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls - Compact & Smaller */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 z-30 flex items-center gap-6 shadow-2xl">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-all active:scale-90 ${isMuted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
          title="Toggle Mic"
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={() => handleLeaveRoom()}
          className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-all active:scale-90 text-white shadow-lg shadow-red-500/30"
          title="End Call"
        >
          <PhoneOff size={24} fill="currentColor" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-all active:scale-90 ${isVideoOff ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
          title="Toggle Camera"
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button 
         onClick={toggleEmojiPanel}
         className={`p-3 rounded-full transition-all duration-300 active:scale-90 ${showEmojiPanel ? "bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/10 text-white hover:bg-white/20"}`}
         title="Send Emoji"
        >
          <Smile size={20} className={showEmojiPanel ? "animate-bounce" : ""} />
        </button>
      </div>

      {showEmojiPanel && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 bg-black/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 z-40 flex items-center gap-1 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out">
          <div className="flex items-center gap-0.5 px-1">
            {emoji.map((emojiChar, index) => (
              <button
                key={index}
                onClick={() => {
                  const payload = {
                    event_type: "send_emoji",
                    payload: {
                      call_id: currentCall,
                      participant_id: user.id,
                      emoji: emojiChar,
                    },
                  };
                  send(payload);
                  setShowEmojiPanel(false);
                }}
                className="w-12 h-12 flex items-center justify-center text-2xl rounded-full hover:bg-white/10 hover:scale-[1.3] hover:-translate-y-2 transition-all duration-300 ease-spring active:scale-95"
                title={emojiChar}
              >
                <span className="drop-shadow-lg">{emojiChar}</span>
              </button>
            ))}
          </div>
          
          {/* Subtle indicator triangle */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/60 border-r border-b border-white/10 rotate-45 backdrop-blur-3xl" />
        </div>
      )}

      {/* Floating Emojis Broadcast Area */}
      {activeEmojis.map((emoji) => (
        <FloatingEmoji 
          key={emoji.id} 
          emoji={emoji.emoji} 
          onComplete={() => removeEmoji(emoji.id)} 
        />
      ))}
    </div>
  );
};

export default CallRoom;
