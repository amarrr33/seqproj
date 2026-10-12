import React from 'react';
import Plot from 'react-plotly.js';
import { BarChart3, PieChart, Activity, Calendar, Clock } from 'lucide-react';

export default function AnalyticsDashboard({ analytics }) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { distance_distribution, travel_time_distribution, stay_duration_distribution, cluster_sizes, weekly_travel } = analytics;

  const darkLayout = {
    autosize: true,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94A3B8', family: 'Inter, sans-serif', size: 11 },
    margin: { l: 40, r: 20, t: 25, b: 40 },
    xaxis: { showgrid: false, gridcolor: '#1E293B' },
    yaxis: { showgrid: true, gridcolor: '#1E293B' },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5" /> Spatiotemporal Analytics Suite
          </div>
          <h2 className="text-2xl font-bold text-white">Mobility Analytics & Distributions</h2>
          <p className="text-slate-400 text-xs">
            Multi-dimensional statistical visualizer powered by Plotly for distance distributions, stay durations, and weekly trip frequencies.
          </p>
        </div>
      </div>

      {/* Grid of Plotly Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Distance Distribution */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Trajectory Distance Distribution (km)
          </h3>
          <div className="h-64">
            <Plot
              data={[
                {
                  x: distance_distribution,
                  type: 'histogram',
                  nbinsx: 15,
                  marker: { color: '#6366F1' }
                }
              ]}
              layout={{
                ...darkLayout,
                xaxis: { ...darkLayout.xaxis, title: 'Trip Distance (km)' },
                yaxis: { ...darkLayout.yaxis, title: 'Frequency' }
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Chart 2: Spatial Cluster Share */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" /> DBSCAN Spatial Cluster Visit Share
          </h3>
          <div className="h-64">
            <Plot
              data={[
                {
                  labels: cluster_sizes?.labels || [],
                  values: cluster_sizes?.values || [],
                  type: 'pie',
                  hole: 0.4,
                  marker: {
                    colors: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6']
                  },
                  textinfo: 'label+percent',
                  textfont: { color: '#FFFFFF', size: 10 }
                }
              ]}
              layout={{
                ...darkLayout,
                showlegend: false
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Chart 3: Stay Point Duration Histogram */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Stay Point Duration Histogram (minutes)
          </h3>
          <div className="h-64">
            <Plot
              data={[
                {
                  x: stay_duration_distribution,
                  type: 'histogram',
                  nbinsx: 12,
                  marker: { color: '#10B981' }
                }
              ]}
              layout={{
                ...darkLayout,
                xaxis: { ...darkLayout.xaxis, title: 'Stay Duration (mins)' },
                yaxis: { ...darkLayout.yaxis, title: 'Occurrences' }
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Chart 4: Weekly Travel Trends */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Weekly Trajectory Volume
          </h3>
          <div className="h-64">
            <Plot
              data={[
                {
                  x: Object.keys(weekly_travel || {}),
                  y: Object.values(weekly_travel || {}),
                  type: 'bar',
                  marker: { color: '#F59E0B' }
                }
              ]}
              layout={{
                ...darkLayout,
                xaxis: { ...darkLayout.xaxis, title: 'Day of Week' },
                yaxis: { ...darkLayout.yaxis, title: 'Trip Volume' }
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
