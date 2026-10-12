import React from 'react';

export default function MetricCard({ title, value, unit, icon: Icon, color = 'indigo', subtitle }) {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30',
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900/80 border p-5 shadow-lg backdrop-blur-sm transition-all hover:translate-y-[-2px] ${selectedColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="w-5 h-5 opacity-90" />}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>
      {subtitle && <p className="mt-2 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
