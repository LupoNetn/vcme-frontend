import useCallStore from "../store/CallStore"

export const handleWaitingRoom = (payload) => {
   useCallStore.setState({
    isWaitingRoom: true,
    currentCall: payload.call_id
   })
//    if(!window.location.pathname.startsWith('/waiting-room')) {
//         window.location.href = `/waiting-room/${payload.call_id}`
//     }       
}

export const handleHostJoinedRoom = (payload) => {
    useCallStore.setState({ currentCall: payload.call_id,isParticipant: true })
    // if(!window.location.pathname.startsWith('/call')) {
    //     window.location.href = `/call/${payload.call_id}`
    // }
}

export const handleNewParticipant = (payload) => {
    useCallStore.setState({
        newUserInWaitlistID: payload.client_id,
        newUserInWaitlistName: payload.client_name
    })
}

export const handleAcceptedIntoRoom = (payload) => {
    useCallStore.setState({
        isWaitingRoom: false,
        isParticipant: true,
        currentCall: payload.call_id
    })
    // window.location.href = `/call/${payload.call_id}`
}


export const handleLeftRoom = (payload) => {
    useCallStore.setState({
        isWaitingRoom: false,
        isParticipant: false,
        currentCall: null
    })
    // window.location.href = `/`
}