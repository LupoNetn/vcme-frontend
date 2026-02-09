import React, { Suspense, lazy } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Outlet, 
  Navigate 
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/AppLayout';
import AuthLayout from './components/AuthLayout';
import Error from './components/Error';
import useAuthStore from './store/AuthStore';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const CallRoom = lazy(() => import('./pages/CallRoom'));
const CallLogs = lazy(() => import('./pages/CallLogs'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#0f172a]">
    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to home if already logged in)
const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    errorElement: <Error />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'logs', element: <CallLogs /> },
          { path: 'settings', element: <Settings /> },
          { path: 'call/:callId', element: <CallRoom /> },
        ],
      },
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'signup', element: <Signup /> },
        ],
      },
    ],
  },
  { 
    path: '*', 
    element: <Navigate to="/" replace /> 
  }
]);

const App = () => (
  <Suspense fallback={<LoadingFallback />}>
    <RouterProvider router={router} />
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f1f1f1',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '500',
          backdropFilter: 'blur(8px)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </Suspense>
);

export default App;