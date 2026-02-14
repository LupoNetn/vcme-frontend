import useAuthStore from "../store/AuthStore"
import useCallStore from "../store/CallStore"
import useVideoStore from "../store/VideoStore"
import useWebsocketStore from "../store/WebsocketStore"
import { createOffer, setUpLocalMedia, handleAnswer as applyAnswer, createAnswer, addIceCandidate, resetPeerConnection } from "./webrtcManager"

export const handleWaitingRoom = (payload) => {
   useCallStore.setState({
    isWaitingRoom: true,
    currentCall: payload.call_id
   })
}

export const handleHostJoinedRoom = async (payload) => {
    const stream = await setUpLocalMedia()
    useVideoStore.getState().setLocalStream(stream)
    // Only set as participant after media is ready
    useCallStore.setState({ currentCall: payload.call_id, isParticipant: true })
}

export const handleNewParticipantRequest = (payload) => {
    useCallStore.getState().setNewUserInWaitlist(payload);
}

export const handleAcceptedIntoRoom = async (payload) => {
    const stream = await setUpLocalMedia()
    useVideoStore.getState().setLocalStream(stream)
    
    // Only set as participant after media is ready
    useCallStore.setState({
        isWaitingRoom: false,
        isParticipant: true,
        currentCall: payload.call_id,
        callParticipants: payload.participants
    })
}


export const handleLeftRoom = (payload) => {
    useCallStore.setState({
        isWaitingRoom: false,
        isParticipant: false,
        currentCall: null,
        newUserInWaitlist: []
    })
    resetPeerConnection()
    useVideoStore.getState().clearStreams()
}

export const handleDeclinedFromRoom = (payload) => {
    useCallStore.setState({
        isWaitingRoom: false,
        isParticipant: false,
        currentCall: null,
        newUserInWaitlist: []
    })
    alert(payload.message || "Your request to join was declined");
}

export const handleInitiatorRes = async (payload) => {
    const user = useAuthStore.getState().user
    const userId = user?.id
    
    console.log("📋 Initiator response received:", payload);
    
    // Get list of existing participants to connect to
    const existingParticipants = payload.existing_participants || [];
    
    if (existingParticipants.length === 0) {
        console.log("👤 I am alone in the room, waiting for others...");
        return;
    }
    
    console.log(`🔗 Connecting to ${existingParticipants.length} participant(s):`, existingParticipants);
    
    // For now, we'll implement 1-to-1 connections (mesh)
    // Connect to the first participant (in a full mesh, you'd loop through all)
    const targetId = existingParticipants[0];
    
    if (!targetId || targetId === userId) {
        console.log("❌ Invalid target or target is self");
        return;
    }
    
    console.log("🎯 Creating offer for:", targetId);
    useCallStore.getState().setTargetUserId(targetId)
    
    const offer = await createOffer()
    if (offer) {
        console.log("📤 Sending offer to:", targetId);
        useWebsocketStore.getState().send({
            event_type: "offer",
            payload: {
                call_id: payload.call_id,
                target_id: targetId,
                data: offer
            }
        })
    } else {
        console.error("❌ Failed to create offer");
    }
}

export const handleOffer = async (payload) => {
    console.log("📥 Received offer from:", payload.sender_id);
    console.log("📋 Offer payload:", payload);
    
    // Set target so our ICE candidates go to the right person
    useCallStore.getState().setTargetUserId(payload.sender_id)

    const answer = await createAnswer(payload.data)
    if (answer) {
        console.log("📤 Sending answer to:", payload.sender_id);
        useWebsocketStore.getState().send({
            event_type: "answer",
            payload: {
                call_id: payload.call_id,
                target_id: payload.sender_id,
                data: answer
            }
        })
    } else {
        console.error("❌ Failed to create answer");
    }
}

export const handleAnswer = async (payload) => {
    console.log("📥 Received answer from:", payload.sender_id);
    await applyAnswer(payload.data)
    console.log("✅ Answer applied successfully");
}

export const handleIceCandidate = async (payload) => {
    console.log("📥 Received ICE candidate from:", payload.sender_id, "Type:", payload.data?.type);
    await addIceCandidate(payload.data)
}

export const handleCallTerminated = (payload) => {
    console.log("⚠️ Call terminated by host:", payload.host_id);
    
    // Show alert to user
    alert(payload.message || "The host has ended the call");
    
    // Clean up and navigate home
    useCallStore.setState({
        isWaitingRoom: false,
        isParticipant: false,
        currentCall: null,
        newUserInWaitlist: [],
        callParticipants: []
    });
    
    resetPeerConnection();
    useVideoStore.getState().clearStreams();
    
    // Navigate to home after a brief delay
    setTimeout(() => {
        window.location.href = '/';
    }, 1500);
}

export const handleParticipantLeft = (payload) => {
    console.log("👋 Participant left:", payload.participant_id);
    
    // Update participant list
    const currentParticipants = useCallStore.getState().callParticipants;
    const updatedParticipants = currentParticipants.filter(id => id !== payload.participant_id);
    
    useCallStore.setState({
        callParticipants: updatedParticipants
    });
    
    // If the participant who left was our peer, clear remote stream
    const targetUserId = useCallStore.getState().targetUserId;
    if (targetUserId === payload.participant_id) {
        console.log("Our peer left, clearing remote stream");
        useVideoStore.getState().setRemoteStream(null);
        useCallStore.setState({ targetUserId: null });
    }
}
