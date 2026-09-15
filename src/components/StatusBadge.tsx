import React from "react";

const StatusBadge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
      active
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
        : "bg-slate-100 text-slate-600 ring-slate-500/20"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
    {label}
  </span>
);

export default StatusBadge;
