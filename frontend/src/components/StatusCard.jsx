import React, { useEffect, useRef } from 'react';

/**
 * Renders the active deployment status and logs stream console.
 */
export default function StatusCard({ deployment }) {
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal when new logs are appended
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deployment?.logs]);

  if (!deployment) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 border border-slate-800/50 flex flex-col items-center justify-center min-h-[300px]">
        <svg className="w-12 h-12 mb-3 text-slate-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-sm font-medium">No deployment selected.</p>
        <p className="text-xs text-slate-600 mt-1">Configure client settings on the left to start a deployment.</p>
      </div>
    );
  }

  const { clientName, domain, image, status, logs = [] } = deployment;

  // Determine progress percent based on the logs content
  const calculateProgress = () => {
    if (status === 'Pending') return 10;
    if (status === 'Completed') return 100;
    if (status === 'Failed') return 100;

    // If status is 'Deploying', estimate progress based on matching lines
    const logString = logs.join('\n');
    if (logString.includes('[AWS-Sim] Response Payload') || logString.includes('[AWS] Lambda successfully responded')) {
      return 95;
    }
    if (logString.includes('[AWS]') || logString.includes('[AWS-Sim]')) {
      return 80;
    }
    if (logString.includes('Container started') || logString.includes('Container running') || logString.includes('Binding virtual hosts')) {
      return 60;
    }
    if (logString.includes('Pulling fs layer') || logString.includes('docker pull')) {
      return 35;
    }
    return 20;
  };

  const progressPercent = calculateProgress();

  // Status configuration
  const statusConfig = {
    Pending: {
      badgeBg: 'bg-amber-950/40 text-amber-400 border-amber-500/20',
      progressBarBg: 'bg-amber-500',
      label: 'Queue Pending',
      pulse: true
    },
    Deploying: {
      badgeBg: 'bg-blue-950/40 text-blue-400 border-blue-500/20',
      progressBarBg: 'bg-blue-500',
      label: 'Deploying...',
      pulse: true
    },
    Completed: {
      badgeBg: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 glow-green',
      progressBarBg: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      label: 'Successful',
      pulse: false
    },
    Failed: {
      badgeBg: 'bg-rose-950/40 text-rose-400 border-rose-500/20',
      progressBarBg: 'bg-rose-600',
      label: 'Failed',
      pulse: false
    }
  }[status] || {
    badgeBg: 'bg-slate-900 text-slate-400 border-slate-700',
    progressBarBg: 'bg-slate-500',
    label: status,
    pulse: false
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col h-full">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            Active Status: 
            <span className={`ml-3.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${statusConfig.badgeBg} ${statusConfig.pulse ? 'animate-pulse-soft' : ''}`}>
              {statusConfig.label}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {clientName} • <span className="font-mono text-[11px] text-blue-400">{domain}</span>
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Target Image</span>
          <span className="text-sm font-mono text-slate-300 font-medium">{image}</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Task Progress</span>
          <span className={`${status === 'Failed' ? 'text-rose-400' : 'text-slate-200'}`}>
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-950/80 overflow-hidden border border-slate-800/40">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${statusConfig.progressBarBg}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Log console terminal */}
      <div className="flex-1 flex flex-col">
        {/* Terminal Header */}
        <div className="bg-slate-950 px-4 py-2.5 rounded-t-xl border border-slate-800/80 border-b-0 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 select-none">docker-provisioner.log</span>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Console Box */}
        <div className="flex-1 min-h-[220px] max-h-[350px] bg-slate-950/90 rounded-b-xl border border-slate-800/80 p-4 font-mono-terminal text-xs text-slate-300 overflow-y-auto space-y-1.5 shadow-inner">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">[No logs received yet]</p>
          ) : (
            logs.map((logLine, idx) => {
              // Highlight systems, warnings, errors, docker outputs
              let colorClass = 'text-slate-300';
              if (logLine.includes('[Error]')) colorClass = 'text-rose-400 font-semibold';
              else if (logLine.includes('[Warning]')) colorClass = 'text-amber-400';
              else if (logLine.includes('[System]')) colorClass = 'text-blue-400';
              else if (logLine.includes('[Docker]')) colorClass = 'text-slate-400';
              else if (logLine.includes('[Docker-Sim]')) colorClass = 'text-slate-500';
              else if (logLine.includes('[AWS]')) colorClass = 'text-emerald-400';
              else if (logLine.includes('[AWS-Sim]')) colorClass = 'text-emerald-500/80';

              return (
                <div key={idx} className={`${colorClass} whitespace-pre-wrap leading-relaxed`}>
                  {logLine}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
