import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestNavbar from '../components/GuestNavBar';

export default function Signup() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [touched, setTouched] = useState<{ pw2?: boolean }>({});
  const [error, setError] = useState('');
  const API_URL = 'http://localhost:3000';

  const passwordsMatch = pw.length > 0 && pw2.length > 0 && pw === pw2;
  const canSubmit =
    first.trim() &&
    last.trim() &&
    email.trim() &&
    pw.trim() &&
    pw2.trim() &&
    passwordsMatch;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(''); // Clear previous errors

    try {
      const userData = {
        full_name: `${first.trim()} ${last.trim()}`,
        email: email.trim(),
        password: pw.trim(),
      };

      const response = await fetch(`${API_URL}/api/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to create user';

        // Reset all fields when there's an error
        setFirst('');
        setLast('');
        setEmail('');
        setPw('');
        setPw2('');
        setTouched({});

        // Set error AFTER resetting fields to ensure state updates properly
        setError(errorMessage);
        return;
      }

      console.log('User created successfully');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);

      // Reset all fields on network error too
      setFirst('');
      setLast('');
      setEmail('');
      setPw('');
      setPw2('');
      setTouched({});

      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0F172A] text-slate-100">
      <GuestNavbar />

      {/* subtle background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-start justify-center px-4 pt-24">
        <section className="w-full max-w-[560px] rounded-2xl border border-white/15 bg-slate-800/40 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-md ring-1 ring-white/5">
          <header className="mb-6 text-center">
            <h1 className="text-4xl font-extrabold">Create your account</h1>
            <p className="mt-1 text-slate-300 font-semibold">
              It takes less than a minute
            </p>
          </header>

          {/* Error message display */}
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            {/* First Name */}
            <div className="space-y-1.5">
              <label htmlFor="first" className="text-sm text-slate-300">
                First name:
              </label>
              <input
                id="first"
                type="text"
                autoComplete="given-name"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="Enter your first name"
                className="w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label htmlFor="last" className="text-sm text-slate-300">
                Last name:
              </label>
              <input
                id="last"
                type="text"
                autoComplete="family-name"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Enter your last name"
                className="w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm text-slate-300">
                Email:
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="pw" className="text-sm text-slate-300">
                Password:
              </label>
              <input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>

            {/* Re-confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="pw2" className="text-sm text-slate-300">
                Reconfirm password:
              </label>
              <input
                id="pw2"
                type="password"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw2: true }))}
                placeholder="Re-enter your password"
                className={`w-full rounded-lg border px-3 py-2 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] bg-slate-900/60 focus:outline-none focus:ring-2 ${
                  touched.pw2 && pw2 && pw !== pw2
                    ? 'border-rose-500/70 focus:ring-rose-500/60'
                    : 'border-slate-700/70 focus:ring-indigo-500/60'
                }`}
              />
              {touched.pw2 && pw2 && pw !== pw2 && (
                <p className="text-sm text-rose-400">Passwords don't match.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-2 w-full rounded-lg px-4 py-2 font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 ${
                canSubmit
                  ? 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400'
                  : 'bg-indigo-600/50 cursor-not-allowed'
              }`}
            >
              Create account
            </button>

            {/* Secondary: already have account */}
            <div className="mt-0 text-center">
              <a
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-slate-200"
              >
                Already have an account? Sign in
              </a>
            </div>
            {/* New Cancel button */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-0 w-full rounded-lg border border-slate-700/60 bg-transparent px-4 py-2 font-semibold text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200"
            >
              Cancel
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
