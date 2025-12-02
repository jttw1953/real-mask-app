import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestNavbar from '../components/GuestNavBar';
import { supabase } from '../components/supabaseAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const canSubmit = email.trim() && pw.trim();

  useEffect(() => {
    // If already logged in, redirect to menu
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/menu');
      }
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw.trim(),
      });

      if (error) {
        alert(error.message);
        setEmail('');
        setPw('');
      } else {
        // Success - navigate to menu
        navigate('/menu');
      }
    } catch (err) {
      alert('An unexpected error occurred');
      setEmail('');
      setPw('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0F172A] text-slate-100">
      <GuestNavbar />

      {/* background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-start justify-center px-4 pt-24">
        <section className="w-full max-w-[560px] rounded-2xl border border-white/15 bg-slate-800/40 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-md ring-1 ring-white/5">
          <header className="mb-6 text-center">
            <h1 className="text-4xl font-extrabold">Welcome Back</h1>
            <p className="mt-1 text-slate-300 font-semibold">
              Sign in to your account
            </p>
          </header>

          <form className="space-y-4" onSubmit={onSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm text-slate-300">
                Email:
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm text-slate-300">
                Password:
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password:"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="mx-auto block w-max text-sm text-slate-400 hover:text-slate-300"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary - REMOVED onClick that was bypassing auth */}
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="my-4 flex items-center justify-center gap-4">
              <span className="h-px w-1/3 bg-white/20" />
              <span className="text-sm text-slate-400">or</span>
              <span className="h-px w-1/3 bg-white/20" />
            </div>

            {/* Secondary actions */}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-1/2 rounded-lg border border-white/15 bg-slate-800/60 px-4 py-2 font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700/60"
              >
                Sign Up
              </button>

              <button
                type="button"
                onClick={() => navigate('/join-as-guest')}
                className="w-1/2 rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Join meeting as guest
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
