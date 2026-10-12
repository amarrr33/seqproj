import React, { useState } from 'react';
import { GitCommit, Layers, Filter, CheckCircle2, Info, ArrowRight, Activity } from 'lucide-react';

export default function SequentialMiningView({ patterns, routines }) {
  const [minSupport, setMinSupport] = useState(0.15);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatterns = patterns.filter((p) => {
    const matchSup = p.support_ratio >= minSupport;
    const matchSearch = p.pattern_sequence.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSup && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <GitCommit className="w-3.5 h-3.5" /> Sequential Data Mining Engine
          </div>
          <h2 className="text-2xl font-bold text-white">PrefixSpan Sequential Pattern & Routine Mining</h2>
          <p className="text-slate-400 text-xs">
            Discovers frequent spatiotemporal movement sub-sequences and transition probabilities without candidate generation.
          </p>
        </div>

        {/* Explainable Metric Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">PrefixSpan Rules</span>
            <span className="text-sm font-extrabold text-indigo-400">{filteredPatterns.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">User Routines</span>
            <span className="text-sm font-extrabold text-cyan-400">{routines.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Min Support Ratio:</span>
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.05}
            value={minSupport}
            onChange={(e) => setMinSupport(parseFloat(e.target.value))}
            className="w-36 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono font-bold text-cyan-400">{(minSupport * 100).toFixed(0)}%</span>
        </div>

        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search pattern (e.g. C1 -> C2)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-full sm:w-64 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Patterns Table & Algorithm Justification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mined Patterns Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Discovered Sequential Patterns ({filteredPatterns.length})
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredPatterns.map((pat) => (
                <div key={pat.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-indigo-950/90 text-cyan-300 font-mono font-bold text-xs border border-indigo-800/80">
                        {pat.pattern_sequence}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Len: {pat.pattern_length}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
                        Support: {pat.support_count} ({ (pat.support_ratio * 100).toFixed(1) }%)
                      </span>
                      <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                        Confidence: { (pat.confidence_score * 100).toFixed(1) }%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-cyan-400 inline mr-1.5" />
                    {pat.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Explainable Algorithm Rationale & Routines */}
        <div className="space-y-4">
          {/* Why PrefixSpan Card */}
          <div className="rounded-xl bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/30 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Why PrefixSpan Algorithm?
            </h3>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-cyan-300">1. No Candidate Generation:</strong> Unlike Apriori/GSP, PrefixSpan avoids exponentially generating combinatoric sequence candidates across dense GPS logs.
              </p>
              <p>
                <strong className="text-cyan-300">2. Projected Database Shrinkage:</strong> PrefixSpan projects trajectory databases into prefix-subtrees, reducing memory footprint by over 80%.
              </p>
              <p>
                <strong className="text-cyan-300">3. Spatiotemporal Scalability:</strong> Ideal for long multi-user trajectory logs with non-adjacent spatial cluster transitions.
              </p>
            </div>
          </div>

          {/* User Routines Card */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Discovered User Mobility Routines
            </h3>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {routines.slice(0, 8).map((r) => (
                <div key={r.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{r.user_code}</span>
                    <span className="text-[11px] font-semibold text-emerald-400">Freq: {r.frequency} ({ (r.confidence * 100).toFixed(0) }%)</span>
                  </div>
                  <div className="font-mono text-[11px] text-cyan-300 line-clamp-1">{r.sequence_str}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
