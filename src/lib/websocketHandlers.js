import useCallStore from "../store/CallStore"

export const handleWaitingRoom = (payload) => {
    useCallStore.setState({ 
        isWaitingRoom: true,
        currentCall: payload.call_id
    })
}

export const handleHostJoinedRoom = (payload) => {
    useCallStore.setState({ 
        isParticipant: true, 
        currentCall: payload.call_id 
    })
}

export const handleAcceptedIntoRoom = (payload) => {
    useCallStore.setState({ 
        isWaitingRoom: false,
        isParticipant: true,
        currentCall: payload.call_id 
    })
}

export const handleNewParticipant = (payload) => {
    useCallStore.setState({
        newUserInWaitlistID: payload.client_id
    })
}