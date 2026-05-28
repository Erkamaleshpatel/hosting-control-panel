import React, { useState } from 'react';

/**
 * Renders the deployment history table. Includes searching, status filters,
 * details selection, and re-trigger/retry capabilities.
 */
export default function HistoryTable({ deployments, onSelectDeployment, activeDeploymentId, onRetry }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Format Dates cleanly
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Filter deployments based on search and dropdown status choice
  const filteredDeployments = deployments.filter((dep) => {
    const matchesSearch = 
      dep.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.image.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || dep.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status CSS classes
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-950/40 text-amber-400 border-amber-500/20';
      case 'Deploying':
        return 'bg-blue-950/40 text-blue-400 border-blue-500/20 animate-pulse';
      case 'Completed':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20';
      case 'Failed':
        return 'bg-rose-950/40 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800">
      {/* Filtering Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Deployment History</h2>
          <p className="text-xs text-slate-400">View and manage previous provisioning tasks ({filteredDeployments.length})</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search client, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors duration-150"
            />
            <svg className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors duration-150 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Deploying">Deploying</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="pb-3.5 pl-2">Client</th>
              <th className="pb-3.5">Host / Domain</th>
              <th className="pb-3.5">Docker Image</th>
              <th className="pb-3.5">Date Created</th>
              <th className="pb-3.5">Status</th>
              <th className="pb-3.5 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 text-xs">
            {filteredDeployments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500 font-medium">
                  No records matching active search filters.
                </td>
              </tr>
            ) : (
              filteredDeployments.map((dep) => {
                const isActive = dep._id === activeDeploymentId;
                const isProcessing = dep.status === 'Pending' || dep.status === 'Deploying';

                return (
                  <tr 
                    key={dep._id} 
                    className={`group hover:bg-slate-900/20 transition-all duration-150 cursor-pointer ${
                      isActive ? 'bg-blue-950/10 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => onSelectDeployment(dep)}
                  >
                    <td className="py-3.5 pl-2 font-semibold text-slate-200">
                      {dep.clientName}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-400">
                      {dep.domain}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-blue-400/80">
                      {dep.image}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {formatDate(dep.createdAt)}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadge(dep.status)}`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end space-x-2">
                        {/* Selector indicator */}
                        <button
                          onClick={() => onSelectDeployment(dep)}
                          className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                            isActive 
                              ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          View Logs
                        </button>
                        
                        {/* Retry action */}
                        {dep.status === 'Failed' && (
                          <button
                            onClick={() => onRetry(dep._id)}
                            className="p-1 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-colors"
                            title="Retry Deployment"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                          </button>
                        )}
                        {dep.status === 'Completed' && (
                          <button
                            onClick={() => onRetry(dep._id)}
                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:border-slate-700 transition-colors"
                            title="Re-deploy Container"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                          </button>
                        )}
                        {isProcessing && (
                          <div className="p-1 text-blue-400 flex items-center justify-center">
                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
