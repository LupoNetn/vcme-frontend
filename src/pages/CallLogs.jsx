import React, { useEffect, useState } from 'react';
import { Phone, Video, Search, PhoneMissed, ArrowDownLeft, ArrowUpRight, Clock, Users } from 'lucide-react';
import useCallStore from '../store/CallStore';
import useAuthStore from '../store/AuthStore';
import useCall from '../hooks/useCall';

const CallLogs = () => {
  const { fetchCallLogs, isLoading } = useCall();
  const user = useAuthStore((state) => state.user);
  const callLogs = useCallStore((state) => state.callLogs);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
        fetchCallLogs(user.id);
    }
  }, [user?.id]);

  // Filter logs based on search
  const filteredLogs = callLogs.filter(log => 
    log.call_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCallStatus = (duration) => {
     if (duration === "0:00" || duration === "00:00") {
         return { icon: <ArrowDownLeft size={16} />, color: "text-red-400", label: "Missed" };
     }
     return { icon: <ArrowUpRight size={16} />, color: "text-emerald-400", label: "Outgoing" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans relative overflow-hidden pb-24">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-12">
        
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-4 md:mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 md:mb-2 tracking-tight">
                Call History
              </h1>
              <p className="text-slate-400 text-base md:text-lg">
                {callLogs.length} {callLogs.length === 1 ? 'call' : 'calls'} recorded
              </p>
            </div>
            
            {/* Desktop Search Bar */}
            <div className="relative group hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[320px]">
                <Search size={20} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search calls..." 
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search calls..." 
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-12 md:p-16 flex flex-col items-center justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-2xl">
              <PhoneMissed size={32} className="md:w-10 md:h-10 text-slate-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No calls yet</h3>
            <p className="text-slate-400 text-center max-w-md text-sm md:text-base">
              Your call history will appear here once you make or receive calls.
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-2xl border border-slate-700/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Call List */}
            <div className="divide-y divide-slate-700/30">
              {filteredLogs.map((log, index) => {
                const status = getCallStatus(log.duration);
                
                return (
                  <div 
                    key={index} 
                    className="group px-3 sm:px-4 md:px-6 py-3 md:py-4 hover:bg-slate-700/20 active:bg-slate-700/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    {/* Hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 md:group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative flex items-start md:items-center gap-3 md:gap-4">
                      
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg md:text-xl font-black text-white">
                            {log.call_title ? log.call_title.charAt(0).toUpperCase() : "U"}
                          </span>
                        </div>
                        {/* Status indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 ${status.color} bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900`}>
                          <span className="scale-75 md:scale-100">{status.icon}</span>
                        </div>
                      </div>

                      {/* Call Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate pr-2">
                            {log.call_title || "Unknown"}
                          </h3>
                          <span className="text-xs md:text-sm text-slate-400 shrink-0 mt-0.5">
                            {log.time}
                          </span>
                        </div>
                        
                        {/* Metadata - Stack on mobile, inline on desktop */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className={status.color}>{status.label}</span>
                          </div>
                          
                          {log.duration !== "00:00" && log.duration !== "0:00" && (
                            <>
                              <div className="w-1 h-1 bg-slate-600 rounded-full hidden sm:block"></div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="md:w-3.5 md:h-3.5" />
                                <span>{log.duration}</span>
                              </div>
                            </>
                          )}
                          
                          <div className="w-1 h-1 bg-slate-600 rounded-full hidden sm:block"></div>
                          <div className="flex items-center gap-1.5">
                            <Users size={12} className="md:w-3.5 md:h-3.5" />
                            <span className="hidden sm:inline">{log.participant_count} {log.participant_count === 1 ? 'person' : 'people'}</span>
                            <span className="sm:hidden">{log.participant_count}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Always visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-1.5 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                        <button className="p-2 md:p-3 bg-slate-700/50 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 rounded-lg md:rounded-xl transition-all hover:scale-110 active:scale-95">
                          <Phone size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button className="p-2 md:p-3 bg-slate-700/50 hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-400 rounded-lg md:rounded-xl transition-all hover:scale-110 active:scale-95">
                          <Video size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-slate-800/50 px-4 md:px-6 py-3 md:py-4 text-center">
              <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                End-to-end encrypted
              </p>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button className="fixed bottom-6 right-4 md:bottom-8 md:right-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white p-4 md:p-5 rounded-xl md:rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all md:hover:scale-110 z-50 group">
          <Phone size={20} className="md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CallLogs;
