import React, { useState, useEffect } from "react";
import { Plus, Video, Copy, ExternalLink, Calendar, Users, ArrowRight, Search, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import CallLinkForm from "../components/CallLinkForm";
import useCall from "../hooks/useCall";
import useAuthStore from "../store/AuthStore";
import useCallStore from "../store/CallStore";
import useWebsocketStore from "../store/WebsocketStore.jsx";

const Home = () => {
  const [showForm, setShowForm] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [foundCall, setFoundCall] = useState(null);
  const [joiningCallId, setJoiningCallId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuthStore();
  const { userCalls } = useCallStore();
  const { listCalls, findCallByLink, isLoading } = useCall();
  const send = useWebsocketStore((state) => state.send)

  useEffect(() => {
    if (user?.id) {
      listCalls(user.id);
    }
  }, [user?.id]);

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(`http://localhost:5173/call/${link}`);
    toast.success("Link copied to clipboard");
  };

  const handleJoinCall = async (call) => {
    setJoiningCallId(call.id)
    try {
      const payload = {
        event_type: "join_room",
        payload: {
          call_id: call.id,
          call_link: call.call_link
        }
       }
       send(payload)
    } finally {
      // Keep loading state for 2 seconds to give feedback
      setTimeout(() => setJoiningCallId(null), 2000)
    }
  }

  const handleFindCall = async () => {
    if (!linkInput) return;
    
    setIsSearching(true);
    let linkId = linkInput.trim();
    
    // 1. If it's a full URL containing our app's call path
    if (linkId.includes('/call/')) {
      linkId = linkId.split('/call/').pop();
    } 
    // 2. If it's a full URL but not our app's (maybe shared from another domain)
    // and it doesn't look like our internal link format (jumbotronm.com/v/...)
    else if (linkId.startsWith('http') && !linkId.includes('.com/v/')) {
      linkId = linkId.split('/').pop();
    }
    // 3. Otherwise, use it as is (handles "jumbotronm.com/v/vcme-51923e")

    console.log("Searching for call with linkId:", linkId);
    try {
      const call = await findCallByLink(linkId);
      if (call) {
        setFoundCall(call);
        toast.success("Call found! You can now join.");
      } else {
        toast.error("Call not found. Check the link and try again.");
      }
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-400">
            Manage your virtual meetings and active sessions
          </p>
        </div>
        {userCalls.length > 0 && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 group"
          >
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            Create New Call Link
          </button>
        )}
      </header>
      
      {/* Join via Link Input Area */}
      <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
            <h2 className="text-2xl font-bold text-white">Join a Meeting</h2>
            <p className="text-slate-400 text-sm">Enter a call link or ID to join an existing session</p>
            
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Paste call link here..." 
                        value={linkInput}
                        onChange={(e) => {
                            setLinkInput(e.target.value);
                            setFoundCall(null);
                        }}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                    />
                </div>
                <button 
                    onClick={handleFindCall}
                    disabled={isSearching || !linkInput}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
                >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : "Find Call"}
                </button>
            </div>

            {foundCall && (
                <div className="mt-6 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                        <div className="space-y-1">
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Call Found</p>
                            <h3 className="text-lg font-bold text-white">{foundCall.title}</h3>
                            <p className="text-slate-400 text-sm italic">Created by {foundCall.host_id === user?.id ? "You" : foundCall.host_name}</p>
                        </div>
                        <button 
                            onClick={() => handleJoinCall(foundCall)}
                            disabled={!!joiningCallId}
                            className="w-full md:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                        >
                            {joiningCallId === foundCall.id ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <Video size={20} />
                                    Join Meeting Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </section>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
           <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4" />
           <p className="text-slate-500 text-sm animate-pulse">Fetching your calls...</p>
        </div>
      ) : userCalls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCalls.map((call) => (
            <div
              key={call.id}
              className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <Video size={24} className="text-emerald-500" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(call.call_link)}
                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    title="Copy Link"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {call.title}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-6 flex-1">
                {call.description || "No description provided."}
              </p>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={14} />
                    <span>
                      {new Date(call.created_at).toLocaleDateString()} at{" "}
                      {new Date(call.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleJoinCall(call)} 
                  disabled={!!joiningCallId}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all group/btn disabled:opacity-50"
                >
                  {joiningCallId === call.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      Join Call
                      <ArrowRight
                        size={16}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-8 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[40px]">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
            <Video size={40} className="text-slate-600" />
          </div>
          <div className="space-y-3 max-w-sm">
            <h2 className="text-2xl font-bold text-white">
              No call links found
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Start by creating a new permanent call link that you can share
              with your team across different platforms.
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
          >
            <Plus size={20} />
            Create Your First Link
          </button>
        </div>
      )}

      {/* Conditionally render the form */}
      {showForm && <CallLinkForm onClose={() => setShowForm(false)} />}

      {/* Decorative Blur Elements */}
      <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  );
};

export default Home;
