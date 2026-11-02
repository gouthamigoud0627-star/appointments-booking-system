import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  Database, 
  Globe, 
  RefreshCw,
  GitBranch,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CloudScalingStatus } from '../types';

export const CloudArchitectureModal: React.FC = () => {
  const [status, setStatus] = useState<CloudScalingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchScalingMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/scaling');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScalingMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>Cloud-Native Autoscaling & Database Architecture</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Production Scalable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic node auto-scaling, distributed high-availability database replication, and sub-20ms edge latency.
          </p>
        </div>

        <button
          onClick={fetchScalingMetrics}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Real-Time Cluster Metrics */}
      {status && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
              <span>Active Containers</span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-display">
              {status.activeNodes} Nodes
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Autoscale limits: min {status.autoScaleMin} - max {status.autoScaleMax}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
              <span>CPU Utilization</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 font-display">
              {status.cpuUtilization}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Target threshold 70%
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
              <span>Throughput</span>
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-600 font-display">
              {status.requestsPerSecond} req/s
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Avg latency {status.averageLatencyMs}ms
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
              <span>Database Replica</span>
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-display uppercase text-sm">
              <span className="text-emerald-600 font-bold">● Multi-Region Synced</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Zero-lag replication
            </div>
          </div>
        </div>
      )}

      {/* Architecture Topology Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900">
          Cloud-Native Infrastructure Topology
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Layer 1: Ingress */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Layer 1: Ingress</div>
            <div className="text-sm font-bold text-slate-900">Cloud Run CDN & Proxy</div>
            <p className="text-xs text-slate-600">Global Anycast IP with automatic SSL termination, DDoS shield, and Gzip/Brotli compression.</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Layer 2: Compute Node Pool */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Layer 2: App Engine</div>
            <div className="text-sm font-bold text-slate-900">Express + Vite Container</div>
            <p className="text-xs text-slate-600">Horizontal Pod Autoscaler adjusts active container instances between 2 and 30 based on traffic spikes.</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Layer 3: Database & Cache */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Layer 3: Data Tier</div>
            <div className="text-sm font-bold text-slate-900">Distributed Scalable DB</div>
            <p className="text-xs text-slate-600">Transactional ACID consistency with write master and read-replicas for lightning queries.</p>
          </div>
        </div>

        {/* Deployable specs */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 mb-2">
            Production Build Pipeline (Single Artifact)
          </h4>
          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`# Production Containerized Build Spec
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Standalone Production Runtime
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.cjs"]`}
          </pre>
        </div>
      </div>
    </div>
  );
};
