import React, { Suspense } from 'react'
import { Sidebar, BottomNav } from './Navigation';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row antialiased">
        <Sidebar />
        
        <main className="flex-1 flex flex-col min-h-screen relative pb-24 md:pb-0 overflow-y-auto">
          {/* Subtle decorative glows */}
          <div className="fixed top-0 right-0 w-[40vw] h-[40vw] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
          <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
          
          <div className="relative z-10 flex-1">
            <Suspense fallback={
              <div className="h-full min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </main>
  
        <BottomNav />
      </div>
    );
}

export default AppLayout