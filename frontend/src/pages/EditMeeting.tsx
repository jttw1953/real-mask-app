// src/pages/EditMeeting.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';
import Field from '../components/Field';
import TextField from '../components/TextField';
import TimeSelect from '../components/TimeSelect';
import DateField from '../components/DateField';
import { useAppData } from '../components/useAppData';
import { utcToLocal, combineLocalDateTimeToUtc } from '../assets/timeUtils';
import { generateMeetingCode } from '../components/GenerateMeetingCode';
import type { Meeting } from '../types/meetingType';

const EditMeeting: React.FC = () => {
  // Matches route: /edit-meeting/:meetingId
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const { meetings, refreshData, updateMeeting, userData } = useAppData();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>('10:00 AM');
  const [originalDateTime, setOriginalDateTime] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Load meeting using the same pattern as MeetingDetails ---
  useEffect(() => {
    const load = async () => {
      if (!meetingId) {
        setError('No meeting ID provided.');
        setLoading(false);
        return;
      }

      const idNum = Number(meetingId);
      if (Number.isNaN(idNum)) {
        setError('Invalid meeting ID.');
        setLoading(false);
        return;
      }

      const found = meetings.find((m) => m.id === idNum);

      if (!found && !hasRefreshed) {
        setHasRefreshed(true);
        await refreshData();
        return;
      }

      if (found) {
        setMeeting(found);
        setTitle(found.meeting_title);

        // Convert stored UTC time to local date & time string
        const localDate = utcToLocal(found.meeting_time);
        setDate(localDate);

        const hours = localDate.getHours();
        const minutes = localDate.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const timeStr = `${displayHours}:${minutes} ${period}`;
        setTime(timeStr);

        // Store original date/time to detect changes
        setOriginalDateTime(found.meeting_time);

        setLoading(false);
      } else if (hasRefreshed) {
        setError('Meeting not found.');
        setLoading(false);
      }
    };

    load();
  }, [meetingId, meetings, hasRefreshed, refreshData]);

  // --- Save updated meeting (no direct fetch; use updateMeeting from useAppData) ---
  const handleSave = async () => {
    if (!meeting) return;

    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert local date + time -> UTC ISO string
      const meetingTimeUtc = combineLocalDateTimeToUtc(date, time);

      // Check if date or time changed by comparing the UTC strings
      const dateTimeChanged = meetingTimeUtc !== originalDateTime;

      // Prepare update data
      const updateData: {
        meeting_title: string;
        meeting_time: string;
        meeting_code?: string;
      } = {
        meeting_title: title,
        meeting_time: meetingTimeUtc,
      };

      // Only regenerate meeting code if date or time changed
      if (dateTimeChanged) {
        const newMeetingCode = generateMeetingCode(date, time, userData.id);
        updateData.meeting_code = newMeetingCode;
      }

      const result = await updateMeeting(meeting.id, updateData);

      if (!result.success) {
        setError(result.error || 'Failed to update meeting');
        setSaving(false);
        return;
      }

      // Refresh local data + go back to details page
      await refreshData();
      navigate(`/meeting-details/${meeting.id}`);
    } catch (err) {
      console.error(err);
      setError('Unexpected error while updating meeting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageBackground>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center text-white text-lg">
          Loading meeting...
        </div>
      </PageBackground>
    );
  }

  if (!meeting) {
    return (
      <PageBackground>
        <Navbar />
        <div className="flex min-h-screen flex-col items-center justify-center text-white text-lg gap-4">
          <p>{error || 'Meeting not found.'}</p>
          <button
            onClick={() => navigate('/menu')}
            className="text-sm font-semibold text-slate-300 hover:text-white"
          >
            Go Back to Menu
          </button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <Navbar />
      <main className="relative mx-auto max-w-3xl pt-24 pb-24">
        <div className="mx-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8">
          <h1 className="text-center text-4xl font-bold text-slate-100 mb-8">
            Edit Meeting
          </h1>

          <div className="mx-auto max-w-2xl rounded-3xl border border-white/5 bg-slate-900/60 p-6 shadow-inner">
            <Field label="Meeting Title:">
              <TextField
                placeholder="Enter Meeting Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <Field label="Meeting Time:">
              <TimeSelect value={time} onChange={setTime} />
            </Field>

            <Field label="Meeting Date:">
              <DateField value={date} onChange={setDate} />
            </Field>

            {error && (
              <div className="mt-4 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => navigate(`/meeting-details/${meeting.id}`)}
              className="text-slate-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </PageBackground>
  );
};

export default EditMeeting;
