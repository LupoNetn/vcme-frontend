import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import useCallStore from '../store/CallStore';

const WaitingRoom = () => {
    const { callId } = useParams();
    const navigate = useNavigate();
    const isWaitingRoom = useCallStore((state) => state.isWaitingRoom);

    const setIsWaitingRoom = useCallStore((state) => state.setIsWaitingRoom);
    const setCurrentCall = useCallStore((state) => state.setCurrentCall);

    useEffect(() => {
        setIsWaitingRoom(true);
        setCurrentCall(callId);
    }, []);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0f172a] to-[#0f172a]">
            {/* Animated background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 relative z-10 text-center">
                {/* Icon Container */}
                <div className="relative inline-flex mb-4">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative p-6 bg-slate-900/50 border border-white/10 rounded-3xl backdrop-blur-xl">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Waiting Room
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        The host has been notified. Please stay on this page; you'll be admitted once they approve your request.
                    </p>
                </div>

                {/* Status Card */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-center gap-3 text-emerald-400 font-medium">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        Connection Secure
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-loading-bar origin-left"></div>
                    </div>
                    <p className="text-sm text-slate-500 italic">
                        Call ID: <span className="text-slate-300 font-mono text-xs">{callId}</span>
                    </p>
                </div>

                {/* Actions */}
                <button
                    onClick={() => navigate('/')}
                    className="group inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
            </div>

            {/* Micro-animations */}
            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(0.3); }
                }
                .animate-loading-bar {
                    animation: loading-bar 3s ease-in-out infinite alternate;
                }
            `}</style>
        </div>
    );
};

export default WaitingRoom;
