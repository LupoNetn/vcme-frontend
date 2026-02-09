import React from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, User } from 'lucide-react';

const CallLogs = () => {
  const logs = [
    { id: 1, type: 'Incoming', duration: '12:45', name: 'John Doe', date: 'Oct 24, 2023', icon: PhoneIncoming },
    { id: 2, type: 'Outgoing', duration: '05:20', name: 'Alice Smith', date: 'Oct 23, 2023', icon: PhoneOutgoing },
    { id: 3, type: 'Missed', duration: '0:00', name: 'Bob Wilson', date: 'Oct 22, 2023', icon: PhoneMissed },
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Logs.</h1>
          <p className="text-slate-500 font-medium">Clear record of your interactions.</p>
        </div>
        <button className="px-5 py-2 hover:bg-white/5 border border-white/5 rounded-xl text-slate-400 text-xs font-bold uppercase tracking-widest transition-all">
          Reset
        </button>
      </div>

      <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-black bg-slate-800/30">
            <tr>
              <th className="px-8 py-5">User</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Duration</th>
              <th className="px-8 py-5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {logs.map((log) => (
              <tr key={log.id} className="group hover:bg-slate-800/30 transition-all">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-slate-700 border border-white/5 flex items-center justify-center">
                      <User size={14} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight">{log.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className={`inline-flex p-2 rounded-lg ${
                    log.type === 'Missed' ? 'bg-red-500/10 text-red-500' : 
                    log.type === 'Incoming' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    <log.icon size={14} />
                  </div>
                </td>
                <td className="px-8 py-5 text-slate-500 group-hover:text-slate-300 transition-all text-sm font-medium">{log.duration}</td>
                <td className="px-8 py-5 text-slate-500 group-hover:text-zinc-400 transition-all text-sm font-medium">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallLogs;
