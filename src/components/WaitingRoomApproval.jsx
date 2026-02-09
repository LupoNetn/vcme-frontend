import React from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import useCallStore from '../store/CallStore';
import useWebsocketStore from '../store/WebsocketStore';

const WaitingRoomApproval = () => {
    const { newUserInWaitlistID, setNewUserInWaitlistID, currentCall } = useCallStore();
    const send = useWebsocketStore((state) => state.send);

    if (!newUserInWaitlistID) return null;

    const handleApprove = () => {
        const payload = {
            event_type: "accept_participant",
            payload: {
                call_id: currentCall,
                participant_id: newUserInWaitlistID
            }
        };
        send(payload);
        setNewUserInWaitlistID(null);
    };

    const handleDecline = () => {
        setNewUserInWaitlistID(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 pointer-events-none">
            {/* Backdrop for focus - only active when visible */}
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-500"></div>
            
            <div className="w-[380px] bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.1)] overflow-hidden pointer-events-auto animate-in slide-in-from-top-10 fade-in duration-500 ring-1 ring-white/10">
                {/* Visual Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"></div>

                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/40 blur-md rounded-full animate-pulse"></div>
                            <div className="relative w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                <UserPlus size={22} className="text-emerald-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight">Join Request</h3>
                            <p className="text-emerald-400/80 text-[11px] font-bold uppercase tracking-wider">New Participant</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-5">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-1">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Client Identifier</p>
                        <p className="text-slate-300 font-mono text-xs truncate">
                            {newUserInWaitlistID}
                        </p>
                    </div>
                    
                    <p className="text-slate-400 text-sm leading-relaxed px-1">
                        Someone is waiting to join your secure session. Would you like to grant access?
                    </p>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleDecline}
                            className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold rounded-2xl text-sm transition-all border border-white/5 active:scale-95"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleApprove}
                            className="flex-[1.5] py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 group"
                        >
                            <span>Admit User</span>
                            <Check size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoomApproval;
