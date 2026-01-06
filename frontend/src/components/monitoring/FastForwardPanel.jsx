import React, { useEffect, useMemo, useState } from 'react';
import { FastForward, Activity } from 'lucide-react';
import { fetchFastForwardData } from '../../services/api';

const STEP_INTERVAL_MS = 400; // animation step

const FastForwardPanel = ({ pumpId, speed = 100, windowHours = 6 }) => {
  const [series, setSeries] = useState([]);
  const [meta, setMeta] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchFastForwardData(pumpId, speed, windowHours);
        setSeries(data.series || []);
        setMeta(data);
        setIndex(0);
        setError(null);
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
          setIndex((prev) => {
            if (!data.series || data.series.length === 0) return 0;
            return (prev + 1) % data.series.length;
          });
        }, STEP_INTERVAL_MS);
      } catch (err) {
        console.error('Fast-forward fetch failed', err);
        setError(err.response?.data?.error || err.message);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pumpId, speed, windowHours]);

  const current = useMemo(() => {
    if (!series || series.length === 0) return null;
    return series[index];
  }, [series, index]);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-48 mb-4"></div>
        <div className="h-10 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-red-500/50 mb-6">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!current) return null;

  const progress = series.length > 0 ? ((index + 1) / series.length) * 100 : 0;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FastForward className="w-6 h-6 text-primary-400" />
          <div>
            <p className="text-sm text-slate-400">Fast-Forward Timeline</p>
            <p className="text-white text-lg font-semibold">{speed}x playback • Last {windowHours}h</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">
          Playback duration: {Math.round((meta?.playback_duration_seconds || 0) / 60)} mins
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 uppercase">Simulated Time</p>
          <p className="text-white text-lg font-semibold">{new Date(current.timestamp).toLocaleString()}</p>
        </div>
        <div className="bg-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 uppercase">Flow</p>
          <p className="text-white text-2xl font-bold">{current.flow?.toFixed(1) ?? '--'}</p>
          <p className="text-xs text-slate-500">m³/h</p>
        </div>
        <div className="bg-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 uppercase">Discharge</p>
          <p className="text-white text-2xl font-bold">{current.discharge_pressure?.toFixed(2) ?? '--'}</p>
          <p className="text-xs text-slate-500">bar</p>
        </div>
        <div className="bg-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 uppercase">RPM</p>
          <p className="text-white text-2xl font-bold">{current.rpm?.toFixed(0) ?? '--'}</p>
        </div>
        <div className="bg-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 uppercase">Power</p>
          <p className="text-white text-2xl font-bold">{current.motor_power?.toFixed(2) ?? '--'}</p>
          <p className="text-xs text-slate-500">kW</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <Activity className="w-4 h-4" />
        <span>Status: <span className="text-white font-semibold capitalize">{current.status}</span></span>
      </div>

      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary-500 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default FastForwardPanel;

