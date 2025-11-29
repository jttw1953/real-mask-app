// AuthRedirect.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthRedirect() {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    // Email is already verified by Supabase
    // Just redirect to login with success message
    navigate('/login', {
      state: {
        message: 'Email verified successfully! You can now log in.',
      },
      replace: true, // Use replace to prevent back button issues
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
      <p className="text-lg text-slate-300">Verifying email...</p>
    </div>
  );
}
