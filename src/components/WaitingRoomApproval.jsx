import React from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import useCallStore from '../store/CallStore';
import useWebsocketStore from '../store/WebsocketStore.jsx';

const WaitingRoomApproval = () => {
    const { newUserInWaitlist, removeNewUserFromWaitlist, currentCall } = useCallStore();
    const send = useWebsocketStore((state) => state.send);

    if (newUserInWaitlist.length === 0) return null;

    const handleApprove = (userId) => {
        const payload = {
            event_type: "accept_participant",
            payload: {
                call_id: currentCall,
                participant_id: userId
            }
        };
        send(payload);
        removeNewUserFromWaitlist(userId);
    };

    const handleDecline = (userId) => {
        const payload = {
            event_type: "decline_participant",
            payload: {
                call_id: currentCall,
                participant_id: userId
            }
        };
        send(payload);
        removeNewUserFromWaitlist(userId);
    };

    return (
        <div className="fixed top-6 right-6 z-[100] pointer-events-none flex flex-col gap-3">
            {newUserInWaitlist.map((user) => (
                <div 
                    key={user.client_id} 
                    className="w-[320px] bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto ring-1 ring-white/10 animate-in slide-in-from-right-10 fade-in duration-500"
                >
                    {/* Compact Header */}
                    <div className="p-4 flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-emerald-500/30 blur-md rounded-full"></div>
                            <div className="relative w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                <UserPlus size={18} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-white font-bold text-sm truncate">
                                {user.client_name || "New User"}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Wants to join</p>
                        </div>
                        <button 
                            onClick={() => handleDecline(user.client_id)}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Compact Actions */}
                    <div className="px-4 pb-4 flex gap-2">
                        <button
                            onClick={() => handleDecline(user.client_id)}
                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold rounded-xl text-xs transition-all border border-white/5"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => handleApprove(user.client_id)}
                            className="flex-[1.5] py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                        >
                            <span>Admit</span>
                            <Check size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WaitingRoomApproval;
