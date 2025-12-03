import React, { useEffect, useMemo, useRef, useState } from "react";

function classNames(...cls: (string | false | null | undefined)[]): string {
  return cls.filter(Boolean).join(" ");
}

function to12h(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function from12h(label: string): { hours: number; minutes: number } | null {
  // Accepts "1:00 PM" or "1:00pm" etc.
  const m = label
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  const minutes = parseInt(m[2], 10);
  if (m[3] === "PM") h += 12;
  return { hours: h, minutes };
}

const allSlots = (() => {
  // Precompute 96 quarter-hour labels starting at 00:00
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 96; i++) {
    out.push(to12h(d));
    d.setMinutes(d.getMinutes() + 15);
  }
  return out;
})();

function rotateSlotsToStartAt(value: string): string[] {
  const i = allSlots.findIndex(
    (s) =>
      s.toUpperCase() ===
      value.trim().toUpperCase().replace(/\s+/g, " ")
  );
  if (i <= 0) return allSlots; // not found or already first -> default order
  return [...allSlots.slice(i), ...allSlots.slice(0, i)];
}

export default function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<string>(value);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Normalize displayed label (keeps consistent “X:YY AM/PM” spacing)
  const display = useMemo(() => {
    const parsed = from12h(value);
    if (!parsed) return value;
    const d = new Date();
    d.setHours(parsed.hours, parsed.minutes, 0, 0);
    return to12h(d);
  }, [value]);

  // Keep input synced when parent value changes
  useEffect(() => {
    setInput(display);
  }, [display]);

  // When open, show list starting from the selected time (e.g., 1:00 PM)
  const slots = useMemo(() => rotateSlotsToStartAt(display), [display]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Auto-scroll selected item into view when opening
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: 0 });
  }, [open]);

  const normalizeInput = () => {
    const parsed = from12h(input);
    if (!parsed) {
      // If invalid, revert to last valid display
      setInput(display);
      return;
    }
    const d = new Date();
    d.setHours(parsed.hours, parsed.minutes, 0, 0);
    const normalized = to12h(d);
    setInput(normalized);
    onChange(normalized);
  };

  return (
    <div className="relative inline-block" ref={wrapRef}>
      {/* Editable input (combobox) */}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={normalizeInput}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full sm:w-60 rounded-xl bg-slate-800 text-slate-100 px-4 py-3 ring-1 ring-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus:ring-2 focus:ring-blue-500 text-left"
        placeholder="e.g., 1:00 PM"
        autoComplete="off"
      />

      {open && (
        <div
          ref={listRef}
          className="absolute z-30 mt-2 max-h-64 w-full sm:w-60 overflow-y-auto rounded-2xl border border-white/10 bg-slate-800/90 p-1 shadow-2xl backdrop-blur"
        >
          {slots.map((t) => (
            <button
              key={t}
              className={classNames(
                "w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/5",
                t.toUpperCase() === display.toUpperCase() &&
                  "bg-blue-600/90 hover:bg-blue-600/90"
              )}
              onMouseDown={(e) => {
                // prevent input blur before we handle click
                e.preventDefault();
              }}
              onClick={() => {
                setInput(t);
                onChange(t);
                setOpen(false);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
