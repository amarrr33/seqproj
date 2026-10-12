import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Sparkles, MapPin, Layers, Clock, Compass } from 'lucide-react';

const clusterColors = [
  '#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#EF4444'
];

const createClusterIcon = (label, color) => L.divIcon({
  className: 'custom-cluster-pin',
  html: `<div style="background-color: ${color}; color: white; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 12px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; items-center; gap: 4px;">
    <span>C${label + 1}</span>
  </div>`,
  iconSize: [40, 24],
  iconAnchor: [20, 12]
});

export default function StayPointClusterView({ clusters, stayPoints }) {
  const [selectedCluster, setSelectedCluster] = useState(null);

  const center = [39.9834, 116.3156]; // Beijing Metro Area

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Spatial Data Mining Module
          </div>
          <h2 className="text-2xl font-bold text-white">Spatial DBSCAN Hotspots & Stay Points</h2>
          <p className="text-slate-400 text-xs">
            Automatic stay point detection (Δdist ≤ 200m, ΔT ≥ 15 min) combined with DBSCAN spatial clustering (ε = 0.5 km, minPts = 2).
          </p>
        </div>

        {/* Info Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Stay Points</span>
            <span className="text-sm font-extrabold text-cyan-400">{stayPoints.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">DBSCAN Clusters</span>
            <span className="text-sm font-extrabold text-indigo-400">{clusters.length}</span>
          </div>
        </div>
      </div>

      {/* Map & Cluster List Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaflet Spatial Cluster Map */}
        <div className="lg:col-span-2 h-[550px] rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl">
          <MapContainer center={center} zoom={12} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Individual Stay Points (Raw Dots) */}
            {stayPoints.slice(0, 300).map((sp) => (
              <CircleMarker
                key={sp.id}
                center={[sp.latitude, sp.longitude]}
                radius={4}
                pathOptions={{ color: '#06B6D4', fillColor: '#38BDF8', fillOpacity: 0.7, weight: 1 }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-cyan-400">Stay Point #{sp.id}</p>
                    <p>User: {sp.user_code}</p>
                    <p>Duration: {sp.duration_minutes} mins</p>
                    <p>Cluster: {sp.cluster_name}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* DBSCAN Clusters: Convex Hulls & Centroid Pins */}
            {clusters.map((cluster, idx) => {
              const color = clusterColors[idx % clusterColors.length];
              const hullCoords = cluster.convex_hull || [];

              return (
                <React.Fragment key={cluster.id}>
                  {/* Convex Hull Polygon */}
                  {hullCoords.length > 2 && (
                    <Polygon
                      positions={hullCoords}
                      pathOptions={{ color: color, fillColor: color, fillOpacity: 0.25, weight: 2, dashArray: '4' }}
                    />
                  )}

                  {/* Centroid Pin */}
                  <Marker position={[cluster.latitude, cluster.longitude]} icon={createClusterIcon(cluster.cluster_label, color)}>
                    <Popup>
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-white" style={{ color: color }}>{cluster.name}</p>
                        <p>Total Visits: {cluster.total_visits}</p>
                        <p>Avg Stay: {cluster.avg_stay_duration_min} mins</p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        {/* Right Col: Cluster Detail Cards */}
        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider sticky top-0 bg-slate-950 py-2 z-10">
            Spatial Cluster Directory ({clusters.length})
          </h3>

          <div className="space-y-3">
            {clusters.map((cluster, idx) => {
              const color = clusterColors[idx % clusterColors.length];
              const isSelected = selectedCluster === cluster.id;

              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedCluster(isSelected ? null : cluster.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-slate-900/90 shadow-lg ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                      <span className="text-xs font-bold text-white">{cluster.name}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                      Label {cluster.cluster_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="block text-slate-500">Centroid Lat/Lon:</span>
                      <span className="font-mono text-slate-200">{cluster.latitude.toFixed(4)}, {cluster.longitude.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Stay Point Count:</span>
                      <span className="font-bold text-cyan-400">{cluster.stay_point_count} points</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Total Visits:</span>
                      <span className="font-bold text-white">{cluster.total_visits} visits</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Avg Stay Duration:</span>
                      <span className="font-bold text-emerald-400">{cluster.avg_stay_duration_min} mins</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
