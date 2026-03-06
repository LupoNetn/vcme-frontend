import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { Mic, Video, PhoneOff, MicOff, VideoOff, User, Smile, ScreenShareIcon, ScreenShareOff, ScreenShareOffIcon, SwitchCamera, MessageSquare, Send, X } from "lucide-react";
import WaitingRoomApproval from "../components/WaitingRoomApproval";
import useWebsocketStore from "../store/WebsocketStore.jsx";
import useAuthStore from "../store/AuthStore";
import useCallStore from "../store/CallStore";
import useVideoStore from "../store/VideoStore.js";
import useCall from "../hooks/useCall";
import { replaceTracks, setUpScreenMedia } from "../lib/webrtcManager.js";
import toast from "react-hot-toast";

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
  const chatMessages = useCallStore((state) => state.chatMessages);
  const addChatMessage = useCallStore((state) => state.addChatMessage);
  const clearChatMessages = useCallStore((state) => state.clearChatMessages);
  const localStream = useVideoStore((state) => state.localStream);
  const remoteStream = useVideoStore((state) => state.remoteStream);
  const screenStream = useVideoStore((state) => state.screenStream);
  const setScreenStream = useVideoStore((state) => state.setScreenStream)
  const { findCallByLink } = useCall();
  const remoteStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null)
  const { endCall } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [shareScreen, setShareScreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);



  const emoji = [
    "😀", "😂", "🤔", "😎", "😭", "😡", "👍", "👎",
    "❤️", "🔥",
  ];

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!showChat && chatMessages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [chatMessages]);

  // Reset unread badge when chat is opened
  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  // Clear messages when leaving the call
  useEffect(() => {
    return () => clearChatMessages();
  }, []);

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text || !currentCall) return;
    const callIdToUse = typeof currentCall === "object" ? currentCall?.id : currentCall;
    send({
      event_type: "send_chat_message",
      payload: {
        call_id: callIdToUse,
        participant_id: user.id,
        message: text,
      },
    });
    setChatInput("");
    chatInputRef.current?.focus();
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };





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
    const hasTouch = window.matchMedia("(pointer: coarse)").matches;
    const hasUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Require BOTH a mobile UA and a touch-only pointer so desktop DevTools
    // emulation (which keeps a mouse pointer) doesn't falsely hide screen share.
    setIsMobile(hasTouch && hasUA);
  }, []);

  useEffect(() => {
    if (screenStream) {
      localStreamRef.current.srcObject = screenStream
    } else if (localStream && localStreamRef.current) {
      localStreamRef.current.srcObject = localStream;
    }
  }, [localStream, screenStream]);
  
  const toggleSharescreenState = () => {
    setShareScreen(prev => !prev)
  }

  const handleShareScreen = async () => {
    if(isMobile) {
      toast.error("screen sharing is not available on all mobile browsers, to access it use a desktop browser...")
      return
    }
    toggleSharescreenState()
    const screen = await setUpScreenMedia()
    setScreenStream(screen)

    screenTrackRef.current = screen.getVideoTracks()[0]
    replaceTracks(screenTrackRef.current)
  }

  const stopShareScreen = async () => {
    toggleSharescreenState()
    const cameraTrack = localStream.getVideoTracks()[0]
    replaceTracks(cameraTrack)

     setScreenStream(null)
      if (localStreamRef.current) {
       localStreamRef.current.srcObject = localStream
    }
  }

  const switchCamera = async () => {
    if (!localStream || isSwitchingCamera) return;
    setIsSwitchingCamera(true);

    const nextFacing = facingMode === "user" ? "environment" : "user";

    // Grab the current video track BEFORE we do anything
    const oldVideoTrack = localStream.getVideoTracks()[0];

    try {
      // ── CRITICAL: stop the old track first ───────────────────────────────
      // Mobile OSes (Android/iOS) lock the camera hardware to one stream at a
      // time. If the old track is still running when getUserMedia fires, it
      // throws NotReadableError / OverconstrainedError regardless of constraints.
      if (oldVideoTrack) {
        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop(); // releases the hardware lock
      }

      // ── Request the new camera ────────────────────────────────────────────
      // Use a soft facingMode hint — no "exact" — so the browser can fall back
      // gracefully if the facing mode isn't available instead of throwing.
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Add the new track to the existing local stream
      localStream.addTrack(newVideoTrack);

      // Update the local PIP preview
      if (localStreamRef.current) {
        localStreamRef.current.srcObject = localStream;
      }

      // Send the new track to the remote peer (no renegotiation needed)
      replaceTracks(newVideoTrack);

      // Persist state only on success
      setFacingMode(nextFacing);

    } catch (err) {
      console.error("switchCamera error:", err.name, err.message);

      // If the new camera failed to open, restore the old track so the call
      // continues with the previous camera rather than losing video entirely.
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }, // go back to the previous camera
          audio: false,
        });
        const fallbackTrack = fallbackStream.getVideoTracks()[0];
        localStream.addTrack(fallbackTrack);
        if (localStreamRef.current) localStreamRef.current.srcObject = localStream;
        replaceTracks(fallbackTrack);
      } catch (_) { /* nothing we can do — video will be blank */ }

      toast.error("Could not switch camera.");
    } finally {
      setIsSwitchingCamera(false);
    }
  };

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
    console.log("testing");
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

      {/* Top Bar - Minimal Info & Chat Toggle */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Call Info — Now at the top-left corner */}
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="bg-black/20 p-1 px-2 rounded-full backdrop-blur-sm border border-white/5 flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
              V
            </div>
            <p className="text-white/90 text-xs font-mono">
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

        {/* Chat button — Now at the top-right corner */}
        <div className="pointer-events-auto">
          <button
            onClick={() => { setShowChat(prev => !prev); setShowEmojiPanel(false); }}
            title="In-call messages"
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 ${
              showChat
                ? "bg-white text-black shadow-lg"
                : "bg-black/30 backdrop-blur-xl border border-white/10 text-white hover:bg-black/50"
            }`}
          >
            <MessageSquare size={16} />
            <span className="text-xs font-semibold">Chat</span>
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>



      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-1 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 z-30 flex items-center gap-3 md:gap-6 shadow-2xl">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-all active:scale-90 ${isMuted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
          title="Toggle Mic"
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-all active:scale-90 ${isVideoOff ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
          title="Toggle Camera"
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        
        <button
          onClick={() => handleLeaveRoom()}
          className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-all active:scale-90 text-white shadow-lg shadow-red-500/30"
          title="End Call"
        >
          <PhoneOff size={24} fill="currentColor" />
        </button>


        {/* Screen share — desktop only */}
        {!isMobile && (
          <button
           onClick={shareScreen ? stopShareScreen : handleShareScreen}
           className={`p-3 rounded-full transition-all active:scale-90 ${shareScreen ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
           title="Share Screen"
          >
            {shareScreen ? <ScreenShareOffIcon size={20}/> : <ScreenShareIcon size={20}/>}
          </button>
        )}

        {/* Switch camera — mobile only */}
        {isMobile && (
          <button
            onClick={switchCamera}
            disabled={isSwitchingCamera}
            className={`p-3 rounded-full transition-all active:scale-90 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed ${
              isSwitchingCamera ? "animate-spin" : ""
            }`}
            title="Switch Camera"
          >
            <SwitchCamera size={20} />
          </button>
        )}

        <button 
         onClick={toggleEmojiPanel}
         className={`p-3 rounded-full transition-all duration-300 active:scale-90 ${showEmojiPanel ? "bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/10 text-white hover:bg-white/20"}`}
         title="Send Emoji"
        >
          <Smile size={20} className={showEmojiPanel ? "animate-bounce" : ""} />
        </button>
      </div>


      {showEmojiPanel && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-fit p-1.5 md:p-2 bg-neutral-900/80 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 z-40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-300">
          <div className="flex flex-wrap items-center justify-center gap-0.5 md:gap-1">
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
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xl md:text-2xl rounded-full hover:bg-white/10 transition-all duration-200 active:scale-125 origin-center"
              >
                <span className="drop-shadow-md">{emojiChar}</span>
              </button>
            ))}
          </div>
          
          {/* Subtle indicator triangle - Hidden on very small screens if it looks weird */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900/80 border-r border-b border-white/20 rotate-45 backdrop-blur-2xl hidden md:block" />
        </div>
      )}

      {/* ── In-call Chat Panel (Google Meet style) ── */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 md:w-96 z-40 flex flex-col"
          style={{ background: "rgba(10,12,22,0.97)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-emerald-400" />
              <span className="text-white font-semibold text-sm">In-call messages</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <MessageSquare size={32} className="text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">No messages yet.</p>
                <p className="text-slate-600 text-xs mt-1">Messages are visible only during this call.</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[11px] text-slate-500 mb-1 ml-1">{msg.sender_name}</span>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-emerald-600 text-white rounded-tr-sm"
                          : "bg-white/10 text-white rounded-tl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-slate-600 mt-1 mx-1">{msg.sent_at}</span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-white/8">
            <div
              className="flex items-end gap-2 rounded-2xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Send a message…"
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm text-white placeholder:text-slate-600 outline-none leading-relaxed max-h-24"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                className="p-1.5 rounded-xl text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-2">Messages are not saved after the call ends</p>
          </div>
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
