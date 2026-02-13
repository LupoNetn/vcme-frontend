import { create } from "zustand";

const useCallStore = create((set) => ({
    //users call state
    userCalls: [],
    setUserCalls: (calls) => set({ userCalls: calls }),
    isWaitingRoom: false,
    setIsWaitingRoom: (isWaitingRoom) => set({ isWaitingRoom }),
    isParticipant: false,
    setIsParticipant: (isParticipant) => set({ isParticipant }),
    targetUserId: null,
    setTargetUserId: (targetUserId) => set({ targetUserId }),
    callLogs: [],
    setCallLogs: (callLogs) => set({ callLogs }),

    //current call user is in state 
    currentCall: null,
    streams: null,
    callParticipants: [],
    CallWaitlist: [],
    newUserInWaitlist: [],
    setNewUserInWaitlist: (user) => set((state) => {
        const exists = state.newUserInWaitlist.some(u => u.client_id === user.client_id);
        if (exists) return state;
        return { newUserInWaitlist: [...state.newUserInWaitlist, user] };
    }),
    removeNewUserFromWaitlist: (userId) => set((state) => ({
        newUserInWaitlist: state.newUserInWaitlist.filter((user) => user.client_id !== userId)
    })),
    setCurrentCall: (call) => set({ currentCall: call }),
    setStreams: (streams) => set({ streams }),
    setCallParticipants: (participants) => set({ callParticipants: participants }),
    setCallWaitlist: (waitlist) => set({ CallWaitlist: waitlist }),
}));

export default useCallStore;