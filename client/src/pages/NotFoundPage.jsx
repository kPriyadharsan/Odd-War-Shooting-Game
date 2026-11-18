import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm mb-6 max-w-sm">
        The requested battle sector does not exist or has been decommissioned.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition"
      >
        Return to Command Center
      </Link>
    </div>
  );
};
