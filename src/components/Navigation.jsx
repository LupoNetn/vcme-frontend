import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Video, User, Plus } from 'lucide-react';

/**
 * Sidebar component - Clean Slate
 */
const Sidebar = () => {
  return (
    <nav className="hidden md:flex w-64 flex-col gap-10 p-8 h-screen sticky top-0 bg-[#0f172a] border-r border-white/5">
      {/* Brand Logo - Flat & Sharp */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Video size={22} className="text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">VCME</h1>
          <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Connect</p>
        </div>
      </div>

      {/* Navigation Links - Solid styles */}
      <div className="flex-1 flex flex-col gap-2">
        <NavItem to="/" icon={<Home size={18} />} label="Dashboard" />
        <NavItem to="/logs" icon={<ClipboardList size={18} />} label="History" />
      </div>

      {/* User Card - Flat & Integrated */}
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
          <User size={16} className="text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">Lupo Neto</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Pro</p>
        </div>
      </div>
    </nav>
  );
};

/**
 * Mobile Bottom Navigation - Flat Pill
 */
const BottomNav = () => {
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-[360px] z-50">
      <nav className="bg-slate-900 border border-white/10 rounded-3xl px-2 py-2 flex items-center justify-between shadow-2xl">
        <MobileNavItem to="/" icon={<Home size={20} />} />
        
        <NavLink 
          to="/call/new" 
          className="w-12 h-12 bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Video size={24} className="text-slate-900" />
        </NavLink>

        <MobileNavItem to="/logs" icon={<ClipboardList size={20} />} />
      </nav>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all overflow-hidden ${
        isActive 
          ? 'text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`
    }
  >
    {icon}
    <span className="font-semibold text-sm">{label}</span>
  </NavLink>
);

const MobileNavItem = ({ to, icon }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex-1 py-3 flex flex-col items-center justify-center transition-all ${
        isActive ? 'text-emerald-400' : 'text-zinc-500'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {icon}
        {isActive && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />}
      </>
    )}
  </NavLink>
);

export { Sidebar, BottomNav };
