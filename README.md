# VCME - Video Call Made Easy

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [WebRTC Flow](#webrtc-flow)
- [WebSocket Signaling](#websocket-signaling)
- [Core Components](#core-components)
- [Database Schema](#database-schema)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)
- [Deployment](#deployment)

---

## Overview

VCME is a real-time video calling application built with:

- **Frontend**: React + Vite + Zustand (state management)
- **Backend**: Go + Gin (web framework) + WebSockets
- **Database**: PostgreSQL with SQLC for type-safe queries
- **Real-time Communication**: WebRTC for peer-to-peer video/audio + WebSockets for signaling

---

## Architecture

### High-Level Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Browser   │
│   (User A)  │                    │   (User B)  │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       │  WebSocket (Signaling)           │
       │         ↓                ↑        │
       │    ┌────────────────────┐        │
       │    │   Go Backend       │        │
       │    │  (WebSocket Hub)   │        │
       │    └────────────────────┘        │
       │                                   │
       │                                   │
       └───────── WebRTC (P2P) ───────────┘
           (Direct Audio/Video)
```

**Key Concepts:**

1. **Signaling Server (Go Backend)**: Coordinates connection setup but doesn't handle media
2. **WebRTC Peer Connection**: Direct browser-to-browser connection for media streams
3. **ICE (Interactive Connectivity Establishment)**: Finds the best path to connect two peers through firewalls/NATs

---

## WebRTC Flow

### Step-by-Step Connection Process

#### 1. **Call Initialization**

```javascript
// User A creates a call (Host)
POST /calls/create
→ Returns call_id

// User B joins the call (Participant)
WebSocket: send "join_room" event with call_id
```

#### 2. **Signaling & SDP Exchange**

**What is SDP?**
SDP (Session Description Protocol) describes:

- Media formats (codecs: H.264, VP8, Opus, etc.)
- Transport addresses (IP/port candidates)
- Media metadata (audio/video capabilities)

```javascript
// User A (Caller) creates an OFFER
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Send offer via WebSocket to User B
ws.send({
  event_type: "offer",
  payload: { call_id, target_id, data: offer },
});
```

```javascript
// User B (Answerer) receives offer and creates ANSWER
await peerConnection.setRemoteDescription(offer);
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

// Send answer back to User A
ws.send({
  event_type: "answer",
  payload: { call_id, target_id, data: answer },
});
```

#### 3. **ICE Candidate Exchange**

**What are ICE Candidates?**
ICE candidates are potential network addresses (IP:port combinations) where your browser can be reached. Types include:

- **host**: Your local IP address
- **srflx** (Server Reflexive): Your public IP (via STUN server)
- **relay**: Relayed address (via TURN server) when direct connection fails

```javascript
// Both peers gather and exchange ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send({
      event_type: "ice_candidate",
      payload: {
        call_id,
        target_id,
        data: event.candidate,
      },
    });
  }
};

// Receive remote ICE candidate
await peerConnection.addIceCandidate(remoteCandidate);
```

#### 4. **Connection Establishment**

```
ICE States:
├── new           → Initial state
├── checking      → Testing candidate pairs
├── connected     → ✅ Connection established
├── completed     → All checks done
├── failed        → ❌ Connection failed
├── disconnected  → ⚠️ Temporarily lost connection
└── closed        → Connection terminated
```

#### 5. **Media Flow**

```javascript
// Add local media tracks to peer connection
localStream.getTracks().forEach((track) => {
  peerConnection.addTrack(track, localStream);
});

// Receive remote media stream
peerConnection.ontrack = (event) => {
  const [remoteStream] = event.streams;
  remoteVideoElement.srcObject = remoteStream;
};
```

---

## WebSocket Signaling

### Backend: Go WebSocket Manager

Located in: `backend/internal/ws/`

#### Key Components:

**1. Manager** (`manager.go`)

- Manages all WebSocket connections
- Routes events to appropriate handlers
- Maintains room state in memory

```go
type Manager struct {
    clients   map[string]*Client  // user_id → Client
    rooms     map[string]*Room    // call_id → Room
    mu        sync.Mutex
    queries   *db.Queries
}
```

**2. Client** (`client.go`)

- Represents a single WebSocket connection
- Has read/write pumps for concurrent message handling

```go
type Client struct {
    id         string              // user_id
    conn       *websocket.Conn
    egress     chan []byte         // Outgoing messages
    RoomID     string
}
```

**3. Room** (`rooms.go`)

- Represents a call session
- Manages participants and waiting room

```go
type Room struct {
    ID                string
    HostID            string
    HostClient        *Client
    Participants      map[string]*Client
    WaitingRoom       map[string]*Client
    ParticipantsList  []string
    mu                sync.Mutex
}
```

### Event Types

| Event                     | Direction          | Purpose                         |
| ------------------------- | ------------------ | ------------------------------- |
| `join_room`               | Client→Server      | Request to join a call          |
| `host_joined_room`        | Server→Client      | Notify host successfully joined |
| `waiting_room`            | Server→Client      | User placed in waiting room     |
| `new_participant_request` | Server→Host        | New user wants to join          |
| `accept_participant`      | Host→Server        | Host accepts user               |
| `accepted_into_room`      | Server→Participant | Participant accepted            |
| `decline_participant`     | Host→Server        | Host declines user              |
| `declined_from_room`      | Server→Participant | Participant declined            |
| `offer`                   | Peer→Server→Peer   | WebRTC offer (SDP)              |
| `answer`                  | Peer→Server→Peer   | WebRTC answer (SDP)             |
| `ice_candidate`           | Peer→Server→Peer   | ICE candidate                   |
| `leave_room`              | Client→Server      | Leave the call                  |

### Event Flow Example: User Joining Call

```
User A (Host)                Server                  User B (Participant)
     │                          │                           │
     │─── join_room ──────────→│                           │
     │                          │                           │
     │←── host_joined_room ────│                           │
     │                          │                           │
     │                          │←─── join_room ────────────│
     │                          │                           │
     │                          │─── waiting_room ─────────→│
     │                          │                           │
     │←─ new_participant_req ──│                           │
     │                          │                           │
     │─ accept_participant ────→│                           │
     │                          │                           │
     │                          │─ accepted_into_room ─────→│
     │                          │                           │
     │←─ new_participant ──────│                           │
     │                          │                           │
```

---

## Core Components

### Frontend State Management (Zustand)

**1. CallStore** (`client/src/store/CallStore.js`)

```javascript
{
    currentCall: string,           // Current call ID
    isParticipant: boolean,        // Is user in call?
    isWaitingRoom: boolean,        // In waiting room?
    callParticipants: string[],    // List of participant IDs
    targetUserId: string,          // Current WebRTC peer
    newUserInWaitlist: [],         // Pending join requests
    callLogs: []                   // Call history
}
```

**2. VideoStore** (`client/src/store/VideoStore.js`)

```javascript
{
    localStream: MediaStream,      // User's camera/mic
    remoteStream: MediaStream,     // Peer's camera/mic
    isMicOn: boolean,
    isVideoOn: boolean
}
```

**3. WebsocketStore** (`client/src/store/WebsocketStore.jsx`)

```javascript
{
    ws: WebSocket,
    isConnected: boolean,
    send: (message) => void,       // Send JSON message
    connect: () => void,
    disconnect: () => void
}
```

**4. AuthStore** (`client/src/store/AuthStore.js`)

```javascript
{
    user: { id, email, name },
    isAuthenticated: boolean,
    login: (credentials) => Promise,
    logout: () => void
}
```

### Frontend WebRTC Manager

Located in: `client/src/lib/webrtcManager.js`

**Key Functions:**

```javascript
// Initialize local media
setUpLocalMedia() → Promise<MediaStream>

// Create WebRTC offer (caller/initiator)
createOffer() → Promise<RTCSessionDescriptionInit>

// Create WebRTC answer (answerer)
createAnswer(offer) → Promise<RTCSessionDescriptionInit>

// Handle received answer
handleAnswer(answer) → Promise<void>

// Add ICE candidate
addIceCandidate(candidate) → Promise<void>

// Reset peer connection
resetPeerConnection() → void
```

**RTCPeerConnection Configuration:**

```javascript
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // Google STUN
    { urls: "stun:stun1.l.google.com:19302" }, // Google STUN backup
    {
      urls: "turn:openrelay.metered.ca:80", // TURN server
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10, // Pre-gather candidates
};
```

**Why TURN Servers?**

- STUN servers help discover public IP but can't traverse strict NATs
- TURN servers relay media when direct P2P connection fails
- Essential for production deployments (restrictive networks)

---

## Database Schema

### Core Tables

**1. users**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**2. calls**

```sql
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES users(id),
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**3. call_participants**

```sql
CREATE TABLE call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(call_id, user_id)
);
```

**4. call_logs**

```sql
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    call_id UUID REFERENCES calls(id),
    call_title TEXT,
    duration TEXT,
    participant_count INTEGER,
    time TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### SQLC Queries

SQLC generates type-safe Go code from SQL queries.

Example (`backend/internal/db/queries/calls.queries.sql`):

```sql
-- name: GetHostIDByCallID :one
SELECT host_id FROM calls WHERE id = $1;

-- name: AddUserToCallParticipants :one
INSERT INTO call_participants (call_id, user_id)
VALUES ($1, $2)
RETURNING *;

-- name: GetCallLogsByUserID :many
SELECT * FROM call_logs
WHERE user_id = $1
ORDER BY created_at DESC;
```

Generated Go:

```go
func (q *Queries) GetHostIDByCallID(ctx context.Context, id uuid.UUID) (uuid.UUID, error)
func (q *Queries) AddUserToCallParticipants(ctx context.Context, arg AddUserToCallParticipantsParams) (CallParticipant, error)
func (q *Queries) GetCallLogsByUserID(ctx context.Context, userID uuid.UUID) ([]CallLog, error)
```

---

## Common Issues & Troubleshooting

### 🔴 ICE Connection Failed / Disconnected on Vercel

**Symptoms:**

- Works locally but fails in production
- "ICE connection state: failed" in console
- Video sometimes connects, sometimes doesn't

**Root Causes:**

1. **Symmetric NAT**: Strict firewalls block direct P2P
2. **Missing TURN servers**: STUN alone can't traverse strict NATs
3. **WebSocket connection drops**: Interrupts ICE candidate exchange

**Solutions:**

✅ **1. Add TURN Servers** (Already implemented)

```javascript
{
  urls: "turn:openrelay.metered.ca:80",
  username: "openrelayproject",
  credential: "openrelayproject"
}
```

✅ **2. Increase ICE Candidate Pool**

```javascript
iceCandidatePoolSize: 10;
```

✅ **3. Implement ICE Restart**

```javascript
pc.oniceconnectionstatechange = () => {
  if (pc.iceConnectionState === "failed") {
    pc.restartIce(); // Attempt reconnection
  }
};
```

✅ **4. WebSocket Reconnection**
Ensure WebSocket stays connected during call:

```javascript
ws.onclose = () => {
  setTimeout(() => connect(), 3000); // Reconnect after 3s
};
```

### 🔴 "Sender not in room" Error

**Cause**: User sends WebRTC signal before being accepted into room

**Solution**: Wait for `accepted_into_room` event before signaling

```javascript
// In handleAcceptedIntoRoom
useCallStore.setState({ isParticipant: true });

// Only send offers if isParticipant
if (useCallStore.getState().isParticipant) {
  const offer = await createOffer();
  // Send offer...
}
```

### 🔴 Remote Stream Not Displaying

**Checklist:**

1. ✅ Local stream added to peer connection?

```javascript
localStream.getTracks().forEach((track) => {
  peerConnection.addTrack(track, localStream);
});
```

2. ✅ `ontrack` handler set?

```javascript
pc.ontrack = (event) => {
  remoteVideoElement.srcObject = event.streams[0];
};
```

3. ✅ Video element has `autoplay` and `playsInline`?

```jsx
<video autoPlay playsInline muted={false} ref={remoteVideoRef} />
```

4. ✅ Check ICE connection state in console

### 🔴 CORS Errors

**Backend**: Enable CORS in `main.go`

```go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:5173", "https://yourapp.vercel.app"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Content-Type", "Authorization"},
    AllowCredentials: true,
}))
```

**WebSocket**: Ensure proper upgrade headers

```go
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true  // Configure properly for production
    },
}
```

---

## Deployment

### Backend (Railway/Render/Fly.io)

**Environment Variables:**

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=8080
JWT_SECRET=your-secret-key
FRONTEND_URL=https://yourapp.vercel.app
```

**Start Command:**

```bash
go run main.go
```

### Frontend (Vercel)

**Environment Variables:**

```bash
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=wss://your-backend.railway.app/ws
```

**Build Settings:**

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Database (Supabase/Neon/Railway)

1. Create PostgreSQL instance
2. Run migrations:

```bash
psql $DATABASE_URL < migrations/001_create_tables.sql
```

3. Generate SQLC code:

```bash
cd backend
sqlc generate
```

---

## Performance Tips

### 1. **Media Constraints**

Optimize video quality for bandwidth:

```javascript
const constraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
};
```

### 2. **Codec Selection**

Prefer VP9 (better quality) or H.264 (compatibility):

```javascript
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
  voiceActivityDetection: true,
};
```

### 3. **Connection Monitoring**

Track stats for debugging:

```javascript
setInterval(async () => {
  const stats = await peerConnection.getStats();
  stats.forEach((report) => {
    if (report.type === "inbound-rtp" && report.kind === "video") {
      console.log("Video bitrate:", report.bytesReceived);
    }
  });
}, 1000);
```

---

## Learning Resources

### WebRTC

- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)

### Go + WebSockets

- [Gorilla WebSocket](https://github.com/gorilla/websocket)
- [Go by Example: Goroutines](https://gobyexample.com/goroutines)

### SQLC

- [SQLC Documentation](https://docs.sqlc.dev/)

---

## License

MIT

---

## Contributing

Pull requests welcome! Please ensure:

1. Code is tested locally and on staging
2. Go code is formatted with `gofmt`
3. Frontend follows ESLint rules
4. Database migrations are reversible

---

**Built with tears by the lupo!**
