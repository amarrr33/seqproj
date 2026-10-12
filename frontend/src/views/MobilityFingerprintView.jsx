import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import { UserCheck, Award, Compass, MapPin, Activity, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function MobilityFingerprintView({ users, onFetchFingerprint }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || 1);
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      onFetchFingerprint(selectedUserId).then((data) => {
        setFingerprint(data);
        setLoading(false);
      });
    }
  }, [selectedUserId]);

  const userObj = users.find(u => u.id === Number(selectedUserId)) || users[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" /> Mobility Intelligence Summary
          </div>
          <h2 className="text-2xl font-bold text-white">User Mobility Fingerprints</h2>
          <p className="text-slate-400 text-xs">
            Individual user travel radius ($R_g$), Shannon entropy regularity index, spatial hub preferences, and top routines.
          </p>
        </div>

        {/* User Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Select User:</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-4 py-2 focus:border-indigo-500 focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.user_code} ({u.total_trips} trips - Reg: {u.regularity_score}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Fingerprint Metrics */}
      {fingerprint && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Radius of Gyration (Rg)"
              value={fingerprint.radius_gyration_km}
              unit="km"
              icon={Compass}
              color="indigo"
              subtitle="Characteristic travel range around center of mass"
            />
            <MetricCard
              title="Regularity Index"
              value={`${fingerprint.regularity_score}%`}
              icon={ShieldCheck}
              color="emerald"
              subtitle="Routine predictability (Shannon Entropy)"
            />
            <MetricCard
              title="Unique Clusters"
              value={fingerprint.unique_locations_visited}
              icon={MapPin}
              color="cyan"
              subtitle="Distinct spatial hotspots visited"
            />
            <MetricCard
              title="Longest Single Trip"
              value={fingerprint.longest_trip_km}
              unit="km"
              icon={Award}
              color="purple"
              subtitle="Maximum continuous trajectory"
            />
          </div>

          {/* Detailed Fingerprint Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: User Mobility Profile */}
            <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" /> Behavioral Mobility Profile ({fingerprint.user_code})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Total Travel Distance:</span>
                  <span className="text-base font-extrabold text-white">{fingerprint.total_distance_km} km</span>
                  <p className="text-[11px] text-slate-500">Across {fingerprint.total_trips} recorded trajectories</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Average Daily Travel:</span>
                  <span className="text-base font-extrabold text-cyan-400">{fingerprint.avg_daily_travel_km} km/day</span>
                  <p className="text-[11px] text-slate-500">Estimated daily spatial displacement</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-slate-400 font-semibold block">Primary Spatial Hub (Most Visited):</span>
                  <span className="text-sm font-bold text-indigo-300">{fingerprint.most_visited_cluster}</span>
                  <p className="text-[11px] text-slate-500">Highest visit frequency among DBSCAN clusters</p>
                </div>
              </div>
            </div>

            {/* Right Col: Top Routines for Selected User */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Top Recurring Routines
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {fingerprint.routines?.map((r, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-300 font-bold">{r.sequence_str}</span>
                      <span className="text-emerald-400 font-semibold">{r.frequency} trips</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
