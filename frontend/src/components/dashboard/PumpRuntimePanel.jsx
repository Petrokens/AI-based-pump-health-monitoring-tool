import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, Power, PowerOff } from 'lucide-react';
import { controlPump, fetchPumpRuntime } from '../../services/api';

const formatDuration = (hours = 0) => {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
};

const PumpRuntimePanel = ({ pumpId }) => {
  const [runtime, setRuntime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRuntime = useCallback(async () => {
    if (!pumpId) return;
    try {
      const data = await fetchPumpRuntime(pumpId);
      setRuntime(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load runtime info', err);
      setError(err.response?.data?.error || err.message || 'Unable to load runtime info');
    } finally {
      setLoading(false);
    }
  }, [pumpId]);

  useEffect(() => {
    setLoading(true);
    loadRuntime();
    const interval = setInterval(loadRuntime, 15000);
    return () => clearInterval(interval);
  }, [loadRuntime]);

  const handleControl = async () => {
    if (!runtime || !pumpId) return;
    const nextAction = runtime?.is_running ? 'stop' : 'start';
    setActionLoading(true);
    try {
      const data = await controlPump(pumpId, nextAction);
      setRuntime(data);
      setError(null);
    } catch (err) {
      console.error('Failed to send control command', err);
      setError(err.response?.data?.error || err.message || 'Unable to send control command');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (!runtime) return null;
    if (runtime.is_running) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Running</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-600 text-slate-200">Stopped</span>;
  }, [runtime]);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 animate-pulse">
        <div className="h-4 w-24 bg-slate-700 rounded mb-3"></div>
        <div className="h-6 w-48 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={loadRuntime}
          className="mt-3 text-sm text-primary-400 hover:text-primary-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!runtime) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock3 className="text-primary-400" />
          <div>
            <p className="text-slate-400 text-sm">Pump Runtime</p>
            <p className="text-white text-lg font-semibold">{pumpId}</p>
          </div>
        </div>
        {statusBadge}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Today</p>
          <p className="text-2xl font-bold text-white mt-1">{formatDuration(runtime.today_runtime_hours)}</p>
          <p className="text-xs text-slate-500">Last {runtime.log_window_hours}h window</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total Runtime</p>
          <p className="text-2xl font-bold text-white mt-1">{formatDuration(runtime.total_runtime_hours)}</p>
          <p className="text-xs text-slate-500">Accumulated (simulated)</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Last Change</p>
          <p className="text-base text-white mt-1">{runtime.last_state_change ? new Date(runtime.last_state_change).toLocaleString() : '—'}</p>
          <p className="text-xs text-slate-500">
            {runtime.is_running ? `Started: ${runtime.last_start ? new Date(runtime.last_start).toLocaleTimeString() : '—'}` :
              `Stopped: ${runtime.last_stop ? new Date(runtime.last_stop).toLocaleTimeString() : '—'}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Manual Control</p>
          <p className="text-xs text-slate-500">Simulated start/stop request for demo purposes</p>
        </div>
        <button
          onClick={handleControl}
          disabled={actionLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
            runtime.is_running
              ? 'bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20'
              : 'bg-green-500/10 text-green-400 border border-green-500/40 hover:bg-green-500/20'
          } ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {runtime.is_running ? <PowerOff size={18} /> : <Power size={18} />}
          {actionLoading ? 'Processing...' : runtime.is_running ? 'Stop Pump' : 'Start Pump'}
        </button>
      </div>
    </div>
  );
};

export default PumpRuntimePanel;

