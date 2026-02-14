import React from "react"
import { create } from "zustand"
import { toast } from "react-hot-toast"
import { Loader2, CheckCircle2, XCircle, Bell, LogIn, LogOut } from "lucide-react"
import { handleAcceptedIntoRoom, handleHostJoinedRoom, handleLeftRoom, handleNewParticipantRequest, handleWaitingRoom, handleDeclinedFromRoom, handleInitiatorRes, handleAnswer, handleOffer, handleIceCandidate, handleCallTerminated, handleParticipantLeft } from "../lib/websocketHandlers"
import { WS_URL } from "../config"


const useWebsocketStore = create((set,get) => ({
    socket: null,
    connected: null,

    connect: () => {
        //prevent multiple connections
        if(get().socket) return

        const token = localStorage.getItem("token")
        const ws = new WebSocket(`${WS_URL}/ws/?token=${token}`)

        // Pre-set socket to prevent duplicate connection attempts
        set({ socket: ws })

        ws.onopen = () => {
            set({
                connected: true
            })
            console.log("Connected to websocket")
        }


        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("Received message from websocket", data)

            // Dynamic notifications for incoming events (Big Tech style)
            switch (data.EventType) {
                case "waiting_room":
                    toast.success("Joined waiting room. Waiting for host...", { 
                        id: "waiting_room",
                        icon: <LogIn className="w-4 h-4 text-emerald-500" />
                    })
                    handleWaitingRoom(data.Payload)
                    break;
                case "host_joined_room":
                    toast.success("Host joined! Starting session...", { 
                        id: "host_join",
                        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    })
                    handleHostJoinedRoom(data.Payload)
                    break;
                case "accepted_into_room":
                    toast.success("Host admitted you! Joining now...", { 
                        id: "accepted",
                        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    })
                    handleAcceptedIntoRoom(data.Payload)
                    break;
                case "new_participant_request":
                    toast(`${data.Payload.client_name || "Someone"} is waiting in the lobby`, { 
                        id: "new_participant",
                        icon: <Bell className="w-4 h-4 text-blue-500" />
                    })
                    handleNewParticipantRequest(data.Payload)
                    break;
                case "left_room":
                    toast.success("Left the call", {
                        id: "left_room",
                        icon: <LogOut className="w-4 h-4 text-slate-500" />
                    })
                    handleLeftRoom(data.Payload)
                    break;
                case "declined_from_room":
                    toast.error("Your request to join was declined", {
                        id: "declined",
                        icon: <XCircle className="w-4 h-4 text-red-500" />
                    })
                    handleDeclinedFromRoom(data.Payload)
                    break;
                case "initiator_res":
                    handleInitiatorRes(data.Payload)
                    break;
                case "answer":
                    handleAnswer(data.Payload)
                    break;
                case "offer":
                    handleOffer(data.Payload)
                    break;
                case "ice_candidate":
                    handleIceCandidate(data.Payload)
                    break;
                case "call_terminated":
                    toast.error(data.Payload.message || "Call ended by host", { 
                        id: "call_terminated",
                        icon: <XCircle className="w-4 h-4 text-red-500" />
                    })
                    handleCallTerminated(data.Payload)
                    break;
                case "participant_left":
                    toast(`Participant left the call`, { 
                        id: "participant_left",
                        icon: <LogOut className="w-4 h-4 text-slate-500" />
                    })
                    handleParticipantLeft(data.Payload)
                    break;
                case "error":
                    toast.error(data.Payload.message || "An error occurred", { 
                        id: "ws_error",
                        icon: <XCircle className="w-4 h-4 text-red-500" />
                    })
                    break;
                default:
                    console.log("Received unhandled event type:", data.EventType)
                    break;
            }
        }

        ws.onclose = () => {
            set({ socket: null, connected: false })
            console.log("Disconnected from websocket")
        }

        ws.onerror = (err) => {
            console.error("Websocket error:", err)
        }
    },

    send: async (data) => {
       try {
        const socket = get().socket
        if(!socket) {
            toast.error("Not connected. Please log in again.", { id: "conn_error" })
            return
        }

        // Wait if the socket is still connecting
        if (socket.readyState === WebSocket.CONNECTING) {
            console.log("WebSocket is connecting, waiting to send...")
            await new Promise((resolve, reject) => {
                const onOpen = () => {
                    socket.removeEventListener('open', onOpen);
                    socket.removeEventListener('error', onError);
                    resolve();
                };
                const onError = (err) => {
                    socket.removeEventListener('open', onOpen);
                    socket.removeEventListener('error', onError);
                    reject(err);
                };
                socket.addEventListener('open', onOpen);
                socket.addEventListener('error', onError);
            });
        }
        
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data))
        } else {
            console.error("WebSocket not open after wait. State:", socket.readyState)
        }
       } catch (error) {
        console.error("WebSocket send error:", error)
        toast.error("Connection error. Could not send request.", { id: "send_error" })
       }
    }
}))

export default useWebsocketStore