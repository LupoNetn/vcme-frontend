import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Video, PhoneOff } from 'lucide-react';
import WaitingRoomApproval from '../components/WaitingRoomApproval';

const CallRoom = () => {
  const { callId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-900 p-4 flex flex-col items-center justify-center">
      <WaitingRoomApproval />
      <div className="w-full max-w-5xl aspect-video bg-neutral-800 rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
        {/* Remote Video Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Waiting for participant...</p>
        </div>

        {/* Local Video Placeholder */}
        <div className="absolute bottom-6 right-6 w-48 aspect-video bg-neutral-700 rounded-xl border-2 border-white/10 shadow-lg overflow-hidden flex items-center justify-center">
          <span className="text-xs text-gray-400">You</span>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
          <button className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors text-white" title="Toggle Mic">
            <Mic size={20} />
          </button>
          <button className="p-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors text-white" title="Toggle Camera">
            <Video size={20} />
          </button>
          <button 
            onClick={() => navigate('/')}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white shadow-lg shadow-red-500/30"
            title="End Call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-neutral-500 text-sm">
        Room ID: <span className="text-neutral-300 font-mono">{callId || 'direct-call'}</span>
      </div>
    </div>
  );
};

export default CallRoom;
