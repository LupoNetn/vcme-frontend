import React from 'react';
import { Phone, User, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';

const Home = () => {
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">
          Instant <span className="text-emerald-500">Video.</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium">Clear connections, anywhere in the world.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Contacts</h2>
            <button className="text-xs text-emerald-500 font-bold hover:underline transition-all">REFRESH</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((u) => (
              <div key={u} className="group p-5 bg-slate-800/40 hover:bg-slate-800 transition-all rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center border border-white/5 relative">
                    <User size={20} className="text-slate-300" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">Alex Johnson {u}</p>
                    <p className="text-xs text-slate-500 font-medium">Online</p>
                  </div>
                </div>
                <button className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl flex items-center justify-center transition-all">
                  <Phone size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
        
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-800/40 rounded-3xl p-6 border border-white/5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Channel</h2>
            <div className="space-y-2">
               <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer">
                  <p className="text-emerald-500 font-bold text-sm">New Direct Call</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">Private & Secure</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <p className="text-white font-bold text-sm">Share Invitation</p>
                  <p className="text-[10px] text-zinc-600 font-medium uppercase mt-1">Copy Link</p>
               </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;
