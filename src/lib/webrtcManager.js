import useCallStore from "../store/CallStore";
import useVideoStore from "../store/VideoStore";
import useWebsocketStore from "../store/WebsocketStore";

export const setUpLocalMedia = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return stream;
  } catch (error) {
    console.error("getUserMedia error:", error);
  }
};

// ─────────────────────────────────────────────────────────────
// FIX #1: Replace unreliable free OpenRelay TURN with
//         Metered.ca's free STUN + a set of well-known public
//         STUN servers as the first line of defence, and use
//         Metered TURN credentials that are actually live.
//
//         IMPORTANT FOR PRODUCTION: sign up for a free account
//         at https://www.metered.ca/tools/openrelay/ and replace
//         the placeholder credential below with your own.
//         Free tier gives 50 GB/mo — more than enough to start.
//
//         Alternatively, drop in Twilio TURN credentials via
//         their free trial (https://www.twilio.com/try-twilio).
// ─────────────────────────────────────────────────────────────
const METERED_API_KEY = import.meta.env.VITE_METERED_API_KEY || "";

// Fetch short-lived TURN credentials from Metered if an API key is
// provided, otherwise fall back to the static (less reliable) config.
let cachedIceServers = null;
let cacheExpiry = 0;

const getIceServers = async () => {
  // Return cached servers if still fresh (credentials last 1 day; we
  // refresh every 12 h to stay safe)
  if (cachedIceServers && Date.now() < cacheExpiry) {
    return cachedIceServers;
  }

  if (METERED_API_KEY) {
    try {
      const res = await fetch(
        `https://vcme.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
      );
      if (res.ok) {
        const servers = await res.json();
        cachedIceServers = servers;
        cacheExpiry = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
        console.log("✅ Fetched fresh TURN credentials from Metered");
        return servers;
      }
    } catch (e) {
      console.warn("⚠️  Could not fetch Metered TURN credentials, falling back to static config", e);
    }
  }

  // ── Static fallback (works without a Metered account) ──────────
  // These are multiple STUN servers (free, reliable) + a backup TURN
  // from Metered's open relay. The open relay is rate-limited but
  // better than nothing while you set up a proper account.
  const fallback = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:standard.relay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:standard.relay.metered.ca:80?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:standard.relay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turns:standard.relay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  cachedIceServers = fallback;
  cacheExpiry = Date.now() + 60 * 60 * 1000; // 1 hour for fallback
  return fallback;
};

// ─────────────────────────────────────────────────────────────
// FIX #2: Stop using a module-level singleton RTCPeerConnection.
//         Instead, keep a mutable reference so resetPeerConnection
//         truly replaces it without leaving dangling event handlers.
// ─────────────────────────────────────────────────────────────
let pc = null; // the live RTCPeerConnection
let candidateQueue = [];
let isRemoteDescriptionSet = false;
let iceRestartTimeout = null;

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────
const addLocalTracks = () => {
  const localStream = useVideoStore.getState().localStream;
  if (!localStream || !pc) return;

  localStream.getTracks().forEach((track) => {
    const alreadyAdded = pc.getSenders().some((s) => s.track === track);
    if (!alreadyAdded) {
      console.log("➕ Adding local track:", track.kind);
      pc.addTrack(track, localStream);
    }
  });
};

const processQueuedCandidates = async () => {
  console.log(`♻️  Processing ${candidateQueue.length} queued ICE candidates`);
  while (candidateQueue.length > 0) {
    const candidate = candidateQueue.shift();
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("⚠️  Failed to add queued ICE candidate:", e);
    }
  }
};

// ─────────────────────────────────────────────────────────────
// FIX #3: Centralise peer-event wiring so every new RTCPeer
//         Connection (after a reset) gets the same handlers.
// ─────────────────────────────────────────────────────────────
const wireEvents = (connection) => {
  connection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    console.log("🎥 RECEIVED REMOTE STREAM:", remoteStream.id);
    useVideoStore.getState().setRemoteStream(remoteStream);
  };

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      const callId = useCallStore.getState().currentCall;
      const targetId = useCallStore.getState().targetUserId;
      console.log(`📤 Sending ICE candidate [${event.candidate.type}] to:`, targetId);
      useWebsocketStore.getState().send({
        event_type: "ice_candidate",
        payload: {
          call_id: callId,
          target_id: targetId,
          data: event.candidate,
        },
      });
    } else {
      console.log("✅ All ICE candidates gathered");
    }
  };

  // ── FIX #3: Proper ICE restart ─────────────────────────────
  // restartIce() alone is not enough — you must also renegotiate
  // (create + send a new offer). We do that here automatically.
  connection.oniceconnectionstatechange = () => {
    const state = connection.iceConnectionState;
    console.log("🧊 ICE state:", state);

    clearTimeout(iceRestartTimeout);

    if (state === "failed") {
      console.error("❌ ICE failed — restarting in 2 s");
      iceRestartTimeout = setTimeout(async () => {
        // Only restart if this is still the active connection
        if (connection !== pc) return;

        try {
          connection.restartIce();
          // Re-offer so the new ICE credentials are exchanged
          const offer = await connection.createOffer({ iceRestart: true });
          await connection.setLocalDescription(offer);

          const callId = useCallStore.getState().currentCall;
          const targetId = useCallStore.getState().targetUserId;

          if (callId && targetId) {
            useWebsocketStore.getState().send({
              event_type: "offer",
              payload: { call_id: callId, target_id: targetId, data: offer },
            });
            console.log("🔄 ICE restart offer sent to:", targetId);
          }
        } catch (e) {
          console.error("ICE restart failed:", e);
        }
      }, 2000);
    }

    if (state === "disconnected") {
      // Give it 5 s to self-heal before escalating to a restart
      iceRestartTimeout = setTimeout(() => {
        if (connection.iceConnectionState === "disconnected") {
          console.warn("⚠️  Still disconnected after 5 s, triggering ICE restart");
          connection.dispatchEvent(new Event("iceconnectionstatechange")); // re-run handler
        }
      }, 5000);
    }

    if (state === "connected" || state === "completed") {
      console.log("✅ ICE connection established!");
    }
  };

  connection.onconnectionstatechange = () => {
    console.log("🔗 Connection state:", connection.connectionState);
  };

  connection.onsignalingstatechange = () => {
    console.log("📡 Signaling state:", connection.signalingState);
  };
};

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** Call this once on app start (or lazily before the first offer) */
export const initPeerConnection = async () => {
  const iceServers = await getIceServers();
  const rtcConfig = { iceServers, iceCandidatePoolSize: 10 };

  if (pc) {
    pc.close();
  }

  pc = new RTCPeerConnection(rtcConfig);
  candidateQueue = [];
  isRemoteDescriptionSet = false;
  wireEvents(pc);
  console.log("🆕 RTCPeerConnection created");
  return pc;
};

export const createOffer = async () => {
  if (!pc) await initPeerConnection();
  addLocalTracks();

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("📝 Created and set local offer");
    return offer;
  } catch (error) {
    console.error("❌ Error creating offer:", error);
  }
};

export const createAnswer = async (offer) => {
  if (!pc) await initPeerConnection();
  addLocalTracks();

  try {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    isRemoteDescriptionSet = true;
    console.log("📝 Set remote offer, creating answer...");

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await processQueuedCandidates();
    return answer;
  } catch (error) {
    console.error("❌ Error creating answer:", error);
  }
};

export const handleAnswer = async (answer) => {
  if (!pc) return;

  try {
    // Guard against setting remote description when signalingState is wrong
    if (pc.signalingState !== "have-local-offer") {
      console.warn(
        `⚠️  Ignoring answer in unexpected signaling state: ${pc.signalingState}`
      );
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    isRemoteDescriptionSet = true;
    console.log("✅ Remote answer set successfully");

    await processQueuedCandidates();
  } catch (error) {
    console.error("❌ Error setting remote answer:", error);
  }
};

export const addIceCandidate = async (candidate) => {
  if (!candidate) return;

  if (!isRemoteDescriptionSet || !pc) {
    console.log("📦 Queuing ICE candidate (remote desc not set yet)");
    candidateQueue.push(candidate);
    return;
  }

  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    // Benign error when connection is already closed
    if (!error.message.includes("closed")) {
      console.error("❌ Error adding ICE candidate:", error);
    }
  }
};

export const resetPeerConnection = () => {
  console.log("🔁 Resetting peer connection");
  clearTimeout(iceRestartTimeout);

  if (pc) {
    // Remove all event handlers before closing to prevent stale callbacks
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.oniceconnectionstatechange = null;
    pc.onconnectionstatechange = null;
    pc.onsignalingstatechange = null;
    pc.close();
    pc = null;
  }

  candidateQueue = [];
  isRemoteDescriptionSet = false;
  cachedIceServers = null; // force a fresh credential fetch on next call
};

// Expose for debugging in the browser console:  window.__vcme_pc
if (typeof window !== "undefined") {
  Object.defineProperty(window, "__vcme_pc", {
    get: () => pc,
    configurable: true,
  });
}