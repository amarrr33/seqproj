import React from 'react';
import MetricCard from '../components/MetricCard';
import { Users, Navigation, MapPin, Compass, Award, ShieldAlert, Sparkles, Layers, Activity } from 'lucide-react';

export default function HomeDashboard({ overview, clusters, patterns, users, onNavigate }) {
  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Sequential & Spatial Data Mining Platform
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Human Mobility Intelligence Platform
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            LifeTrail automatically analyzes high-density GPS trajectory logs from the Microsoft GeoLife dataset.
            Using spatial clustering (DBSCAN) and sequential pattern mining (PrefixSpan), it reveals routine mobility behaviors, spatial hotspots, and behavioral trajectory anomalies.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('explorer')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" /> Trajectory Explorer
            </button>
            <button
              onClick={() => onNavigate('sequential')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-cyan-400" /> View PrefixSpan Rules
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" /> Platform Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard title="Total Users" value={overview.total_users} icon={Users} color="indigo" subtitle="GeoLife Monitored Subjects" />
          <MetricCard title="GPS Points" value={overview.total_gps_points?.toLocaleString()} icon={Navigation} color="cyan" subtitle="Processed Coordinates" />
          <MetricCard title="Total Trips" value={overview.total_trips} icon={Compass} color="emerald" subtitle="Parsed Trajectories" />
          <MetricCard title="Avg Distance" value={overview.avg_distance_km} unit="km" icon={Award} color="purple" subtitle="Distance per Trip" />
          <MetricCard title="Daily Travel" value={overview.avg_daily_travel_km} unit="km" icon={Activity} color="amber" subtitle="Avg Daily Radius" />
          <MetricCard title="Avg Stops" value={overview.avg_stops_per_trip} icon={MapPin} color="rose" subtitle="Stay Points per Trip" />
        </div>
      </div>

      {/* Dual Column: Top Spatial Hotspots & Top Sequential Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spatial Hotspots Card */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" /> Mined Spatial Hotspots (DBSCAN)
            </h3>
            <button
              onClick={() => onNavigate('spatial')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Explore Map &rarr;
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Stay points clustered with DBSCAN (ε = 0.5 km, minPts = 2) to identify spatial hubs.
          </p>
          <div className="space-y-3">
            {clusters?.slice(0, 5).map((cluster) => (
              <div key={cluster.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">{cluster.name}</span>
                  <span className="text-[11px] text-slate-400">Centroid: {cluster.latitude.toFixed(4)}, {cluster.longitude.toFixed(4)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-400 block">{cluster.total_visits} Visits</span>
                  <span className="text-[11px] text-slate-400">{cluster.avg_stay_duration_min} min avg stay</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sequential Rules Card */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Top Sequential Rules (PrefixSpan)
            </h3>
            <button
              onClick={() => onNavigate('sequential')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All Rules &rarr;
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Frequent spatiotemporal routines mined across user mobility sequences using PrefixSpan.
          </p>
          <div className="space-y-3">
            {patterns?.slice(0, 5).map((pat) => (
              <div key={pat.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {pat.pattern_sequence}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-indigo-400 font-semibold">Sup: {pat.support_count}</span>
                    <span className="text-emerald-400 font-semibold">Conf: {(pat.confidence_score*100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{pat.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
