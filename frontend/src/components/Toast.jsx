import React, { useEffect } from 'react';

/**
 * Modern custom Toast component for dashboard alerts.
 * Automatically fades out after 4 seconds.
 */
export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center px-5 py-3.5 rounded-xl shadow-2xl border transition-all duration-350 transform translate-y-0 ${
      isSuccess 
        ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
        : 'bg-rose-950/80 border-rose-500/30 text-rose-300'
    } backdrop-blur-md animate-bounce-short`}>
      <div className="flex items-center">
        {isSuccess ? (
          <svg className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 mr-3 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <p className="text-sm font-medium pr-4">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className={`hover:text-white transition-colors duration-150 p-1 rounded-lg ${
          isSuccess ? 'hover:bg-emerald-800/40 text-emerald-400' : 'hover:bg-rose-800/40 text-rose-400'
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
