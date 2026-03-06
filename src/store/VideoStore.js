import { create } from "zustand";


const useVideoStore = create((set) => ({
    localStream: null,
    screenStream: null,
    remoteStream: null,

    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),
    setScreenStream: (stream) => set({screenStream: stream}),

    clearStreams: () => set({ localStream: null, remoteStream: null, screenStream: null }),
}))

export default useVideoStore