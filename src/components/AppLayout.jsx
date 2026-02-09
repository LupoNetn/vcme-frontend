import React, { Suspense, useEffect } from 'react'
import { Sidebar, BottomNav } from './Navigation';
import Navbar from './Navbar';
import { Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/AuthStore';
import useWebsocketStore from '../store/WebsocketStore';
import useCallStore from '../store/CallStore';

const AppLayout = () => {
  const navigate = useNavigate();
  const { isWaitingRoom, isParticipant, currentCall } = useCallStore();
  const { isAuthenticated } = useAuthStore();
  const connect = useWebsocketStore((state) => state.connect);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
  }, [isAuthenticated, connect]);

  // Handle centralized navigation for WebSocket events
  useEffect(() => {
    if (isWaitingRoom && currentCall) {
      if (!window.location.pathname.includes('/waiting-room')) {
        navigate(`/waiting-room/${currentCall}`);
      }
    }
  }, [isWaitingRoom, currentCall, navigate]);

  useEffect(() => {
    if (isParticipant && currentCall) {
      if (!window.location.pathname.includes('/call/')) {
        navigate(`/call/${currentCall}`);
      }
    }
  }, [isParticipant, currentCall, navigate]);

  return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row antialiased overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
          <div className="md:hidden">
            <Navbar />
          </div>
          
          <div className="flex-1 overflow-y-auto relative pb-24 md:pb-8">
            {/* Subtle decorative glows */}
            <div className="fixed top-0 right-0 w-[40vw] h-[40vw] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
            
            <div className="relative z-10 flex-1">
              <Suspense fallback={
                <div className="h-full min-h-[60vh] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-emerald-600/10 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              }>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
  
        <BottomNav />
      </div>
    );
}

export default AppLayout