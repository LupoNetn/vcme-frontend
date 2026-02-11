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
    console.log(error);
  }
};

const rtcConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

let peerConnection = new RTCPeerConnection(rtcConfig);
let candidateQueue = [];

// Track if remote description is set
let isRemoteDescriptionSet = false;

const addLocalTracks = () => {
    const localStream = useVideoStore.getState().localStream;
    if (localStream && peerConnection) {
        localStream.getTracks().forEach((track) => {
            const alreadyAdded = peerConnection.getSenders().some(s => s.track === track);
            if (!alreadyAdded) {
                console.log("Adding local track:", track.kind);
                peerConnection.addTrack(track, localStream);
            }
        });
    }
};

const setupPeerEvents = (pc) => {
    pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        console.log("!!! RECEIVED REMOTE STREAM !!!", remoteStream.id);
        useVideoStore.getState().setRemoteStream(remoteStream);
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            const callId = useCallStore.getState().currentCall
            const targetId = useCallStore.getState().targetUserId
            console.log("Sending ICE candidate to:", targetId);
            useWebsocketStore.getState().send({
                event_type: "ice_candidate",
                payload: {
                    call_id: callId,
                    target_id: targetId,
                    data: event.candidate,
                },
            });
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log("ICE Connection State:", pc.iceConnectionState);
    };
    
    pc.onsignalingstatechange = () => {
        console.log("Signaling State:", pc.signalingState);
    };
};

setupPeerEvents(peerConnection);

export const createOffer = async () => {
  if (!peerConnection) return;
  addLocalTracks();

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("Created and set local offer");
    return offer;
  } catch (error) {
    console.error("Error creating the offer:", error);
  }
};

export const createAnswer = async (offer) => {
  if (!peerConnection) return;
  addLocalTracks();

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    isRemoteDescriptionSet = true;
    console.log("Set remote offer, creating answer...");
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    // Process any queued candidates
    processQueuedCandidates();
    
    return answer;
  } catch (error) {
    console.error("Error creating the answer:", error);
  }
};

export const handleAnswer = async (answer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    isRemoteDescriptionSet = true;
    console.log("Set remote answer successfully");
    
    processQueuedCandidates();
  } catch (error) {
    console.error("Error setting remote answer:", error);
  }
};

export const addIceCandidate = async (candidate) => {
    if (!candidate) return;

    if (!isRemoteDescriptionSet) {
        console.log("Queueing ICE candidate (remote description not set)");
        candidateQueue.push(candidate);
        return;
    }

    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added ICE candidate successfully");
    } catch (error) {
        console.error("Error adding ICE candidate:", error);
    }
};

const processQueuedCandidates = () => {
    console.log(`Processing ${candidateQueue.length} queued candidates`);
    while (candidateQueue.length > 0) {
        const candidate = candidateQueue.shift();
        addIceCandidate(candidate);
    }
};

export const resetPeerConnection = () => {
    console.log("Resetting peer connection");
    if (peerConnection) {
        peerConnection.close();
    }
    peerConnection = new RTCPeerConnection(rtcConfig);
    setupPeerEvents(peerConnection);
    candidateQueue = [];
    isRemoteDescriptionSet = false;
};
