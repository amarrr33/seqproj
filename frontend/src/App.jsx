import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeDashboard from './views/HomeDashboard';
import TrajectoryExplorer from './views/TrajectoryExplorer';
import StayPointClusterView from './views/StayPointClusterView';
import SequentialMiningView from './views/SequentialMiningView';
import MobilityFingerprintView from './views/MobilityFingerprintView';
import AnomalyDetectorView from './views/AnomalyDetectorView';
import AnalyticsDashboard from './views/AnalyticsDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [trajectories, setTrajectories] = useState([]);
  const [selectedTrajDetail, setSelectedTrajDetail] = useState(null);
  const [stayPoints, setStayPoints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isReseeding, setIsReseeding] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ovRes, uRes, tRes, spRes, cRes, pRes, rRes, aRes, anRes] = await Promise.all([
        fetch('/api/overview').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/trajectories').then((r) => r.json()),
        fetch('/api/stay-points').then((r) => r.json()),
        fetch('/api/clusters').then((r) => r.json()),
        fetch('/api/prefixspan').then((r) => r.json()),
        fetch('/api/routines').then((r) => r.json()),
        fetch('/api/anomalies').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json()),
      ]);

      setOverview(ovRes);
      setUsers(uRes);
      setTrajectories(tRes);
      setStayPoints(spRes);
      setClusters(cRes);
      setPatterns(pRes);
      setRoutines(rRes);
      setAnomalies(aRes);
      setAnalytics(anRes);

      if (tRes.length > 0) {
        fetchTrajectoryDetail(tRes[0].id);
      }
    } catch (err) {
      console.error('Error fetching LifeTrail API data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrajectoryDetail = async (trajId) => {
    try {
      const res = await fetch(`/api/trajectories/${trajId}`).then((r) => r.json());
      setSelectedTrajDetail(res);
    } catch (err) {
      console.error('Error fetching trajectory detail:', err);
    }
  };

  const fetchUserFingerprint = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/fingerprint`).then((r) => r.json());
      return res;
    } catch (err) {
      console.error('Error fetching fingerprint:', err);
      return null;
    }
  };

  const handleReseed = async () => {
    try {
      setIsReseeding(true);
      await fetch('/api/reseed', { method: 'POST' });
      await fetchAllData();
    } catch (err) {
      console.error('Error reseeding pipeline:', err);
    } finally {
      setIsReseeding(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading && !overview ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-sm font-semibold text-slate-400">Loading LifeTrail Intelligence Platform...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <HomeDashboard
                overview={overview}
                clusters={clusters}
                patterns={patterns}
                users={users}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'explorer' && (
              <TrajectoryExplorer
                users={users}
                trajectories={trajectories}
                selectedTrajDetail={selectedTrajDetail}
                onSelectUser={(uId) => {
                  const uTraj = trajectories.find((t) => t.user_id === uId);
                  if (uTraj) fetchTrajectoryDetail(uTraj.id);
                }}
                onSelectTrajectory={(tId) => fetchTrajectoryDetail(tId)}
              />
            )}

            {activeTab === 'spatial' && (
              <StayPointClusterView clusters={clusters} stayPoints={stayPoints} />
            )}

            {activeTab === 'sequential' && (
              <SequentialMiningView patterns={patterns} routines={routines} />
            )}

            {activeTab === 'fingerprint' && (
              <MobilityFingerprintView users={users} onFetchFingerprint={fetchUserFingerprint} />
            )}

            {activeTab === 'anomalies' && (
              <AnomalyDetectorView
                anomalies={anomalies}
                onSelectTrajectory={(tId) => fetchTrajectoryDetail(tId)}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsDashboard analytics={analytics} />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>LifeTrail: Human Mobility Intelligence Platform &copy; 2026 | Spatiotemporal Data Mining Project</p>
      </footer>
    </div>
  );
}
