import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Route, Activity } from 'lucide-react';

export default function AnomalyDetectorView({ anomalies, onSelectTrajectory, onNavigate }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" /> Spatiotemporal Anomaly Detector
          </div>
          <h2 className="text-2xl font-bold text-white">Trajectory Anomaly Intelligence</h2>
          <p className="text-slate-400 text-xs">
            Evaluates individual user movement trajectories for distance deviations, spatial cluster mismatches, and PrefixSpan sequence anomalies.
          </p>
        </div>

        <div className="px-4 py-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 font-extrabold text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          {anomalies.length} Flagged Anomalies
        </div>
      </div>

      {/* Anomalies Grid */}
      <div className="space-y-4">
        {anomalies.map((anom) => (
          <div
            key={anom.id}
            className="rounded-xl bg-slate-900/90 border border-rose-900/40 p-5 shadow-xl hover:border-rose-500/60 transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">{anom.trip_code}</span>
                  <span className="text-xs text-slate-400">User: {anom.user_code} | Date: {new Date(anom.start_time).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Anomaly Score</span>
                  <span className="text-base font-extrabold text-rose-400">{(anom.anomaly_score * 100).toFixed(0)}%</span>
                </div>
                <button
                  onClick={() => {
                    onSelectTrajectory(anom.id);
                    onNavigate('explorer');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Route className="w-3.5 h-3.5" /> Replay Map
                </button>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block">Total Trip Distance:</span>
                <span className="font-bold text-white">{anom.total_distance_km} km</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block">Sequence Progression:</span>
                <span className="font-mono text-cyan-300 font-bold">{anom.cluster_sequence_str || 'N/A'}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block">Anomaly Category:</span>
                <span className="font-bold text-rose-300">Spatiotemporal Outlier</span>
              </div>
            </div>

            {/* Explainable Text */}
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200 leading-relaxed">
              <strong className="text-rose-300 block mb-1">Explainable Diagnosis:</strong>
              {anom.anomaly_reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
