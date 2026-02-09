import React from 'react';
import { User, Bell, Shield, Moon, Monitor } from 'lucide-react';
import useAuthStore from '../../store/AuthStore';

const Settings = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and app preferences</p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-slate-800/20 border border-white/5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative overflow-hidden">
               <User size={32} className="text-emerald-500" />
               <img src={`https://i.pravatar.cc/100?u=${user?.email}`} alt="avatar" className="absolute inset-0 object-cover opacity-50" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">{user?.name || 'User Name'}</h2>
              <p className="text-slate-500 text-sm">{user?.email || 'user@example.com'}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/10">
                Pro Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsToggle icon={<Bell size={18} />} title="Push Notifications" description="Receive alerts for incoming calls" active />
            <SettingsToggle icon={<Shield size={18} />} title="Privacy Mode" description="Hide your status from others" />
            <SettingsToggle icon={<Moon size={18} />} title="Dark Mode" description="Use high-contrast dark theme" active />
            <SettingsToggle icon={<Monitor size={18} />} title="Desktop Integration" description="Show notifications on desktop" />
          </div>
        </section>

        {/* Account Settings */}
        <section className="bg-slate-800/20 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Account</h3>
           <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between group">
             <span className="text-white font-medium">Edit Profile</span>
             <span className="text-slate-600 group-hover:text-slate-400">→</span>
           </button>
           <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between group text-red-400">
             <span className="font-medium">Delete Account</span>
             <span className="text-red-900 group-hover:text-red-400 text-xs">Danger Zone</span>
           </button>
        </section>
      </div>
    </div>
  );
};

const SettingsToggle = ({ icon, title, description, active = false }) => (
  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
    <div className="flex items-center gap-4">
      <div className="text-slate-500 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[10px] text-slate-500">{description}</p>
      </div>
    </div>
    <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

export default Settings;
