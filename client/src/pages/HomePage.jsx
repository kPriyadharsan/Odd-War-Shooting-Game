import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Wifi, 
  Database, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Users, 
  Gamepad2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';
import { apiClient } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { pageVariants } from '../animations/transitions.js';

export const HomePage = () => {
  const { isConnected: isSocketConnected, socketId, latency } = useSocket();
  const [healthData, setHealthData] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await apiClient.getHealth();
      setHealthData(data.data);
    } catch (err) {
      setHealthError(err.message);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-between"
    >
      <div>
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Task 01: Full-Stack Architecture Initialized</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
            ODD <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">WARS</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Real-time multiplayer shooter architecture initialized with server-authoritative logic, 
            horizontal Socket.IO Redis scaling, and modern React 18 client foundation.
          </p>
        </div>

        {/* Live System Diagnostics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Express Server Health Card */}
          <div className="p-6 rounded-xl bg-[#131A29]/90 border border-[#1E293B] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Express Backend</h3>
                  <p className="text-xs text-slate-400">REST API & Health Core</p>
                </div>
              </div>
              <button
                onClick={fetchHealth}
                disabled={isLoadingHealth}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Refresh health status"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {healthError ? (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs">
                Backend connection failed: {healthError}
              </div>
            ) : healthData ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 uppercase font-bold">{healthData.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Environment</span>
                  <span className="text-slate-200">{healthData.environment}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-slate-200">{healthData.uptimeSeconds}s</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Service</span>
                  <span className="text-cyan-400">{healthData.service}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">Checking backend status...</div>
            )}
          </div>

          {/* Socket.IO Real-time Card */}
          <div className="p-6 rounded-xl bg-[#131A29]/90 border border-[#1E293B] shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Socket.IO Server</h3>
                <p className="text-xs text-slate-400">Low-latency duplex gateway</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Status</span>
                <span className={isSocketConnected ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {isSocketConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Socket ID</span>
                <span className="text-slate-300 truncate max-w-[150px]">{socketId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Ping Latency</span>
                <span className="text-cyan-400">{latency !== null ? `${latency} ms` : 'Measuring...'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Adapter</span>
                <span className="text-slate-300">
                  {healthData?.integrations?.redis?.connected ? 'Redis Cluster' : 'In-Memory (Single Instance)'}
                </span>
              </div>
            </div>
          </div>

          {/* External Services & Persistence Card */}
          <div className="p-6 rounded-xl bg-[#131A29]/90 border border-[#1E293B] shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">External Integrations</h3>
                <p className="text-xs text-slate-400">Optional services state</p>
              </div>
            </div>

            <div className="space-y-2">
              <StatusBadge
                label="MongoDB"
                status={healthData?.integrations?.mongodb?.status || 'inactive'}
                subtext={healthData?.integrations?.mongodb?.message || 'Dev fallback'}
              />
              <StatusBadge
                label="Redis PubSub"
                status={healthData?.integrations?.redis?.status || 'inactive'}
                subtext={healthData?.integrations?.redis?.adapter || 'In-memory fallback'}
              />
              <StatusBadge
                label="Google OAuth"
                status={healthData?.integrations?.googleAuth?.status || 'inactive'}
                subtext={healthData?.integrations?.googleAuth?.message || 'Dev mode'}
              />
            </div>
          </div>
        </div>

        {/* Foundation Checklist */}
        <div className="p-6 rounded-xl bg-[#131A29]/50 border border-[#1E293B]">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-4 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Architecture Readiness Checklist (Ready for Task 02)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Server-Authoritative</div>
                <div className="text-slate-400">Fixed-step TickLoop & GameState models</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Multiplayer Rooms</div>
                <div className="text-slate-400">2-4 player room schemas & private passwords</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Horizontal Scaling</div>
                <div className="text-slate-400">Redis adapter multi-instance ready for 100+ CCU</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Zero-Crash Dev Boot</div>
                <div className="text-slate-400">Graceful degradation without DB/Redis credentials</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
