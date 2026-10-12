import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Play, Pause, RotateCcw, FastForward, Navigation, Clock, Gauge, Route, AlertCircle } from 'lucide-react';
import Plot from 'react-plotly.js';

// Custom Leaflet Markers
const createIcon = (color) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const startIcon = createIcon('#10B981'); // Green
const endIcon = createIcon('#EF4444');   // Red
const movingIcon = L.divIcon({
  className: 'moving-marker',
  html: `<div class="relative"><div style="background-color: #6366F1; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #6366F1;" class="animate-ping absolute inset-0 opacity-75"></div><div style="background-color: #38BDF8; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 12px #38BDF8;" class="relative"></div></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function TrajectoryExplorer({ users, trajectories, selectedTrajDetail, onSelectUser, onSelectTrajectory }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = useRef(null);

  // Filter trajectories by selected user
  const userTrajs = trajectories.filter(t => t.user_id === Number(selectedUserId));
  const currentTraj = userTrajs.find(t => t.id === selectedTrajDetail?.id) || userTrajs[0];

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users]);

  useEffect(() => {
    if (currentTraj && (!selectedTrajDetail || selectedTrajDetail.id !== currentTraj.id)) {
      onSelectTrajectory(currentTraj.id);
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  }, [selectedUserId, currentTraj?.id]);

  const points = selectedTrajDetail?.points || [];
  const totalPoints = points.length;

  // Animation Loop
  useEffect(() => {
    if (isPlaying && totalPoints > 0) {
      animationRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalPoints - 1) {
            setIsPlaying(false);
            return totalPoints - 1;
          }
          return prev + 1;
        });
      }, 300 / playbackSpeed);
    } else {
      clearInterval(animationRef.current);
    }
    return () => clearInterval(animationRef.current);
  }, [isPlaying, totalPoints, playbackSpeed]);

  const polylineCoords = points.map(p => [p.latitude, p.longitude]);
  const currentPoint = points[currentIndex] || points[0] || { latitude: 39.9997, longitude: 116.3265, speed_kmh: 0 };
  const mapCenter = [currentPoint.latitude, currentPoint.longitude];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Controls */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Trajectory Replay & Explorer</h2>
            <p className="text-xs text-slate-400">Replay high-resolution GPS movement timeline</p>
          </div>
        </div>

        {/* User & Trip Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400">User:</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(Number(e.target.value));
                onSelectUser(Number(e.target.value));
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.user_code} ({u.total_trips} trips)</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400">Trip Date:</label>
            <select
              value={selectedTrajDetail?.id || ''}
              onChange={(e) => {
                onSelectTrajectory(Number(e.target.value));
                setCurrentIndex(0);
                setIsPlaying(false);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              {userTrajs.map(t => (
                <option key={t.id} value={t.id}>
                  {new Date(t.start_time).toLocaleDateString()} {new Date(t.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({t.total_distance_km} km)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map & Playback Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-[520px] rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl">
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter center={mapCenter} />

              {/* Trajectory Polyline */}
              {polylineCoords.length > 0 && (
                <Polyline positions={polylineCoords} pathOptions={{ color: '#6366F1', weight: 4, opacity: 0.8 }} />
              )}

              {/* Start & End Markers */}
              {polylineCoords.length > 0 && <Marker position={polylineCoords[0]} icon={startIcon}><Popup>Trip Departure Point</Popup></Marker>}
              {polylineCoords.length > 0 && <Marker position={polylineCoords[polylineCoords.length - 1]} icon={endIcon}><Popup>Trip Arrival Point</Popup></Marker>}

              {/* Moving Replay Marker */}
              {currentPoint && (
                <Marker position={[currentPoint.latitude, currentPoint.longitude]} icon={movingIcon}>
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-indigo-400">GPS Replay Position</p>
                      <p>Time: {new Date(currentPoint.timestamp).toLocaleTimeString()}</p>
                      <p>Speed: {currentPoint.speed_kmh} km/h</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Floating Speed Overlay */}
            <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-xl text-white shadow-lg flex items-center gap-3">
              <Gauge className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Velocity</span>
                <span className="text-sm font-extrabold text-cyan-300">{currentPoint.speed_kmh || 0} km/h</span>
              </div>
            </div>
          </div>

          {/* Timeline & Playback Bar */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-4">
              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button
                  onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                  title="Reset to Start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamp Counter */}
              <div className="text-right">
                <span className="text-xs font-mono text-cyan-400 font-bold block">
                  {currentPoint.timestamp ? new Date(currentPoint.timestamp).toLocaleTimeString() : '00:00:00'}
                </span>
                <span className="text-[11px] text-slate-400">Point {currentIndex + 1} of {totalPoints}</span>
              </div>
            </div>

            {/* Slider Scrub */}
            <input
              type="range"
              min={0}
              max={Math.max(0, totalPoints - 1)}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Right Col: Trip Summary Details & Speed Chart */}
        <div className="space-y-4">
          {/* Trip Summary Card */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Trip Spatiotemporal Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Distance:</span>
                <span className="font-bold text-white">{selectedTrajDetail?.total_distance_km} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-bold text-white">{selectedTrajDetail?.duration_minutes} mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average Speed:</span>
                <span className="font-bold text-cyan-400">{selectedTrajDetail?.avg_speed_kmh} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">GPS Log Count:</span>
                <span className="font-bold text-indigo-400">{selectedTrajDetail?.points?.length} points</span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-1">Mined Cluster Sequence:</span>
                <span className="inline-block px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 font-mono text-cyan-300 font-semibold">
                  {selectedTrajDetail?.cluster_sequence_str || 'C1 -> C2'}
                </span>
              </div>

              {selectedTrajDetail?.is_anomaly && (
                <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Flagged Trajectory Anomaly
                  </div>
                  <p className="text-[11px] leading-relaxed">{selectedTrajDetail.anomaly_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Velocity Profile Chart */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 mb-2">Velocity Profile (km/h)</h4>
            <div className="h-44 w-full">
              {points.length > 0 && (
                <Plot
                  data={[
                    {
                      x: points.map((_, i) => i),
                      y: points.map(p => p.speed_kmh),
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: '#38BDF8', width: 2 },
                      fill: 'tozeroy',
                      fillcolor: 'rgba(56, 189, 248, 0.1)'
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 30, r: 15, t: 10, b: 25 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: { showgrid: false, tickfont: { color: '#64748B', size: 9 } },
                    yaxis: { showgrid: true, gridcolor: '#1E293B', tickfont: { color: '#64748B', size: 9 } }
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
