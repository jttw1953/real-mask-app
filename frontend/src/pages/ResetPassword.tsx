// src/pages/ResetPasswordConfirm.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';
import Field from '../components/Field';
import TextField from '../components/TextField';
// If you prefer using your data layer instead of fetch:
// import { useAppData } from '../components/useAppData';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // e.g. /reset-password/confirm?token=abc123

  // const { completePasswordReset } = useAppData(); // optional if you wire it there

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Reset link is invalid or missing. Please request a new one.');
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // OPTION 1: via your app data layer (e.g., Supabase wrapper)
      // const result = await completePasswordReset(token, password);
      // if (!result.success) {
      //   setError(result.error || 'Failed to reset password.');
      //   return;
      // }

      // OPTION 2: direct API call — adjust path to your backend
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Failed to reset password.');
        return;
      }

      setSuccess('Your password has been updated successfully.');
      // small delay so they see the success, then go to login
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageBackground>
      <Navbar />
      <main className="relative mx-auto max-w-3xl pt-24 pb-24">
        <div className="mx-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
          <h1 className="mb-2 text-center text-4xl md:text-5xl font-bold tracking-tight text-slate-100">
            Set New Password
          </h1>
          <p className="mb-8 text-center text-sm text-slate-300">
            Choose a strong new password to secure your account.
          </p>

          <div className="mx-auto max-w-xl rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-inner">
            <Field label="New Password:">
              <TextField
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirm Password:">
              <TextField
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            {error && (
              <div className="mt-4 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 text-center text-sm text-emerald-400">
                {success}
              </div>
            )}

            {!token && (
              <div className="mt-4 text-center text-xs text-yellow-300/80">
                The reset link appears to be missing or invalid. You may need to
                request a new password reset email.
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={submit}
              disabled={loading || !token}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-slate-300 hover:text-white"
            >
              Back to Login
            </button>
          </div>
        </div>
      </main>
    </PageBackground>
  );
};

export default ResetPassword;
