import React, { useState } from 'react';
import PageBackground from '../components/PageBackground';
import GuestNavbar from '../components/GuestNavBar';

type Props = {
  onSubmit?: (email: string) => Promise<void> | void;
  onBack?: () => void;
};

export default function ForgotPassword({ onSubmit, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email) || loading) return;
    try {
      setLoading(true);
      await onSubmit?.(email.trim());
      // You can show a toast here if you have one
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageBackground>
      <GuestNavbar />

      <main className="relative mx-auto max-w-3xl pt-24 pb-24">
        <div className="mx-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-xl rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-inner"
          >
            {/* Header pill */}
            <div className="mb-5 rounded-2xl bg-slate-800/70 px-5 py-4 text-slate-200 text-lg font-medium">
              Enter your email to get a link to reset your password
            </div>

            {/* Email input */}
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 text-slate-100 placeholder:text-slate-500 px-4 py-3 outline-none ring-1 ring-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
            />

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="submit"
                disabled={!isValidEmail(email) || loading}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Get Password'}
              </button>
              <button
                type="button"
                onClick={() => (onBack ? onBack() : window.history.back())}
                className="text-slate-300 hover:text-white"
              >
                Go Back
              </button>
            </div>
          </form>
        </div>
      </main>
    </PageBackground>
  );
}
