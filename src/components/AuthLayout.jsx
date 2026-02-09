import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/AuthStore';

const AuthLayout = () => {
    const user = useAuthStore((state) => state.user)
    console.log(user);

    if (user) {
        return <Navigate to="/" />
    }

  return (
    <div className="min-h-screen w-full flex bg-[#0f172a] text-white overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      {/* Noise Overlay */}
      <div className="noise-overlay"></div>

      {/* Main Content Container */}
      <div className="flex w-full z-10">
        
        {/* Left Side: Visual/Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-slate-900/50 border-r border-white/5">
          <div className="relative z-20">
            <Link to="/" className="flex items-center gap-2 group transition-all duration-300">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                VCME
              </span>
            </Link>
          </div>

          <div className="relative z-20 space-y-6">
            <h1 className="text-5xl font-extrabold leading-tight">
              Connect with <br />
              <span className="text-emerald-400 italic">anyone</span>, anywhere.
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Experience crystal-clear video calls and seamless collaboration with VCME. Join thousands of users worldwide.
            </p>
            
            <div className="flex gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400 flex items-center">
                Joined by over <span className="text-white font-semibold mx-1">10k+</span> users
              </p>
            </div>
          </div>

          <div className="relative z-20 text-sm text-slate-500">
            &copy; 2026 VCME Platform. All rights reserved.
          </div>

          {/* Decorative Visual Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-[1px] border-emerald-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-[1px] border-emerald-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Mobile Header */}
            <div className="lg:hidden flex flex-col items-center mb-10">
               <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">VCME</h2>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
              <Outlet />
            </div>

            <div className="mt-8 text-center text-slate-500 text-sm">
              <p>Secure authentication protected by industry standards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;