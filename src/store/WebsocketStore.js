import { create } from "zustand"
import { toast } from "react-hot-toast"
import { handleAcceptedIntoRoom, handleHostJoinedRoom, handleNewParticipant, handleWaitingRoom } from "../lib/websocketHandlers"


const useWebsocketStore = create((set,get) => ({
    socket: null,
    connected: null,

    connect: () => {
        //prevent multiple connections
        if(get().socket) return

        const token = localStorage.getItem("token")
        const ws = new WebSocket(`ws://localhost:5000/ws/?token=${token}`)

        ws.onopen = () => {
            set({
                socket: ws,
                connected: true
            })
            console.log("Connected to websocket")
        }


        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("Received message from websocket", data)

            switch (data.EventType) {
                case "waiting_room":
                    handleWaitingRoom(data.Payload)
                    break;
                case "host_joined_room":
                    handleHostJoinedRoom(data.Payload)
                    break;
                case "accepted_into_room":
                    handleAcceptedIntoRoom(data.Payload)
                    break;
                case "new_participant":
                    handleNewParticipant(data.Payload)
                    break;
                default:
                    console.log("Received unhandled event type:", data.EventType)
                    break;
            }
        }
    },

    send: (data) => {
       try {
        const socket = get().socket
        if(!socket) {
            toast.error("Not connected please logout and login again")
            return
        }
        socket.send(JSON.stringify(data))
        toast.success("Message sent successfully")
       } catch (error) {
        console.log("Error sending message to websocket", error)
        toast.error("Error sending message to websocket")
       }
    }
}))

export default useWebsocketStore