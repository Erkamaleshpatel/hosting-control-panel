import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeploymentForm from './components/DeploymentForm';
import StatusCard from './components/StatusCard';
import HistoryTable from './components/HistoryTable';
import Toast from './components/Toast';

// Configure backend endpoint base URL
const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [deployments, setDeployments] = useState([]);
  const [activeDeployment, setActiveDeployment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [toast, setToast] = useState(null);

  // 1. Initial Fetch of History & Health Check
  useEffect(() => {
    checkServerHealth();
    fetchDeployments();
  }, []);

  // 2. Poll server health periodically
  useEffect(() => {
    const healthInterval = setInterval(checkServerHealth, 15000);
    return () => clearInterval(healthInterval);
  }, []);

  // 3. Smart conditional polling for active deployment status
  useEffect(() => {
    let intervalId;

    if (activeDeployment && (activeDeployment.status === 'Pending' || activeDeployment.status === 'Deploying')) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE}/status/${activeDeployment._id}`);
          if (response.data.success) {
            const updated = response.data.deployment;
            setActiveDeployment(updated);

            // Update in the main list array as well to keep the table in sync
            setDeployments((prev) =>
              prev.map((d) => (d._id === updated._id ? updated : d))
            );

            // If it just transitioned to final state, alert user and refresh lists
            if (updated.status === 'Completed') {
              showToast(`Deployment for ${updated.clientName} completed successfully!`, 'success');
              fetchDeployments();
            } else if (updated.status === 'Failed') {
              showToast(`Deployment for ${updated.clientName} failed. Check console.`, 'error');
              fetchDeployments();
            }
          }
        } catch (error) {
          console.error('Polling error:', error.message);
        }
      }, 3000); // Poll every 3 seconds for dynamic logs streaming
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeDeployment?._id, activeDeployment?.status]);

  // Network Calls
  const checkServerHealth = async () => {
    try {
      await axios.get('http://localhost:5000/health');
      setServerOnline(true);
    } catch (err) {
      setServerOnline(false);
    }
  };

  const fetchDeployments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/deployments`);
      if (response.data.success) {
        setDeployments(response.data.deployments);
      }
    } catch (error) {
      console.error('Failed to retrieve deployments:', error.message);
    }
  };

  const handleDeploy = async (formData) => {
    setFormLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/deploy`, formData);
      if (response.data.success) {
        showToast('Deployment job added to processing queue!', 'success');
        
        // Immediately trigger history list refresh
        await fetchDeployments();
        
        // Find the newly created deployment and select it
        const newDep = response.data.deploymentId;
        const statusResponse = await axios.get(`${API_BASE}/status/${newDep}`);
        if (statusResponse.data.success) {
          setActiveDeployment(statusResponse.data.deployment);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to initialize deployment';
      showToast(errorMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      const response = await axios.post(`${API_BASE}/deploy/retry/${id}`);
      if (response.data.success) {
        showToast('Deployment job re-queued.', 'success');
        await fetchDeployments();
        
        // Focus active console logs on retried deployment
        const statusResponse = await axios.get(`${API_BASE}/status/${id}`);
        if (statusResponse.data.success) {
          setActiveDeployment(statusResponse.data.deployment);
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to retry deployment', 'error');
    }
  };

  // Toast Helper
  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // Derived stats from local array
  const total = deployments.length;
  const completed = deployments.filter((d) => d.status === 'Completed').length;
  const failed = deployments.filter((d) => d.status === 'Failed').length;
  const deploying = deployments.filter((d) => d.status === 'Deploying' || d.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-900 pb-5 mb-8">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/25">
            H
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">CloudDeploy</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Hosting Control Panel</p>
          </div>
        </div>

        {/* Server status indicator */}
        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-full text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-400 font-medium">
            {serverOnline ? 'API Engine Active' : 'API Engine Offline'}
          </span>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* Metric Cards Banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Provisioned', count: total, color: 'text-slate-300', bg: 'bg-slate-900/40 border-slate-800' },
            { label: 'Active Deploying', count: deploying, color: 'text-blue-400', bg: 'bg-blue-950/10 border-blue-500/20' },
            { label: 'Success Nodes', count: completed, color: 'text-emerald-400', bg: 'bg-emerald-950/10 border-emerald-500/20' },
            { label: 'Failure Nodes', count: failed, color: 'text-rose-400', bg: 'bg-rose-950/10 border-rose-500/20' }
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl border ${stat.bg} backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5`}>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{stat.label}</span>
              <span className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.count}</span>
            </div>
          ))}
        </section>

        {/* Dynamic Panels */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <DeploymentForm onSubmit={handleDeploy} loading={formLoading} />
          </div>
          <div className="lg:col-span-7">
            <StatusCard deployment={activeDeployment} />
          </div>
        </section>

        {/* History Table */}
        <section>
          <HistoryTable 
            deployments={deployments} 
            onSelectDeployment={setActiveDeployment} 
            activeDeploymentId={activeDeployment?._id}
            onRetry={handleRetry}
          />
        </section>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto border-t border-slate-900/60 mt-12 py-6 text-center text-slate-600 text-xs">
        <p>© 2026 CloudDeploy Control Panel. Technical Interview Simulation Environment.</p>
      </footer>

      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
