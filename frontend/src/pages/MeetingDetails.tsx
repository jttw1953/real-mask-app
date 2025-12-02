import { useParams, useNavigate } from 'react-router-dom';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { useAppData } from '../components/useAppData';

export default function MeetingDetails() {
  // Match the route parameter name: meetingID (capital ID)
  const { meetingID } = useParams<{ meetingID: string }>();
  const navigate = useNavigate();
  const { meetings, userData, refreshData } = useAppData();
  const [meeting, setMeeting] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  useEffect(() => {
    const findAndSetMeeting = async () => {
      // Find the meeting by ID (the database primary key)
      const foundMeeting = meetings.find((m) => m.id === Number(meetingID));

      // If not found and we haven't refreshed yet, refresh once
      if (!foundMeeting && !hasRefreshed) {
        setHasRefreshed(true);
        await refreshData();
        return;
      }

      if (foundMeeting) {
        // Parse the UTC meeting time
        const meetingDate = new Date(foundMeeting.meeting_time);

        // Format date and time
        const dateOptions: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        const timeOptions: Intl.DateTimeFormatOptions = {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };

        const formattedDate = meetingDate.toLocaleDateString(
          'en-US',
          dateOptions
        );
        const formattedTime = meetingDate.toLocaleTimeString(
          'en-US',
          timeOptions
        );

        setMeeting({
          title: foundMeeting.meeting_title,
          host: userData?.full_name_enc || 'Unknown Host',
          time: formattedTime,
          date: formattedDate,
          meetingCode: foundMeeting.meeting_code,
          meetingId: foundMeeting.id,
        });
      }
    };

    findAndSetMeeting();
  }, [meetingID, meetings, userData, hasRefreshed, refreshData]);

  if (!meeting) {
    return (
      <PageBackground>
        <Navbar />
        <div className="flex min-h-screen flex-col items-center justify-center text-white text-lg gap-4">
          <p>Meeting not found</p>
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

  const meetingLink = `${window.location.origin}/meet/${meeting.meetingCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  return (
    <PageBackground>
      <Navbar />
      <main className="relative mx-auto max-w-3xl pt-24 pb-24">
        <div className="mx-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8">
          <h1 className="mb-6 text-center text-4xl font-bold text-slate-100">
            Meeting Details
          </h1>

          {/* Main details block */}
          <div className="mx-auto max-w-xl space-y-4 rounded-3xl bg-slate-900/80 px-6 py-6">
            <Row label="Meeting Title" value={meeting.title} />
            <Row label="Date" value={`${meeting.date} — ${meeting.time}`} />
            <Row label="Host" value={meeting.host} />
          </div>

          {/* Meeting link block (with Copy button) */}
          <div className="mx-auto mt-6 max-w-xl rounded-3xl bg-slate-800/80 px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-100">
                Meeting Link
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-full bg-slate-700 px-4 py-1.5 text-sm font-semibold text-slate-100 shadow hover:bg-slate-600"
              >
                {copied ? 'Copied' : 'Copy'}
                <span className="text-lg leading-none">📋</span>
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
              {meetingLink}
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(`/meet/${meeting.meetingCode}`)}
              className="rounded-2xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500"
            >
              Join Meeting
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="text-sm font-semibold text-slate-300 hover:text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    </PageBackground>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-2 text-slate-300">
      <span className="text-sm">{label}</span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}
