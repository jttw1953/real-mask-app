import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import PageBackground from '../components/PageBackground';
import { useAppData } from '../components/useAppData';
import type { Meeting } from '../types/meetingType';
import { utcToLocal, formatMeetingTime } from '../assets/timeUtils';

export default function CalendarView(): React.ReactElement {
  const { meetings } = useAppData();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // Map of "M/D/YYYY" -> Meeting[]
  const [meetingMap, setMeetingMap] = useState<Map<string, Meeting[]>>(
    () => new Map()
  );

  // Build meeting map from useAppData meetings (convert to local timezone)
  useEffect(() => {
    const map = new Map<string, Meeting[]>();

    meetings.forEach((m) => {
      console.log('=== Meeting Debug ===');
      console.log('Meeting title:', m.meeting_title);
      console.log('Raw meeting time from DB:', m.meeting_time);

      // Convert UTC meeting time to local timezone
      const localDate = utcToLocal(m.meeting_time);
      console.log('Converted local date:', localDate);
      console.log('Local date string:', localDate.toString());
      console.log('Formatted time:', formatMeetingTime(m.meeting_time));

      const key = buildDateKey(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate()
      );
      console.log('Date key:', key);
      console.log('===================');

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(m);
    });

    setMeetingMap(map);
  }, [meetings]);

  function buildDateKey(year: number, monthIndex: number, day: number): string {
    return `${monthIndex + 1}/${day}/${year}`;
  }

  function getDaysInMonth(monthIndex: number, year: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  // For sidebar: meetings on currently selected date
  const meetingsForSelectedDate = useMemo(() => {
    const key = buildDateKey(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    return meetingMap.get(key) || [];
  }, [meetingMap, selectedDate]);

  // sidebar header string (like "Thu 10/30")
  function formatSidebarDate(d: Date): string {
    return format(d, 'EEE M/d');
  }

  const daysInThisMonth = getDaysInMonth(currentMonth, currentYear);

  // Calculate the day of week for the 1st (0=Sunday, 1=Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Use Sunday as first day (no conversion needed, getDay() already returns 0 for Sunday)
  const firstDayOffset = firstDayOfMonth;

  const calendarDayCells: React.ReactNode[] = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOffset; i++) {
    calendarDayCells.push(
      React.createElement('div', {
        key: `empty-${i}`,
        style: { height: '48px', width: '48px' },
      })
    );
  }

  // Add the actual day buttons
  for (let dayNum = 1; dayNum <= daysInThisMonth; dayNum++) {
    const key = buildDateKey(currentYear, currentMonth, dayNum);
    const hasMeetings = (meetingMap.get(key)?.length || 0) > 0;

    const isToday =
      today.getDate() === dayNum &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear;

    const isSelected =
      selectedDate.getDate() === dayNum &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear;

    const dayButton = React.createElement(
      'button',
      {
        key: dayNum,
        onClick: () => {
          setSelectedDate(new Date(currentYear, currentMonth, dayNum));
        },
        style: {
          height: '48px',
          width: '48px',
          borderRadius: '9999px',
          backgroundColor: isToday
            ? '#2563eb'
            : isSelected
            ? 'rgba(255,255,255,0.1)'
            : 'transparent',
          color: isToday ? '#ffffff' : isSelected ? '#ffffff' : '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: isSelected && !isToday ? '1.5px solid #64748b' : 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '0.9rem',
          lineHeight: 1.2,
          transition: 'all 0.15s ease-in-out',
        },
      },
      [
        React.createElement(
          'span',
          {
            key: 'num',
            style: { fontWeight: isToday || isSelected ? 600 : 400 },
          },
          String(dayNum)
        ),
        hasMeetings
          ? React.createElement('span', {
              key: 'dot',
              style: {
                marginTop: '4px',
                width: '5px',
                height: '5px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
              },
            })
          : null,
      ]
    );

    calendarDayCells.push(dayButton);
  }

  const calendarGrid = React.createElement(
    'div',
    {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        justifyItems: 'center',
      },
    },
    calendarDayCells
  );

  // Sidebar meeting cards for selected date
  const sidebarMeetingCards =
    meetingsForSelectedDate.length > 0
      ? meetingsForSelectedDate.map((m) =>
          React.createElement(
            'div',
            {
              key: m.id,
              style: {
                backgroundColor: 'rgba(59,130,246,0.85)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '12px',
                width: '100%',
                boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                marginBottom: '12px',
              },
            },
            [
              React.createElement(
                'div',
                {
                  key: 'time',
                  style: {
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    lineHeight: 1.2,
                    marginBottom: '4px',
                  },
                },
                formatMeetingTime(m.meeting_time)
              ),
              React.createElement(
                'div',
                {
                  key: 'title',
                  style: {
                    fontSize: '0.9rem',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                  },
                },
                m.meeting_title
              ),
            ]
          )
        )
      : [
          React.createElement(
            'div',
            {
              key: 'none',
              style: {
                textAlign: 'center',
                color: '#475569',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                paddingTop: '32px',
              },
            },
            'No meetings'
          ),
        ];

  const calendarCard = React.createElement(
    'div',
    {
      style: {
        backgroundColor: 'rgba(30,41,59,0.8)',
        color: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        width: '480px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        border: '1px solid rgba(15,23,42,0.7)',
        backdropFilter: 'blur(6px)',
      },
    },
    [
      React.createElement(
        'div',
        {
          key: 'header',
          style: {
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: '1rem',
            marginBottom: '16px',
            gap: '4px',
          },
        },
        [
          React.createElement(
            'button',
            {
              key: 'prev-year',
              onClick: () => setCurrentYear((y) => y - 1),
              style: {
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '4px 6px',
              },
            },
            '«'
          ),
          React.createElement(
            'button',
            {
              key: 'prev-month',
              onClick: () => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((y) => y - 1);
                } else {
                  setCurrentMonth((m) => m - 1);
                }
              },
              style: {
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '4px 6px',
              },
            },
            '<'
          ),
          React.createElement(
            'span',
            {
              key: 'label',
              style: { flex: 1, textAlign: 'center' },
            },
            format(new Date(currentYear, currentMonth), 'MMMM yyyy')
          ),
          React.createElement(
            'button',
            {
              key: 'next-month',
              onClick: () => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((y) => y + 1);
                } else {
                  setCurrentMonth((m) => m + 1);
                }
              },
              style: {
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '4px 6px',
              },
            },
            '>'
          ),
          React.createElement(
            'button',
            {
              key: 'next-year',
              onClick: () => setCurrentYear((y) => y + 1),
              style: {
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '4px 6px',
              },
            },
            '»'
          ),
        ]
      ),
      React.createElement(
        'div',
        {
          key: 'weekday-row',
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '12px',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: 500,
            lineHeight: '40px',
            color: '#94a3b8',
          },
        },
        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label, idx) =>
          React.createElement(
            'div',
            {
              key: `weekday-${idx}`,
              style: {
                color: idx === 0 || idx === 6 ? '#60a5fa' : '#94a3b8',
                height: '40px',
              },
            },
            label
          )
        )
      ),
      calendarGrid,
    ]
  );

  const sidebarCard = React.createElement(
    'div',
    {
      style: {
        backgroundColor: '#e2e8f0',
        color: '#1e293b',
        borderRadius: '20px',
        padding: '16px',
        width: '240px',
        height: '400px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
      },
    },
    [
      React.createElement(
        'div',
        {
          key: 'sel-date',
          style: {
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.9rem',
            lineHeight: 1.4,
            color: '#475569',
            marginBottom: '12px',
            whiteSpace: 'pre-line',
          },
        },
        formatSidebarDate(selectedDate)
      ),
      React.createElement(
        'div',
        {
          key: 'meeting-list',
          style: {
            flex: 1,
            overflowY: 'auto',
          },
        },
        sidebarMeetingCards
      ),
    ]
  );

  const contentRow = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '48px 24px',
        color: '#fff',
        maxWidth: '1280px',
        margin: '0 auto',
      },
    },
    [calendarCard, sidebarCard]
  );

  return React.createElement(PageBackground, null, contentRow);
}