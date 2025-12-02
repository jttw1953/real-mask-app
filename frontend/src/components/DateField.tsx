// DateField.tsx
import { useEffect, useRef, useState } from "react";
import DatePicker from "./DatePicker.tsx"; // your existing file

function label(d: Date) { return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`; }

export default function DateField({
  value, onChange
}: { value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full sm:w-60 rounded-xl bg-slate-800 text-slate-100 px-4 py-3 ring-1 ring-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus:ring-2 focus:ring-blue-500 text-left">
        {label(value)}
      </button>
      {open && (
        <DatePicker value={value} onChange={onChange} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
