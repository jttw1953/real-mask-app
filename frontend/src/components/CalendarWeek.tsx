import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Meeting } from '../types/meetingType';
import { utcToLocal, formatMeetingTime } from '../assets/timeUtils';

type CalendarWeekProps = {
  meetings?: Meeting[];
  heightClass?: string;
  start?: Date;
  onDeleteMeeting?: (
    meetingId: number
  ) => Promise<{ success: boolean; error?: string }>;
};

export default function CalendarWeek({
  meetings = [],
  heightClass = 'h-[26rem]',
  start,
  onDeleteMeeting,
}: CalendarWeekProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const today = start ? new Date(start) : new Date();

  // Build 7 days starting with "today"
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [today]);

  // helper: "YYYY-MM-DD"
  const ymd = (d: Date) => {
    return format(d, 'yyyy-MM-dd');
  };

  // group meetings by day (in user's local timezone)
  const meetingsByDay = useMemo(() => {
    const daySet = new Set(days.map((d) => ymd(d)));
    const map: Record<string, Meeting[]> = {};

    meetings.forEach((m) => {
      // Convert UTC meeting time to local timezone
      const localDate = utcToLocal(m.meeting_time);
      const key = ymd(localDate);

      if (!daySet.has(key)) return;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });

    // Sort meetings by time within each day
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const ta = new Date(a.meeting_time).getTime();
        const tb = new Date(b.meeting_time).getTime();
        return ta - tb;
      });
    });

    return map;
  }, [meetings, days]);

  const dayLabel = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateLabel = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();

  const [menuState, setMenuState] = useState<{
    open: boolean;
    meeting: Meeting | null;
    anchor: { x: number; y: number } | null;
  }>({
    open: false,
    meeting: null,
    anchor: null,
  });

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    meeting: Meeting | null;
  }>({
    open: false,
    meeting: null,
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleMeetingClick(e: React.MouseEvent, meeting: Meeting) {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    setMenuState({
      open: true,
      meeting,
      anchor: {
        x: rect.right - containerRect.left + 8,
        y: rect.top - containerRect.top,
      },
    });
  }

  function closeMenu() {
    setMenuState({ open: false, meeting: null, anchor: null });
  }

  function openDeleteConfirm() {
    setConfirmState({ open: true, meeting: menuState.meeting });
    setDeleteError(null);
    closeMenu();
  }

  function closeDeleteConfirm() {
    setConfirmState({ open: false, meeting: null });
    setDeleteError(null);
  }

  function onView(meeting: Meeting) {
    navigate(`/meeting-details/${meeting.id}`);
  }

  // ⬇️ Updated to go to edit-meeting/:meetingId
  function onEdit(meeting: Meeting) {
    navigate(`/edit-meeting/${meeting.id}`);
  }

  function onJoin(meeting: Meeting) {
    navigate(`/meet/${meeting.meeting_code}`);
  }

  async function onDeleteConfirmed(meeting: Meeting | null) {
    if (!meeting || !onDeleteMeeting) return;
    const result = await onDeleteMeeting(meeting.id);
    if (result.success) closeDeleteConfirm();
    else setDeleteError(result.error || 'Failed to delete meeting');
  }

  return (
    <>
      <section
        ref={containerRef}
        className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] p-6 overflow-hidden"
      >
        {/* 7-day columns */}
        <div
          className={`grid grid-cols-7 gap-0 ${heightClass} relative text-[14px]`}
        >
          {days.map((d, idx) => {
            const key = ymd(d);
            const dayMeetings = meetingsByDay[key] || [];
            return (
              <div key={idx} className="relative">
                <div className="absolute inset-0 rounded-md bg-white/[0.06] ring-1 ring-white/10" />
                <div className="relative p-3">
                  <span
                    className={[
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold',
                      isToday(d)
                        ? 'bg-sky-500/25 text-sky-100 ring-1 ring-sky-400/40'
                        : 'bg-white/10 text-slate-300 ring-1 ring-white/10',
                    ].join(' ')}
                  >
                    {dayLabel(d)}
                    <span
                      className={isToday(d) ? 'text-white' : 'text-slate-200'}
                    >
                      {dateLabel(d)}
                    </span>
                  </span>
                </div>

                <div className="relative flex flex-col gap-2 px-3 pt-1">
                  {dayMeetings.map((m) => (
                    <button
                      key={m.id}
                      onClick={(e) => handleMeetingClick(e, m)}
                      className="relative flex flex-col rounded-xl bg-blue-500/80 text-white text-left shadow-lg px-3 py-2 hover:brightness-110"
                    >
                      <div className="text-[13px] font-semibold leading-tight">
                        {formatMeetingTime(m.meeting_time)}
                      </div>
                      <div className="text-[13px] leading-tight truncate">
                        {m.meeting_title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* context menu */}
        {menuState.open && menuState.meeting && menuState.anchor && (
          <div
            className="absolute z-30 rounded-xl bg-slate-800 text-white text-sm shadow-2xl ring-1 ring-black/50"
            style={{
              top: menuState.anchor.y,
              left: menuState.anchor.x,
            }}
          >
            <div className="flex flex-col px-3 py-2 min-w-[100px]">
              <button
                className="text-left px-2 py-1 hover:bg-slate-700 rounded-md"
                onClick={() => {
                  onView(menuState.meeting!);
                  closeMenu();
                }}
              >
                View
              </button>
              <button
                className="text-left px-2 py-1 hover:bg-slate-700 rounded-md"
                onClick={() => {
                  onEdit(menuState.meeting!);
                  closeMenu();
                }}
              >
                Edit
              </button>
              <button
                className="text-left px-2 py-1 hover:bg-slate-700 rounded-md text-red-400"
                onClick={openDeleteConfirm}
              >
                Delete
              </button>
              <button
                className="text-left px-2 py-1 hover:bg-slate-700 rounded-md"
                onClick={() => {
                  onJoin(menuState.meeting!);
                  closeMenu();
                }}
              >
                Join
              </button>
            </div>
          </div>
        )}

        {/* click-away overlay */}
        {menuState.open && (
          <div className="absolute inset-0 z-20" onClick={closeMenu} />
        )}
      </section>

      {/* delete confirm modal */}
      {confirmState.open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10 p-6">
            <div className="text-lg font-semibold mb-2">
              Delete this meeting?
            </div>
            <div className="text-slate-300 text-sm mb-6 break-words">
              {confirmState.meeting?.meeting_title}
            </div>
            {deleteError && (
              <div className="text-red-400 text-sm mb-4">{deleteError}</div>
            )}
            <div className="flex justify-end gap-3 text-sm">
              <button
                className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600"
                onClick={closeDeleteConfirm}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-600 px-3 py-2 hover:bg-red-500"
                onClick={() => onDeleteConfirmed(confirmState.meeting ?? null)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
