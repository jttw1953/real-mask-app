// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// === Your pages ===
import Start from './pages/Start';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MenuPage from './pages/Menu';
import ForgotPassword from './pages/ForgotPassword';
import AccountDetails from './pages/AccountDetails';
import App from './App';
import { Landing } from './pages/Landing';
import { MeetingPage } from './pages/MeetingPage';
import CreateMeeting from './pages/CreateMeeting';
import Calendar from './pages/Calendar';
import JoinMeeting from './pages/JoinMeeting';
import OverlaysPage from './pages/Overlays';
import AuthComponent from './components/AuthComponent';
import { AppDataProvider } from './components/useAppData';
import './index.css';
import MeetingDetails from './pages/MeetingDetails';
import EditMeeting from './pages/EditMeeting';
import ResetPassword from './pages/ResetPassword';

const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthComponent>
      <AppDataProvider>{children}</AppDataProvider>
    </AuthComponent>
  );
};

// NEW: Conditional wrapper that provides AppDataProvider only if user is authenticated
const ConditionalAppDataRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const checkAuth = async () => {
      try {
        const { supabase } = await import('./components/supabaseAuth');
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          console.log(
            '🔐 ConditionalAppDataRoute - Session exists:',
            !!session
          );
          setIsAuthenticated(!!session);
          setIsLoading(false);
        }

        // Listen for auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            console.log('🔄 Auth state changed - Session exists:', !!session);
            setIsAuthenticated(!!session);
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.error('❌ Error in ConditionalAppDataRoute:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  // IMPORTANT: Show loading while checking auth to prevent race condition
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If authenticated, wrap in AppDataProvider
  if (isAuthenticated) {
    console.log('✅ Wrapping in AppDataProvider');
    return <AppDataProvider>{children}</AppDataProvider>;
  }

  // Not authenticated, render without provider
  console.log('👤 Guest mode - no AppDataProvider');
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes - no auth required */}
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Protected routes - wrapped in AuthComponent and AppDataProvider */}
        <Route
          path="/menu"
          element={
            <AuthenticatedRoute>
              <MenuPage />
            </AuthenticatedRoute>
          }
        />{' '}
        <Route
          path="/meeting-details/:meetingID"
          element={
            <AuthenticatedRoute>
              <MeetingDetails />
            </AuthenticatedRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />{' '}
        <Route path="/reset-password" element={<ResetPassword />} />{' '}
        <Route
          path="/account-details"
          element={
            <AuthenticatedRoute>
              <AccountDetails />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/app"
          element={
            <AuthenticatedRoute>
              <App />
            </AuthenticatedRoute>
          }
        />
        <Route path="/landing/" element={<Landing />} />
        {/* UPDATED: MeetingPage with conditional AppDataProvider */}
        <Route
          path="/meet/:meetingId"
          element={
            <ConditionalAppDataRoute>
              <MeetingPage />
            </ConditionalAppDataRoute>
          }
        />
        <Route
          path="/create-meeting"
          element={
            <AuthenticatedRoute>
              <CreateMeeting />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/edit-meeting/:meetingId"
          element={
            <AuthenticatedRoute>
              {' '}
              <EditMeeting />{' '}
            </AuthenticatedRoute>
          }
        />{' '}
        <Route
          path="/calendar"
          element={
            <AuthenticatedRoute>
              <Calendar />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/join"
          element={
            <AuthenticatedRoute>
              <JoinMeeting />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/overlays"
          element={
            <AuthenticatedRoute>
              <OverlaysPage />
            </AuthenticatedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
