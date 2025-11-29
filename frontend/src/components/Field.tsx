import React from "react";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export default function Field({ label, children }: FieldProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <label className="text-slate-300 text-base w-40">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
