# ICE Connection Troubleshooting Guide

## Understanding ICE Candidates

### What are ICE Candidates?

ICE (Interactive Connectivity Establishment) candidates are potential network paths that WebRTC can use to connect two peers. Think of them as "possible routes" for your video/audio data.

### Types of ICE Candidates

1. **Host Candidates**
   - Your **local network IP** address
   - Example: `192.168.1.100:54321`
   - Works only on same LAN
   - Fastest but most limited

2. **Server Reflexive (srflx) Candidates**
   - Your **public IP** from the internet's perspective
   - Discovered via STUN server
   - Example: `203.0.113.45:54321`
   - Works through many NATs

3. **Relay Candidates**
   - **TURN server** address that relays your media
   - Example: `turn.server.com:3478`
   - Slowest but works everywhere
   - Used as last resort

### The ICE Process

```
Step 1: Gather Candidates
Browser → STUN Server: "What's my public IP?"
STUN → Browser: "Your public IP is 203.0.113.45"

Step 2: Exchange Candidates
Peer A → Signaling Server → Peer B: "I can be reached at:"
  - 192.168.1.100:54321 (host)
  - 203.0.113.45:54321 (srflx)
  - turn.server.com:3478 (relay)

Step 3: Test Candidate Pairs
Browser A ↔ Browser B: Test connectivity for each combination
  ✓ 203.0.113.45 ↔ 203.0.113.46 (direct connection works!)

Step 4: Select Best Path
ICE selects the fastest working path (usually direct P2P)
```

---

## Common ICE Failures on Vercel/Production

### Issue 1: "ICE Failed" - Both Peers Behind Symmetric NAT

**Problem:**

```
User A (Corporate Network) ←→ User B (Cellular 4G)
        ↓                              ↓
   Symmetric NAT                  Symmetric NAT
        ↓                              ↓
    Can't establish direct P2P connection
```

**Why This Happens:**

- Symmetric NAT changes the port for every different destination
- STUN can't help because the public IP:port keeps changing
- Direct connection is impossible

**Solution: TURN Server**

```javascript
{
  urls: "turn:openrelay.metered.ca:443",
  username: "openrelayproject",
  credential: "openrelayproject"
}
```

TURN server acts as a relay:

```
User A → TURN Server → User B
```

### Issue 2: ICE Candidates Not Being Exchanged

**Debug Steps:**

1. **Check WebSocket Connection**

```javascript
ws.onopen = () => console.log("✅ WebSocket connected");
ws.onerror = (err) => console.error("❌ WebSocket error:", err);
ws.onclose = () => console.warn("⚠️ WebSocket closed");
```

2. **Monitor ICE Candidate Flow**

```javascript
// Sending side
pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("📤 Sending ICE candidate:", {
      type: event.candidate.type,
      address: event.candidate.address,
      port: event.candidate.port,
    });
  }
};

// Receiving side
handleIceCandidate = (candidate) => {
  console.log("📥 Received ICE candidate:", {
    type: candidate.type,
    address: candidate.address,
  });
};
```

**Expected Console Output:**

```
📤 Sending ICE candidate: { type: 'host', address: '192.168.1.100', port: 54321 }
📤 Sending ICE candidate: { type: 'srflx', address: '203.0.113.45', port: 54321 }
📤 Sending ICE candidate: { type: 'relay', address: 'turn.server.com', port: 3478 }

📥 Received ICE candidate: { type: 'host', address: '192.168.1.200' }
📥 Received ICE candidate: { type: 'srflx', address: '203.0.113.46' }

✅ ICE Connection established successfully
```

### Issue 3: ICE "Disconnected" State

**What This Means:**

- Connection was working but temporarily lost
- Could be network hiccup or changing network conditions

**Auto-Recovery Logic:**

```javascript
let reconnectTimeout;

pc.oniceconnectionstatechange = () => {
  switch (pc.iceConnectionState) {
    case "disconnected":
      console.warn("Connection lost, waiting for recovery...");
      // Give it 5 seconds to reconnect naturally
      reconnectTimeout = setTimeout(() => {
        if (pc.iceConnectionState === "disconnected") {
          console.log("Attempting ICE restart...");
          pc.restartIce();
        }
      }, 5000);
      break;

    case "connected":
    case "completed":
      console.log("✅ Connection restored");
      clearTimeout(reconnectTimeout);
      break;
  }
};
```

### Issue 4: Only Works Locally, Fails on Production

**Checklist:**

✅ **1. TURN Servers Configured?**

```javascript
// Check your rtcConfig
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // Not enough!
    {
      urls: "turn:openrelay.metered.ca:80", // ✅ Required for production
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};
```

✅ **2. WebSocket URL Uses HTTPS/WSS?**

```javascript
// ❌ Bad (works locally only)
const wsUrl = "ws://localhost:8080/ws";

// ✅ Good (works in production)
const wsUrl = import.meta.env.VITE_WS_URL; // wss://api.yourapp.com/ws
```

✅ **3. CORS Configured Properly?**

```go
// backend/main.go
router.Use(cors.New(cors.Config{
    AllowOrigins: []string{
        "http://localhost:5173",              // Local dev
        "https://yourapp.vercel.app"          // Production frontend
    },
    AllowCredentials: true,
}))
```

✅ **4. Secure Context (HTTPS)?**
WebRTC requires HTTPS in production. Chrome/Firefox block `getUserMedia()` on HTTP.

---

## Monitoring ICE Connection Health

### Add Network Stats Logging

```javascript
async function logConnectionStats() {
  const stats = await peerConnection.getStats();

  stats.forEach((report) => {
    if (report.type === "candidate-pair" && report.state === "succeeded") {
      console.log("Active Connection Path:", {
        local: report.localCandidateId,
        remote: report.remoteCandidateId,
        bytesSent: report.bytesSent,
        bytesReceived: report.bytesReceived,
        currentRoundTripTime: report.currentRoundTripTime,
      });
    }

    if (report.type === "inbound-rtp" && report.kind === "video") {
      console.log("Video Stats:", {
        packetsLost: report.packetsLost,
        jitter: report.jitter,
        bytesReceived: report.bytesReceived,
      });
    }
  });
}

// Log every 5 seconds during call
setInterval(logConnectionStats, 5000);
```

### Detect Network Quality Issues

```javascript
let lastBytesReceived = 0;

setInterval(async () => {
  const stats = await peerConnection.getStats();

  stats.forEach((report) => {
    if (report.type === "inbound-rtp" && report.kind === "video") {
      const currentBytes = report.bytesReceived;
      const bytesPerSecond = currentBytes - lastBytesReceived;
      lastBytesReceived = currentBytes;

      const kbps = (bytesPerSecond * 8) / 1000;

      if (kbps < 100) {
        console.warn("⚠️ Low bandwidth detected:", kbps, "kbps");
        // Maybe show UI warning to user
      } else {
        console.log("✅ Good connection:", kbps, "kbps");
      }
    }
  });
}, 1000);
```

---

## Production TURN Server Options

### Free/Open Source

1. **OpenRelay** (Already configured)
   - Pros: Free, no signup
   - Cons: Shared, may be slow during peak times

2. **Xirsys** (Free tier available)

   ```javascript
   {
     urls: "turn:global.turn.twilio.com:3478?transport=tcp",
     username: "your-username",
     credential: "your-credential"
   }
   ```

3. **Self-Hosted Coturn**
   - Pros: Full control, best performance
   - Cons: Requires server setup

### Configuration Example

```javascript
// Use environment variables for flexibility
const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  },
];
```

---

## Testing ICE Connectivity

### Test from Browser Console

```javascript
// Create test peer connection
const testPC = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
});

// Log all gathered candidates
testPC.onicecandidate = (event) => {
  if (event.candidate) {
    console.log(
      "Gathered candidate:",
      event.candidate.type,
      event.candidate.address,
    );
  } else {
    console.log("✅ All candidates gathered");
  }
};

// Trigger gathering
testPC.createOffer().then((offer) => testPC.setLocalDescription(offer));

// After ~5 seconds, check results:
setTimeout(() => {
  testPC.getStats().then((stats) => {
    stats.forEach((report) => {
      if (report.type === "local-candidate") {
        console.log("Local candidate:", report.candidateType, report.address);
      }
    });
  });
}, 5000);
```

**Expected Output:**

```
Gathered candidate: host 192.168.1.100
Gathered candidate: srflx 203.0.113.45    ← Public IP discovered via STUN
Gathered candidate: relay 198.51.100.20   ← TURN relay available
✅ All candidates gathered
```

**Bad Output (Missing TURN):**

```
Gathered candidate: host 192.168.1.100
Gathered candidate: srflx 203.0.113.45
✅ All candidates gathered
❌ No relay candidate - will fail on symmetric NAT!
```

---

## Quick Fixes Checklist

When ICE connection fails on production:

- [ ] ✅ Added TURN servers to `rtcConfig`
- [ ] ✅ Using WSS (not WS) for WebSocket
- [ ] ✅ Frontend and backend on HTTPS
- [ ] ✅ CORS allows production frontend origin
- [ ] ✅ ICE candidates are being sent via WebSocket
- [ ] ✅ `setRemoteDescription()` called before `addIceCandidate()`
- [ ] ✅ Candidates queued if remote description not set yet
- [ ] ✅ ICE restart implemented for `failed` state
- [ ] ✅ WebSocket stays connected during call
- [ ] ✅ Both peers in same "room" in backend

---

## Need More Help?

**Debug Logs to Share:**

1. ICE connection state transitions
2. Candidate types gathered (host/srflx/relay)
3. WebSocket message flow
4. Browser console errors
5. Network tab showing WebSocket frames

**Useful Commands:**

```bash
# Check if TURN server is reachable
telnet openrelay.metered.ca 80

# Test WebSocket connection
websocat wss://your-backend.com/ws

# Check STUN binding
stunclient stun.l.google.com 19302
```

---

**Remember:** Most ICE failures in production are due to missing TURN servers! Always configure at least one TURN server for production deployments.
