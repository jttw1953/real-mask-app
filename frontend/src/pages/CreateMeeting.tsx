import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';
import Field from '../components/Field';
import TextField from '../components/TextField';
import TimeSelect from '../components/TimeSelect';
import DateField from '../components/DateField';
import { useAppData } from '../components/useAppData';
import {
  combineLocalDateTimeToUtc,
  getDefaultDateTime,
} from '../assets/timeUtils';
import { generateMeetingCode } from '../components/GenerateMeetingCode';

export interface CreateMeetingPayload {
  title: string;
  date: Date;
  timeLabel: string;
}

interface CreateMeetingProps {
  onCreate?: (payload: CreateMeetingPayload) => void;
  onBack?: () => void;
}

const CreateMeeting: React.FC<CreateMeetingProps> = ({ onCreate, onBack }) => {
  const navigate = useNavigate();
  const { createMeeting, userData, meetings, refreshData } = useAppData();

  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get default date and time rounded to next 15-minute interval
  const { date: defaultDate, timeString: defaultTime } = getDefaultDateTime();

  const [time, setTime] = useState<string>(defaultTime);
  const [date, setDate] = useState<Date>(defaultDate);

  // Load meetings when component mounts
  useEffect(() => {
    refreshData();
  }, []);

  const submit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    // Validate title
    if (!title.trim()) {
      setError('Please enter a meeting title');
      setIsSubmitting(false);
      return;
    }

    // Refresh meetings data to ensure we have the latest
    await refreshData();

    // Convert local date + time to UTC ISO string for the new meeting
    const meetingTimeUtc = combineLocalDateTimeToUtc(date, time);

    // Check for duplicate meeting time by comparing timestamps
    const newMeetingTimestamp = new Date(meetingTimeUtc).getTime();
    
    const isDuplicate = meetings?.some((meeting) => {
      const existingTimestamp = new Date(meeting.meeting_time).getTime();
      return existingTimestamp === newMeetingTimestamp;
    });

    if (isDuplicate) {
      setError('A meeting is already scheduled at this date and time. Please choose a different time.');
      setIsSubmitting(false);
      return;
    }

    // Generate meeting code using date, time, and user UUID
    const meetingCode = generateMeetingCode(date, time, userData.id);

    // Call the createMeeting function from useAppData
    const result = await createMeeting(meetingCode, meetingTimeUtc, title);

    if (result.success) {
      const meetingId = (result as any).meetingId;
      
      if (!meetingId) {
        setError('Meeting created but ID not returned');
        setIsSubmitting(false);
        return;
      }

      // Call optional callback
      const localDateTime = new Date(date);
      const [timePart, period] = time.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      let finalHours = hours;
      if (period === 'PM' && hours !== 12) finalHours += 12;
      else if (period === 'AM' && hours === 12) finalHours = 0;
      localDateTime.setHours(finalHours, minutes, 0, 0);

      onCreate?.({ title, date: localDateTime, timeLabel: time });

      // Navigate to the Meeting Details page using the database ID
      navigate(`/meeting-details/${meetingId}`);
    } else {
      setError(result.error || 'Failed to create meeting');
      setIsSubmitting(false);
    }
  };

  return (
    <PageBackground>
      <Navbar />
      <main className="relative mx-auto max-w-3xl pt-24 pb-24">
        <div className="mx-6 rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
          <h1 className="text-center text-4xl md:text-5xl font-bold tracking-tight text-slate-100 mb-8">
            Meeting Details
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
              <div className="mt-4 text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Meeting'}
            </button>
            <button
              onClick={() => (onBack ? onBack() : navigate('/menu'))}
              className="text-slate-300 hover:text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    </PageBackground>
  );
};

export default CreateMeeting;