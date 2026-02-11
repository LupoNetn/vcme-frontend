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
    
    // In this version, target_id is the first person in the room (the target for the newcomer)
    const targetId = payload.target_id;

    if (!targetId || targetId === userId) {
        console.log("I am the initiator or alone, waiting for others...");
        return;
    }

    console.log("Connecting to target:", targetId);
    useCallStore.getState().setTargetUserId(targetId)
    
    const offer = await createOffer()
    if (offer) {
        useWebsocketStore.getState().send({
            event_type: "offer",
            payload: {
                call_id: payload.call_id,
                target_id: targetId,
                data: offer
            }
        })
    }
}

export const handleOffer = async (payload) => {
    console.log("Received offer from:", payload.sender_id);
    // Set target so our ICE candidates go to the right person
    useCallStore.getState().setTargetUserId(payload.sender_id)

    const answer = await createAnswer(payload.data)
    if (answer) {
        useWebsocketStore.getState().send({
            event_type: "answer",
            payload: {
                call_id: payload.call_id,
                target_id: payload.sender_id,
                data: answer
            }
        })
    }
}

export const handleAnswer = async (payload) => {
    console.log("Received answer from:", payload.sender_id);
    await applyAnswer(payload.data)
}

export const handleIceCandidate = async (payload) => {
    console.log("Received ICE candidate from:", payload.sender_id);
    await addIceCandidate(payload.data)
}