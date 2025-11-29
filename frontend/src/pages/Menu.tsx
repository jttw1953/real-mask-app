import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarWeek from '../components/CalendarWeek';
import PageBackground from '../components/PageBackground';
import { useAppData } from '../components/useAppData';
import { generateInstantMeetingCode } from '../components/GenerateMeetingCode';

export default function MenuPage() {
  const navigate = useNavigate();
  const { meetings, deleteMeeting, userData, refreshData } = useAppData();

  // dropdown state for Create Meeting tile
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateNow = () => {
    setShowCreateOptions(false);

    // Generate instant meeting code using user's UUID
    const meetingCode = generateInstantMeetingCode(userData.id);
    

    // Navigate directly to the meeting page with the generated code
    navigate(`/meet/${meetingCode}`);
  };

  return (
    <PageBackground>
      <section className="relative mx-auto max-w-7xl px-6 py-20 text-slate-100">
        {/* background glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-3xl" />
        </div>

        <div className="relative">
          <div className="grid grid-cols-[280px_1fr] items-start gap-10">
            {/* LEFT SIDE BUTTON STACK */}
            <div className="grid h-[26rem] grid-rows-3 gap-6">
              {/* Join Meeting */}
              <ActionTile
                color="from-indigo-600 to-violet-600"
                icon={PlusIcon}
                labelTop="Join"
                labelBottom="Meeting"
                onClick={() => navigate('/join')}
              />

              {/* Create Meeting w/ menu */}
              <div className="relative">
                <ActionTile
                  color="from-fuchsia-600 to-violet-700"
                  icon={VideoIcon}
                  labelTop="Create"
                  labelBottom="Meeting"
                  onClick={() => setShowCreateOptions(!showCreateOptions)}
                />

                {showCreateOptions && (
                  <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 shadow-xl">
                    <button
                      onClick={handleCreateNow}
                      className="w-full text-left px-4 py-3 text-slate-100 hover:bg-slate-700 transition rounded-t-xl"
                    >
                      Create Now
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateOptions(false);
                        // schedule for later -> existing create flow
                        navigate('/create-meeting');
                      }}
                      className="w-full text-left px-4 py-3 text-slate-100 hover:bg-slate-700 transition rounded-b-xl"
                    >
                      Schedule for Later
                    </button>
                  </div>
                )}
              </div>

              {/* Schedule (Calendar page) */}
              <ActionTile
                color="from-purple-700 to-violet-800"
                icon={CalendarIcon}
                labelTop="Schedule"
                onClick={() => navigate('/calendar')}
              />
            </div>

            {/* RIGHT SIDE WEEK VIEW */}
            <div className="relative">
              <CalendarWeek
                heightClass="h-[26rem]"
                meetings={meetings}
                onDeleteMeeting={deleteMeeting}
              />
            </div>
          </div>
        </div>
      </section>
    </PageBackground>
  );
}

/* ---------- ActionTile & Icons ---------- */

type ActionTileProps = {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  labelTop: string;
  labelBottom?: string;
  onClick?: () => void;
};

function ActionTile({
  color,
  icon: Icon,
  labelTop,
  labelBottom,
  onClick,
}: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full w-full items-center gap-5 rounded-2xl p-4 text-left transition hover:translate-x-0.5"
    >
      <div
        className={`grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br ${color}
                    ring-1 ring-white/15 shadow-lg`}
      >
        <Icon className="h-10 w-10 text-white/95" />
      </div>
      <div className="leading-tight">
        <div className="text-slate-200 text-lg font-semibold">{labelTop}</div>
        {labelBottom ? (
          <div className="text-slate-300 text-lg font-semibold">
            {labelBottom}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="currentColor"
        opacity=".22"
      />
      <path
        d="M12 7v10M7 12h10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="3"
        fill="currentColor"
        opacity=".22"
      />
      <path d="M16 10l4-2v8l-4-2" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
        fill="currentColor"
        opacity=".22"
      />
      <path
        d="M3 9h18M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
