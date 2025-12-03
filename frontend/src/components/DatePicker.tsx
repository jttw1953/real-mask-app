import React, { useMemo, useState } from "react";

function classNames(...cls: (string | false | null | undefined)[]): string {
  return cls.filter(Boolean).join(" ");
}


export interface DatePickerProps {
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
  const [cursor, setCursor] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  const weeks = useMemo(() => {
    const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7)); // Monday-first

    const end = new Date(lastDay);
    end.setDate(lastDay.getDate() + (7 - ((lastDay.getDay() + 6) % 7) - 1));

    const rows: Date[][] = [];
    const d = new Date(start);
    while (d <= end) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      rows.push(row);
    }
    return rows;
  }, [cursor]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="absolute z-30 mt-2 rounded-2xl border border-white/10 bg-slate-800/90 shadow-2xl backdrop-blur p-3 w-80 select-none">
      {/* Header with month and navigation */}
      <div className="flex items-center justify-between px-2 pb-2 text-slate-200">
        <div className="flex items-center gap-1">
          {/* << jump -1 year */}
          <button
            className="p-2 rounded-xl hover:bg-white/5"
            aria-label="Previous year"
            onClick={() => setCursor(new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1))}
          >
            {/* double chevron left */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 19l-7-7 7-7" />
              <path d="M20 19l-7-7 7-7" />
            </svg>
          </button>
          {/* < month */}
          <button
            className="p-2 rounded-xl hover:bg-white/5"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="text-sm font-medium tracking-wide">{monthLabel}</div>

        <div className="flex items-center gap-1">
          {/* > month */}
          <button
            className="p-2 rounded-xl hover:bg-white/5"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          {/* >> jump +1 year */}
          <button
            className="p-2 rounded-xl hover:bg-white/5"
            aria-label="Next year"
            onClick={() => setCursor(new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1))}
          >
            {/* double chevron right */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19l7-7-7-7" />
              <path d="M4 19l7-7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday headings */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400 px-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-1 p-1">
        {weeks.map((row, i) => (
          <React.Fragment key={i}>
            {row.map((d) => {
              const isCurrentMonth = d.getMonth() === cursor.getMonth();
              const isSelected = d.toDateString() === value.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => { onChange(new Date(d.getFullYear(), d.getMonth(), d.getDate())); onClose(); }}
                  className={classNames(
                    "h-9 rounded-xl text-sm",
                    isSelected && "bg-blue-600 text-white shadow",
                    !isSelected && isCurrentMonth && "text-slate-200 hover:bg-white/5",
                    !isCurrentMonth && "text-slate-500 hover:bg-white/5"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DatePicker;
