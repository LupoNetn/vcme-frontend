import { create } from "zustand";

const useCallStore = create((set) => ({
    //users call state
    userCalls: [],
    setUserCalls: (calls) => set({ userCalls: calls }),

    //current call user is in state 
    currentCall: null,
    streams: null,
    callParticipants: null,
    CallWaitlist: null,
    setCurrentCall: (call) => set({ currentCall: call }),
    setStreams: (streams) => set({ streams }),
    setCallParticipants: (participants) => set({ callParticipants: participants }),
    setCallWaitlist: (waitlist) => set({ CallWaitlist: waitlist }),
}));

export default useCallStore;