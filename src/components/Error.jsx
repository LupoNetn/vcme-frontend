import { NavLink } from 'react-router-dom';


const ErrorPage = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
    <h1 className="text-8xl font-black text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none">404</h1>
    <div className="relative z-10">
      <h2 className="text-3xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-zinc-500 mb-8 max-w-sm">This page seems to have drifted out of range. Let's get you back home.</p>
      <NavLink to="/" className="inline-flex px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-semibold shadow-xl shadow-blue-500/20 active:scale-95">
        Return Home
      </NavLink>
    </div>
  </div>
);

export default ErrorPage;