import React from 'react';

export const StatusBadge = ({ label, status, subtext }) => {
  const isHealthy = status === 'active' || status === 'connected' || status === true;
  const isInactive = status === 'inactive';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#131A29] border border-[#1E293B]">
      <div>
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          {label}
        </div>
        {subtext && <div className="text-xs text-slate-500 mt-0.5">{subtext}</div>}
      </div>
      <div className="flex items-center space-x-2">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            isHealthy
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
              : isInactive
              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
          }`}
        />
        <span
          className={`text-xs font-mono font-medium ${
            isHealthy
              ? 'text-emerald-400'
              : isInactive
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}
        >
          {isHealthy ? 'ACTIVE' : isInactive ? 'INACTIVE (DEV)' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
};
