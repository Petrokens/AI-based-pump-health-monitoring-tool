/**
 * Single-screen report: all key data for one pump in one view.
 * Client sees everything at a glance; "Open full dashboard" then shows detailed layers.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Timer,
  Activity,
  AlertTriangle,
  Brain,
  Calendar,
  Bell,
  Gauge,
  Wrench,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { fetchPumpOverview, fetchAlerts, fetchMLOutputs, fetchPumpRealtime } from '../../services/api';

function getHealthBand(score) {
  const s = Number(score) ?? 0;
  if (s >= 80) return { label: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-500/20' };
  if (s >= 60) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/20' };
  if (s >= 40) return { label: 'Warning', color: 'text-orange-500', bg: 'bg-orange-500/20' };
  return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/20' };
}

const ALARM_LEVELS = ['Normal', 'Warning', 'Alarm', 'Critical'];

export default function PumpReportSingleScreen({ pumpId, onOpenFullDashboard }) {
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [mlOutputs, setMLOutputs] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!pumpId) return;
    setError(null);
    try {
      const [ov, al, ml, rt] = await Promise.allSettled([
        fetchPumpOverview(pumpId),
        fetchAlerts(pumpId),
        fetchMLOutputs(pumpId),
        fetchPumpRealtime(pumpId),
      ]);
      setOverview(ov.status === 'fulfilled' ? ov.value : null);
      setAlerts(al.status === 'fulfilled' ? al.value : null);
      setMLOutputs(ml.status === 'fulfilled' ? ml.value : null);
      const r = rt.status === 'fulfilled' ? rt.value : null;
      setRealtime(r?.data ? { ...r, ...r.data } : r || {});
    } catch (e) {
      setError(e?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [pumpId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const healthScore = overview?.health_score ?? mlOutputs?.health_index ?? 85;
  const band = getHealthBand(healthScore);
  const rulHours = overview?.rul_hours ?? mlOutputs?.rul_hours ?? 0;
  const failurePct = mlOutputs?.failure_probability != null ? Number(mlOutputs.failure_probability) * 100 : 100 - healthScore;
  const aiConfidence = mlOutputs?.confidence ?? mlOutputs?.ai_confidence ?? 85;
  const alarmList = alerts?.alerts || [];
  const alarmCounts = {
    Normal: alarmList.filter((a) => (a.severity || a.level) === 'Normal' || !a.severity).length,
    Warning: alarmList.filter((a) => (a.severity || a.level) === 'Warning').length,
    Alarm: alarmList.filter((a) => (a.severity || a.level) === 'Alarm').length,
    Critical: alarmList.filter((a) => (a.severity || a.level) === 'Critical').length,
  };
  const failureProbs = Object.entries(mlOutputs?.failure_mode_probabilities || {})
        .map(([name, p]) => ({ name, p: (Number(p) || 0) * 100 }))
        .filter((x) => x.p > 0)
        .sort((a, b) => b.p - a.p)
        .slice(0, 5);
  const recommendations = alarmList.filter((a) => a.recommendation).map((a) => a.recommendation).slice(0, 3);
  if (recommendations.length === 0) {
    recommendations.push('Inspect bearing lubrication', 'Verify pump alignment', 'Check mechanical seal');
  }

  if (loading && !overview && !alerts) {
    return (
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 flex flex-col items-center justify-center min-h-[280px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">Loading report data…</p>
      </div>
    );
  }

  if (error && !overview && !alerts) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-600">
        <p className="font-medium">Report unavailable</p>
        <p className="text-sm mt-1">{error}</p>
        <button type="button" onClick={load} className="mt-3 text-sm font-medium text-primary-500 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-500" />
          All report data – single view
        </h2>
        {onOpenFullDashboard && (
          <button
            type="button"
            onClick={onOpenFullDashboard}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-400"
          >
            Open full dashboard
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Core KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={`rounded-xl p-3 ${band.bg}`}>
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Health
            </p>
            <p className={`text-lg font-bold ${band.color}`}>{Number(healthScore).toFixed(0)}%</p>
            <p className="text-xs text-[var(--text-secondary)]">{band.label}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-secondary)]/80 p-3">
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" /> RUL
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{rulHours ? `${rulHours} h` : '—'}</p>
            <p className="text-xs text-[var(--text-secondary)]">{rulHours ? `~${Math.round(rulHours / 24)} days` : ''}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-secondary)]/80 p-3">
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Status
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{overview?.operational_status || '—'}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-secondary)]/80 p-3">
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Failure prob.
            </p>
            <p className="text-lg font-bold text-amber-500">{Number(failurePct).toFixed(0)}%</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-secondary)]/80 p-3">
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" /> AI confidence
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{Number(aiConfidence).toFixed(0)}%</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-secondary)]/80 p-3">
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Next maintenance
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{overview?.next_maintenance || '—'}</p>
          </div>
        </div>

        {/* Row 2: Alarms + Sensors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Bell className="h-3.5 w-3.5" /> Alarm overview
            </p>
            <div className="flex flex-wrap gap-2">
              {ALARM_LEVELS.map((level) => {
                const count = alarmCounts[level] ?? 0;
                const color =
                  level === 'Critical'
                    ? 'bg-red-500/25 text-red-400'
                    : level === 'Alarm'
                      ? 'bg-orange-500/25 text-orange-400'
                      : level === 'Warning'
                        ? 'bg-amber-500/25 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400';
                return (
                  <span key={level} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>
                    {level}: {count}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> Key sensors
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-[var(--text-tertiary)]">Flow</p>
                <p className="font-semibold text-[var(--text-primary)]">{realtime?.flow ?? realtime?.flow_m3h ?? '—'} m³/h</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Discharge P</p>
                <p className="font-semibold text-[var(--text-primary)]">{realtime?.discharge_pressure ?? '—'} bar</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Bearing temp</p>
                <p className="font-semibold text-[var(--text-primary)]">{realtime?.bearing_temp ?? '—'} °C</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Vibration</p>
                <p className="font-semibold text-[var(--text-primary)]">{realtime?.vibration ?? '—'} mm/s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Failure modes + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Top failure probabilities</p>
            <ul className="space-y-1.5">
              {failureProbs.length
                ? failureProbs.slice(0, 4).map(({ name, p }) => (
                    <li key={name} className="flex justify-between text-sm">
                      <span className="text-[var(--text-primary)] capitalize truncate mr-2">{name.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-amber-500 shrink-0">{p.toFixed(0)}%</span>
                    </li>
                  ))
                : (
                  <li className="text-[var(--text-tertiary)] text-sm">No failure data</li>
                )}
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" /> Maintenance recommendations
            </p>
            <ul className="space-y-1 text-sm text-[var(--text-primary)]">
              {recommendations.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary-500 mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
