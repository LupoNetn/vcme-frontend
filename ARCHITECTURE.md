# VCME Architecture & Data Flow

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                         │
│                           Hosted on Vercel (HTTPS/WSS)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  CallStore   │  │  VideoStore  │  │   AuthStore  │  │ WebsocketStore│   │
│  │              │  │              │  │              │  │               │   │
│  │ - currentCall│  │ - localStream│  │ - user       │  │ - ws: WebSocket│  │
│  │ - isParticip.│  │ - remoteStream│ │ - isAuth     │  │ - send()     │   │
│  │ - callLogs   │  │ - isMicOn    │  │ - login()    │  │ - connect()  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                  │                  │          │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                      │                                       │
│  ┌───────────────────────────────────▼────────────────────────────────┐    │
│  │                        Components Layer                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │CallRoom  │  │CallLogs  │  │  Login   │  │Dashboard │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌───────────────────────────────────▼────────────────────────────────┐    │
│  │                      WebRTC Manager                                  │    │
│  │                                                                       │    │
│  │  - createOffer()                                                     │    │
│  │  - createAnswer()                                                    │    │
│  │  - handleAnswer()                                                    │    │
│  │  - addIceCandidate()                                                 │    │
│  │  - RTCPeerConnection ◄──────────────────────┐                       │    │
│  │    ├─ iceServers (STUN/TURN)                │                       │    │
│  │    ├─ ontrack (receive remote stream)       │                       │    │
│  │    ├─ onicecandidate (send candidates)      │                       │    │
│  │    └─ oniceconnectionstatechange            │                       │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/HTTPS (REST API)
                                      │ WebSocket (WSS - Signaling)
                                      │ WebRTC (P2P - Media)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Go + Gin Framework)                          │
│                       Hosted on Railway/Render (HTTPS/WSS)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         HTTP REST API                               │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │    │
│  │  │   Auth     │  │   Calls    │  │   Users    │  │  CallLogs  │  │    │
│  │  │  Handler   │  │   Handler  │  │   Handler  │  │   Handler  │  │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │    │
│  │  POST /login    POST /calls      GET /users     GET /logs/:id    │    │
│  │  POST /signup   GET /calls/:id                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌───────────────────────────────────▼────────────────────────────────┐    │
│  │                    WebSocket Manager                                │    │
│  │                                                                      │    │
│  │  Manager {                                                          │    │
│  │    clients: map[user_id]*Client   ← All connected users           │    │
│  │    rooms: map[call_id]*Room       ← Active call sessions          │    │
│  │  }                                                                  │    │
│  │                                                                      │    │
│  │  Room {                                                             │    │
│  │    HostID: string                                                   │    │
│  │    Participants: map[user_id]*Client                               │    │
│  │    WaitingRoom: map[user_id]*Client                                │    │
│  │  }                                                                  │    │
│  │                                                                      │    │
│  │  Client {                                                           │    │
│  │    id: user_id                                                      │    │
│  │    conn: *websocket.Conn                                           │    │
│  │    egress: chan []byte     ← Outgoing message queue               │    │
│  │  }                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌───────────────────────────────────▼────────────────────────────────┐    │
│  │                     WebSocket Event Handlers                        │    │
│  │                                                                      │    │
│  │  - handleJoinRoom()         → Add to room/waiting room             │    │
│  │  - handleAcceptParticipant()→ Move from waiting to participants    │    │
│  │  - handleOffer()            → Forward WebRTC offer                 │    │
│  │  - handleAnswer()           → Forward WebRTC answer                │    │
│  │  - handleICECandidate()     → Forward ICE candidates               │    │
│  │  - handleLeaveRoom()        → Remove from room                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌───────────────────────────────────▼────────────────────────────────┐    │
│  │                      Database Service (SQLC)                        │    │
│  │                                                                      │    │
│  │  Queries {                                                          │    │
│  │    GetUserById(uuid)                                                │    │
│  │    CreateCall(host_id, title)                                      │    │
│  │    GetHostIDByCallID(call_id)                                      │    │
│  │    AddUserToCallParticipants(call_id, user_id)                     │    │
│  │    GetCallLogsByUserID(user_id)                                    │    │
│  │  }                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       │ PostgreSQL Protocol
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                                 │
│                      Hosted on Supabase/Neon/Railway                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │    users     │  │    calls     │  │call_partici  │  │  call_logs   │   │
│  │              │  │              │  │   pants      │  │              │   │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │   │
│  │ email        │  │ host_id (FK) │  │ call_id (FK) │  │ user_id (FK) │   │
│  │ name         │  │ title        │  │ user_id (FK) │  │ call_id (FK) │   │
│  │ password_hash│  │ created_at   │  │ joined_at    │  │ duration     │   │
│  │ created_at   │  └──────────────┘  └──────────────┘  │ participants │   │
│  └──────────────┘                                       │ created_at   │   │
│                                                          └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │   STUN Servers       │  │   TURN Servers       │                        │
│  │                      │  │                      │                        │
│  │ Google STUN          │  │ OpenRelay Metered    │                        │
│  │ stun.l.google.com    │  │ openrelay.metered.ca │                        │
│  │                      │  │                      │                        │
│  │ Purpose:             │  │ Purpose:             │                        │
│  │ - Discover public IP │  │ - Relay media when   │                        │
│  │ - NAT type detection │  │   P2P fails          │                        │
│  └──────────────────────┘  └──────────────────────┘                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Call Flow Sequence Diagram

### Scenario: User B Joins User A's Call

```
User A (Host)    Frontend A    Backend WS    Backend DB    Frontend B    User B (Participant)
     │                │             │             │             │                │
     │── Create Call ─────────────────────────────▶│            │                │
     │                │             │             │             │                │
     │                │             │◀─ INSERT ───┤             │                │
     │                │             │   calls                   │                │
     │                │             │             │             │                │
     │◀─ call_id ─────────────────────────────────┤             │                │
     │                │             │             │             │                │
     │── join_room ──▶│             │             │             │                │
     │   (call_id)    │             │             │             │                │
     │                │             │             │             │                │
     │                │── WS: ──────▶│             │             │                │
     │                │  join_room   │             │             │                │
     │                │             │             │             │                │
     │                │             │─ GetHostID ─▶│             │                │
     │                │             │◀────────────┤             │                │
     │                │             │             │             │                │
     │                │             │─ Create Room in Memory    │                │
     │                │             │  (Manager.rooms[call_id]) │                │
     │                │             │             │             │                │
     │                │◀─ WS: ──────┤             │             │                │
     │◀─ Host Joined ─┤ host_joined_room          │             │                │
     │                │             │             │             │                │
     │─ getUserMedia()│             │             │             │                │
     │  (camera/mic)  │             │             │             │                │
     │                │             │             │             │                │
     │                │             │             │             │── join_room ──▶│
     │                │             │             │             │   (call_id)    │
     │                │             │             │             │                │
     │                │             │             │             │◀─ WS: ────────┤
     │                │             │             │             │  join_room     │
     │                │             │             │             │                │
     │                │             │◀─ WS: ──────────────────────────────────────┤
     │                │             │  join_room                │                │
     │                │             │             │             │                │
     │                │             │─ Add to WaitingRoom       │                │
     │                │             │             │             │                │
     │                │             │─ WS: ──────────────────────▶│                │
     │                │             │ waiting_room│             │                │
     │                │             │             │             │                │
     │◀─ New Participant Request ──┤             │             │                │
     │   (name: "User B")           │             │             │                │
     │                │             │             │             │                │
     │── Accept ──────▶│             │             │             │                │
     │   User B        │             │             │             │                │
     │                │             │             │             │                │
     │                │── WS: ──────▶│             │             │                │
     │                │ accept_partic│             │             │                │
     │                │             │             │             │                │
     │                │             │─ INSERT ────▶│             │                │
     │                │             │  call_partic │             │                │
     │                │             │◀────────────┤             │                │
     │                │             │             │             │                │
     │                │             │─ Move to Participants     │                │
     │                │             │  (delete from waiting)    │                │
     │                │             │             │             │                │
     │◀─ New Participant ───────────┤             │             │                │
     │                │             │             │             │                │
     │                │             │─ WS: ──────────────────────▶│                │
     │                │             │accepted_into_room           │                │
     │                │             │             │             │                │
     │                │             │             │             │─ getUserMedia()│
     │                │             │             │             │                │
     │                │             │             │             │◀───────────────┤
     │                │             │             │             │ localStream    │
     │                │             │             │             │                │
     │                │             │◀─ WS: ──────────────────────────────────────┤
     │                │             │ get_initiator               │                │
     │                │             │             │             │                │
     │                │             │─ WS: ──────────────────────▶│                │
     │                │             │initiator_res│             │                │
     │                │             │(target: A)  │             │                │
     │                │             │             │             │                │
     │                │             │◀─ WS: ──────────────────────────────────────┤
     │                │             │  offer      │             │                │
     │                │             │  (SDP)      │             │                │
     │                │             │             │             │                │
     │◀─ Received Offer ────────────┤             │             │                │
     │  (from User B)  │             │             │             │                │
     │                │             │             │             │                │
     │─ setRemoteDesc(offer)        │             │             │                │
     │─ createAnswer() │             │             │             │                │
     │                │             │             │             │                │
     │── WS: answer ──▶│             │             │             │                │
     │   (SDP)         │             │             │             │                │
     │                │             │             │             │                │
     │                │── WS: ──────▶│             │             │                │
     │                │  answer      │             │             │                │
     │                │             │             │             │                │
     │                │             │─ WS: ──────────────────────▶│                │
     │                │             │  answer     │             │                │
     │                │             │             │             │                │
     │                │             │             │             │─ setRemoteDesc │
     │                │             │             │             │   (answer)     │
     │                │             │             │             │                │
     │── ICE Candidate▶│             │             │             │                │
     │                │── WS: ──────▶│             │             │                │
     │                │ice_candidate │             │             │                │
     │                │             │─ WS: ──────────────────────▶│                │
     │                │             │ice_candidate│             │                │
     │                │             │             │             │─ addIceCandidate│
     │                │             │             │             │                │
     │                │             │◀─ WS: ──────────────────────────────────────┤
     │                │             │ice_candidate│             │                │
     │◀─ ICE Candidate─────────────┤             │             │                │
     │                │             │             │             │                │
     │─ addIceCandidate             │             │             │                │
     │                │             │             │             │                │
     │                ICE Connection Testing...                                  │
     │◀───────────────────────── Direct P2P Connection ──────────────────────────┤
     │                │             │             │             │                │
     │◀════════════════ WebRTC Media Stream (Audio/Video) ═════════════════════▶│
     │                │             │             │             │                │
     │                │             │             │             │                │
```

### Legend:

- `─▶` : HTTP/WebSocket request
- `◀─` : HTTP/WebSocket response
- `◀═▶` : WebRTC P2P connection (direct)
- `│` : Timeline

---

## State Transitions

### ICE Connection States

```
                                    ┌──────────────┐
                                    │     NEW      │
                                    │  (Initial)   │
                                    └──────┬───────┘
                                           │
                              Start gathering candidates
                                           │
                                           ▼
                                    ┌──────────────┐
                             ┌─────▶│   GATHERING  │──────┐
                             │      │ (Collecting) │      │
                             │      └──────────────┘      │
                             │              │             │
                             │      All gathered          │
                             │              │             │
                             │              ▼             │
     Network               ┌──────────────────────┐     Timeout/
     Change                │     CHECKING         │     Failure
        │                  │ (Testing pairs)      │       │
        │                  └──────────────────────┘       │
        │                           │                     │
        │                 Found working pair             │
        │                           │                     │
        │                           ▼                     │
        │                  ┌──────────────┐              │
        └─────────────────▶│  CONNECTED   │◀─────────────┘
                           │  (SUCCESS!)  │     Restart
                           └──────┬───────┘
                                  │
                    Temporary network issue
                                  │
                                  ▼
                         ┌──────────────┐
                  ┌─────▶│ DISCONNECTED │──────┐
                  │      │   (Waiting)  │      │
                  │      └──────────────┘      │
                  │              │             │
            Reconnected     Timeout/      Give up
                  │          Failure           │
                  │              │             │
                  │              ▼             ▼
                  │      ┌──────────────┐  ┌──────────────┐
                  └──────│    FAILED    │  │    CLOSED    │
                         │ (Try restart)│  │   (Ended)    │
                         └──────────────┘  └──────────────┘
```

### Call Participant State Machine

```
                       ┌──────────────┐
                       │   NOT IN     │
                       │     CALL     │
                       └──────┬───────┘
                              │
                         join_room
                              │
                              ▼
         ┌─────────────┬──────────────┬────────────────┐
         │             │              │                │
      HOST?         WAITING        REJECTED         ERROR
         │          ROOM              │                │
         │             │              │                │
         ▼             │              ▼                ▼
  ┌──────────────┐    │     ┌──────────────┐   ┌──────────────┐
  │  HOST IN     │    │     │  DECLINED    │   │    ERROR     │
  │     ROOM     │    │     │              │   │              │
  └──────┬───────┘    │     └──────────────┘   └──────────────┘
         │             │
    Get media          │
         │          accepted
         │             │
         ▼             ▼
  ┌──────────────────────┐
  │  PARTICIPANT IN ROOM │
  │   (can send WebRTC)  │
  └──────────┬───────────┘
             │
        leave_room
             │
             ▼
  ┌──────────────┐
  │     LEFT     │
  │     ROOM     │
  └──────────────┘
```

---

## Data Flow Examples

### 1. Authentication Flow

```
Client                     Backend                    Database
  │                           │                           │
  │─── POST /auth/signup ────▶│                           │
  │    { email, name, pwd }   │                           │
  │                           │── Hash password          │
  │                           │── INSERT INTO users ─────▶│
  │                           │◀─ user { id, email } ─────┤
  │                           │── Generate JWT           │
  │◀─ { token, user } ────────┤                           │
  │                           │                           │
  │─── POST /auth/login ──────▶│                           │
  │    { email, password }    │                           │
  │                           │── SELECT FROM users ─────▶│
  │                           │◀─ user ───────────────────┤
  │                           │── Verify password        │
  │                           │── Generate JWT           │
  │◀─ { token, user } ────────┤                           │
  │                           │                           │
  │─── GET /users/me ─────────▶│                           │
  │    Header: Authorization   │                           │
  │                           │── Verify JWT             │
  │                           │── SELECT FROM users ─────▶│
  │                           │◀─ user ───────────────────┤
  │◀─ { user } <───────────────┤                           │
```

### 2. Call Log Recording Flow

```
CallRoom                   Backend                    Database
  │                           │                           │
  │─── handleLeaveRoom() ────┐│                           │
  │    duration: "05:30"      ││                           │
  │    participants: 3        ││                           │
  │                           ││                           │
  │─── POST /calls/end ───────▼│                           │
  │    {                       │                           │
  │      call_id,              │                           │
  │      duration,             │                           │
  │      participant_count     │                           │
  │    }                       │                           │
  │                           │── INSERT INTO call_logs ──▶│
  │                           │   {                         │
  │                           │     user_id,                │
  │                           │     call_id,                │
  │                           │     duration: "05:30",      │
  │                           │     participant_count: 3    │
  │                           │   }                         │
  │◀─ { success: true } ──────┤◀─ call_log ────────────────┤
  │                           │                           │
  │─ Update CallStore.callLogs│                           │
```

### 3. Real-time Participant Updates

```
Host                 Backend WS Manager              Participant A         Participant B
 │                          │                             │                     │
 │── accept_participant ───▶│                             │                     │
 │   (User A)                │                             │                     │
 │                          │─ Move to Participants      │                     │
 │                          │                             │                     │
 │                          │── accepted_into_room ──────▶│                     │
 │                          │                             │                     │
 │                          │── new_participant ──────────┼─────────────────────▶
 │                          │   (User A joined)           │                     │
 │                          │                             │                     │
 │◀─ new_participant ───────┤                             │                     │
 │   (User A joined)         │                             │                     │
 │                          │                             │                     │
 │─ Update UI:              │                             │─ Update UI:        │─ Update UI:
 │   participants: [A]       │                             │   participants: [A]│   participants: [A]
```

---

## Technology Stack Summary

| Layer                     | Technology        | Purpose                    |
| ------------------------- | ----------------- | -------------------------- |
| **Frontend Framework**    | React 18          | UI library                 |
| **Build Tool**            | Vite              | Fast bundling & dev server |
| **State Management**      | Zustand           | Lightweight global state   |
| **Routing**               | React Router v6   | Client-side routing        |
| **HTTP Client**           | Axios             | API requests               |
| **Real-time (Signaling)** | WebSocket API     | Coordination messages      |
| **Real-time (Media)**     | WebRTC API        | P2P audio/video            |
| **Backend Framework**     | Go + Gin          | HTTP server                |
| **WebSocket Library**     | Gorilla WebSocket | WebSocket handling         |
| **Database**              | PostgreSQL        | Persistent storage         |
| **ORM Alternative**       | SQLC              | Type-safe SQL queries      |
| **Authentication**        | JWT               | Stateless auth tokens      |
| **Deployment (FE)**       | Vercel            | Frontend hosting           |
| **Deployment (BE)**       | Railway/Render    | Backend hosting            |
| **Deployment (DB)**       | Supabase/Neon     | Managed PostgreSQL         |

---

This architecture enables:

- ✅ Direct P2P video calls (low latency)
- ✅ Scalable signaling (WebSocket hub)
- ✅ Persistent call history
- ✅ Secure authentication
- ✅ Efficient database queries (SQLC type safety)
- ✅ Real-time participant management
