// src/pages/JoinMeeting.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';

function extractMeetingId(input: string): string | null {
  const s = input.trim();

  // If they pasted a bare ID (alnum/_/-), accept it
  if (/^[A-Za-z0-9_-]{6,}$/.test(s)) return s;

  // Try common path patterns: /meet/<id>, /meeting/<id>, /landing/<id>
  const pathMatch = s.match(/(?:\/meet(?:ing)?|\/landing)\/([A-Za-z0-9_-]+)/i);
  if (pathMatch?.[1]) return pathMatch[1];

  // Try URL with ?meetingId= or ?id=
  try {
    const u = new URL(s);
    return u.searchParams.get('meetingId') || u.searchParams.get('id');
  } catch {
    /* not a URL */
  }
  return null;
}

export default function JoinMeeting() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractMeetingId(value);
    if (!id) {
      setError('Please paste a valid meeting link or ID.');
      return;
    }
    setError(null);
    // go straight to meeting; or navigate(`/meeting/${id}/landing`) if you have a pre-join step
    navigate(`/meet/${id}`);
  }

  return (
    <PageBackground>
      <Navbar />
      <main className="relative mx-auto max-w-3xl pt-24 pb-24">
        <div className="mx-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8">
          <h1 className="text-center text-3xl md:text-4xl font-bold text-slate-100 mb-6">
            Join a Meeting
          </h1>
          <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
            <label className="block text-slate-300 mb-2">
              Paste link or enter ID
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://yourapp.com/meeting/abc123  or  abc123"
              className="w-full rounded-xl bg-slate-800 text-slate-100 px-4 py-3 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-500 focus:ring-2 focus:ring-blue-400"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => navigate('/menu')}
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
