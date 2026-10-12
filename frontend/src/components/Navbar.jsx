import React from 'react';
import { Compass, MapPin, GitCommit, UserCheck, AlertTriangle, BarChart3, RotateCw, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onReseed, isReseeding }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'explorer', label: 'Trajectory Explorer', icon: MapPin },
    { id: 'spatial', label: 'Spatial Hotspots', icon: Sparkles },
    { id: 'sequential', label: 'Sequential Mining', icon: GitCommit },
    { id: 'fingerprint', label: 'Mobility Fingerprint', icon: UserCheck },
    { id: 'anomalies', label: 'Anomaly Detector', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Compass className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              LifeTrail
            </h1>
            <p className="text-xs text-cyan-400 font-medium tracking-wide">
              Human Mobility Intelligence Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <button
          onClick={onReseed}
          disabled={isReseeding}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white disabled:opacity-50"
          title="Run complete ETL & Data Mining Pipeline"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-indigo-400' : ''}`} />
          {isReseeding ? 'Mining Data...' : 'Re-Run Pipeline'}
        </button>
      </div>
    </header>
  );
}
