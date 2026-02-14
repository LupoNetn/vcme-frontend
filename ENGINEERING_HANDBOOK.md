# 📘 VCMe Engineering Handbook

> _The ultimate guide to understanding, maintaining, and mastering the video calling architecture of this application. Written for engineers who want to go deep._

---

## 🏗️ 1. High-Level Architecture

This application is a **Real-Time Video Communication Platform** built with **React** on the frontend. It follows a **Peer-to-Peer (P2P)** architecture using **WebRTC** for video/audio processing and **WebSockets** for signaling.

### The "Senior Engineer" View

Instead of central server relays for media (like SFU/MCU), this app connects users directly to each other. The backend serves only two purposes:

1.  **Signaling**: helping peers find each other (exchanging connection details).
2.  **Room Management**: determining who is in which room.

**Key Technologies:**

- **Signaling**: WebSockets (Raw `WebSocket` API, not Socket.io).
- **State Management**: Zustand (Global stores for easy access outside React components).
- **Media**: WebRTC (`RTCPeerConnection`, `getUserMedia`).
- **Build Tool**: Vite.

---

## 🧠 2. Core Logic: The "Holy Trinity" of Files

To understand this app, you only really need to master three files in `client/src/`. Everything else is just UI.

### 1. The Postman: `store/WebsocketStore.jsx`

Think of this as the **mailroom**.

- **Responsibility**: Maintains the long-lived WebSocket connection to the server.
- **How it works**: It listens for raw JSON messages. When a message comes in (e.g., "Someone joined"), it checks the `EventType` string and routes it to the specific handler function in `websocketHandlers.js`.
- **Senior Tip**: It creates a singleton socket connection. Notice how it handles `readyState` to queue messages if the connection isn't open yet? That's critical for reliability.

### 2. The Conductor: `lib/websocketHandlers.js`

This is the **brain** of the operation.

- **Responsibility**: Reaction logic. It bridges the gap between the server and the local React state.
- **How it works**:
  - Server says: "Here is an Offer from User A".
  - Handler says: "Okay, `webrtcManager`, please create an Answer. Then, `WebsocketStore`, send that Answer back."
- **Critical Function**: `handleInitiatorRes`. This is the "Big Bang" of a call. When you join, the server sends you a list of existing users. This function initiates the WebRTC offer to them.

### 3. The Engine: `lib/webrtcManager.js`

This is the **heavy machinery**.

- **Responsibility**: Validating, encoding, and transmitting media.
- **How it works**: It manages the `RTCPeerConnection` object.
  - **`setUpLocalMedia`**: Asks user for Camera/Mic permissions.
  - **`createOffer` / `createAnswer`**: Generating SDP (Session Description Protocol) blobs that describe "I have these video codecs and this encryption."
  - **`addIceCandidate`**: Adds network path information (IP:Port pairs).

---

## 🔄 3. Deep Dive: The Call Flow (The "Handshake")

This is the hardest part of the app. Memorize this flow to debug any connection issue.

### Phase 1: The Setup

1.  **User A** joins a room.
2.  Server sends `initiator_res` to User A with a list of participants.
3.  **User A** sees User B is already there. User A becomes the **Offerer**.

### Phase 2: The Offer (Signaling)

1.  **User A** (`webrtcManager.js`) calls `createOffer()`.
    - Create `RTCPeerConnection`.
    - Add local video tracks.
    - Generate SDP Offer.
    - Set `LocalDescription`.
2.  **User A** (`websocketHandlers.js`) sends this Offer string to User B via WebSocket.

### Phase 3: The Answer

1.  **User B** receives `offer` event.
2.  **User B** (`webrtcManager.js`) calls `createAnswer()`:
    - Sets `RemoteDescription` (learning about User A's capabilities).
    - Generates SDP Answer.
    - Sets `LocalDescription`.
3.  **User B** sends Answer string back to User A.
4.  **User A** receives `answer` and sets `RemoteDescription`. **Handshake Complete.**

### Phase 4: ICE Candidates (The "Hole Punching")

- Even after the handshake, they don't know _how_ to route packets to each other through firewalls.
- The `onicecandidate` event fires on both sides whenever the browser finds a possible network path (Local IP, Public IP via STUN).
- These candidates are trickled one by one via WebSocket (`handleIceCandidate`).
- **Senior Gotcha**: You generally CANNOT add an ICE candidate until requested `setRemoteDescription` is done. Look at the `queue` logic in `webrtcManager.js`. This prevents race conditions.

---

## 💡 4. Essential Concepts for Senior Engineers

### STUN vs TURN

- **STUN (Session Traversal Utilities for NAT)**: "Who am I?" server. It tells you your public IP so you can tell your peer. It's cheap/free. (We use Google's public STUN servers).
- **TURN (Traversal Using Relays around NAT)**: "Relay for me." If direct P2P is blocked (Corporate firewalls, Symmetric NAT), traffic goes _through_ this server. It costs money (bandwidth).
- **In this app**: We use `openrelay.metered.ca` for free TURN. If calls fail on mobile data but work on WiFi, it's usually a TURN issue.

### The "Perfect Negotiation" Pattern

WebRTC is fragile. If two people offer at the exact same time (Glare), the connection fails.

- _Current Implementation_: Use a simplified model where the "New Joiner" always offers. This avoids Glare in most simple cases but can be brittle in complex scenarios.

### Memory Leaks

- **EventListeners**: In `useEffect`, always return a cleanup function to remove listeners.
- **MediaStreams**: When a user leaves, you MUST call `track.stop()` on their media tracks to turn off the generic camera light hardware.

---

## 📂 5. Crucial File Map

- `src/store/*`: **Zustand Stores**. Go here to see what data is global (Current Call ID, Auth User, Video Streams).
- `src/lib/websocketHandlers.js`: **Business Logic**. Go here to change _what happens_ when an event occurs.
- `src/lib/webrtcManager.js`: **Low-Level Logic**. Go here to tweak video quality, codecs, or connection logic.
- `src/components/CallRoom.tsx`: The UI that renders the video elements. It grabs the streams from the store and attaches them to `<video>` tags.

---

## 🚀 6. How to Contribute / Extend

1.  **Adding Chat**:
    - Add a `chat_message` event in `websocketHandlers.js`.
    - You don't need WebRTC for text chat! Just use the WebSocket.
2.  **Adding Screen Share**:
    - In `webrtcManager.js`, use `navigator.mediaDevices.getDisplayMedia()`.
    - Replace the video track in the `peerConnection` sender with the screen track.
