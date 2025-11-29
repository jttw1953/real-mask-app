import React, { useState, useEffect } from 'react';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../components/useAppData';
import { supabase } from '../components/supabaseAuth';

type Props = {
  onLogout?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

export default function AccountDetails({ onLogout, onDelete }: Props) {
  const navigate = useNavigate();
  const { userData, refreshData, updateUserName, deleteUser } = useAppData();

  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Update form fields when userData changes
  useEffect(() => {
    if (userData?.full_name_enc) {
      setName(userData.full_name_enc);
    }
  }, [userData]);

  const initialName = userData?.full_name_enc || '';
  const email = userData?.email_enc || '';

  const dirty = name.trim() !== initialName.trim() && name.trim().length > 0;
  const allowSubmit = name.trim().length > 0 && dirty;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!allowSubmit) return;

    const result = await updateUserName(name.trim());

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      alert(`Failed to save: ${result.error}`);
    }
  }

  async function handleLogout() {
    // Sign out from Supabase (clears session/token)
    await supabase.auth.signOut();

    // Call the parent's onLogout if provided
    await onLogout?.();

    // AuthComponent will automatically redirect to /login
  }

  async function handleDelete() {
    const ok = window.confirm(
      'Are you sure you want to permanently delete your account? This cannot be undone.'
    );
    if (!ok) return;

    const result = await deleteUser();

    if (result.success) {
      await onDelete?.();
      navigate('/');
    } else {
      alert(`Failed to delete account: ${result.error}`);
    }
  }

  function handleResetPassword() {
    // TODO: Add your reset password page route here
    // Example: navigate('/reset-password');
    navigate('/reset-password');
  }

  return (
    <PageBackground>
      <Navbar />

      <main className="relative mx-auto max-w-3xl pt-20 pb-24">
        <h1 className="text-center text-4xl md:text-5xl font-bold tracking-tight text-slate-100">
          Account Details
        </h1>
        <p className="mt-2 text-center text-slate-300">
          Manage your profile and overlay preferences
        </p>

        <form
          onSubmit={handleSave}
          className="mx-6 mt-8 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
        >
          <div className="mx-auto max-w-xl rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-inner">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-slate-200">
                Personal Information
              </h2>
              <div className="mx-auto mt-2 h-[2px] w-48 rounded bg-white/30" />
            </div>

            {/* Full Name */}
            <label className="block text-sm text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full rounded-xl bg-slate-900 text-slate-100 placeholder:text-slate-500 px-4 py-3 outline-none ring-1 ring-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />

            {/* Email (Read-only) */}
            <label className="block text-sm text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="mb-4 w-full rounded-xl bg-slate-800/50 text-slate-300 placeholder:text-slate-500 px-4 py-3 outline-none ring-1 ring-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] cursor-not-allowed"
              placeholder="name@example.com"
            />

            {/* Reset Password Button */}
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full rounded-xl bg-slate-700 px-4 py-3 text-white font-semibold shadow hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Reset Password
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="submit"
                disabled={!allowSubmit}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saved ? 'Saved ✓' : 'Save Details'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-slate-700 px-6 py-3 text-white font-semibold shadow hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Logout
              </button>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              className="mt-2 rounded-2xl bg-red-600 px-6 py-3 text-white font-semibold shadow hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Delete account
            </button>
          </div>
        </form>
      </main>
    </PageBackground>
  );
}
