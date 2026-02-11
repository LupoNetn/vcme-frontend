import { create } from "zustand";


const useVideoStore = create((set) => ({
    localStream: null,
    remoteStream: null,

    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),

    clearStreams: () => set({ localStream: null, remoteStream: null }),
}))

export default useVideoStore