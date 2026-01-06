import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Droplets,
  Gauge,
  HeartPulse,
  Shield,
  Timer,
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  fetchVibrationData,
  fetchHydraulicData,
  fetchElectricalData,
  fetchMaintenanceMetrics,
  fetchMLOutputs
} from '../../services/api';

const AnalyticsDashboard = ({ pumpId }) => {
  const [vibration, setVibration] = useState(null);
  const [hydraulic, setHydraulic] = useState(null);
  const [electrical, setElectrical] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [mlOutputs, setMLOutputs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setErrorText('');
        const [vib, hyd, elec, maint, ml] = await Promise.all([
          fetchVibrationData(pumpId),
          fetchHydraulicData(pumpId),
          fetchElectricalData(pumpId),
          fetchMaintenanceMetrics(pumpId),
          fetchMLOutputs(pumpId)
        ]);
        setVibration(vib);
        setHydraulic(hyd);
        setElectrical(elec);
        setMaintenance(maint);
        setMLOutputs(ml);
      } catch (err) {
        console.error('Error loading analytics dashboard', err);
        setErrorText('Unable to load analytics signals. Check backend connectivity.');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [pumpId]);

  const derived = useMemo(() => {
    if (!vibration || !hydraulic || !electrical) return null;

    const vibHealth = clamp(Number(vibration.bearing_condition_index ?? 0), 0, 100);
    const cavRisk = 100 - clamp(Number(hydraulic.cavitation_index ?? 100), 0, 100);
    const power = Number(electrical.power_consumption ?? electrical.power_kw ?? 0);
    const flow = Number(hydraulic.flow ?? 0);
    const dpBar = Number(hydraulic.differential_pressure ?? 0);
    const hydraulicPowerKw = flow * dpBar * 0.2778;
    const efficiency = power > 0 ? clamp((hydraulicPowerKw / power) * 100, 0, 120) : 0;
    const efficiencyDrop = clamp(100 - efficiency, 0, 100);
    const motorLoad = clamp((Number(electrical.motor_current ?? 0) / 100) * 100, 0, 120);

    const healthScore = clamp(
      0.25 * vibHealth +
        0.15 * (100 - cavRisk) +
        0.2 * (100 - efficiencyDrop) +
        0.2 * (100 - motorLoad) +
        0.2 * (100 - (vibration.vibration_rms ?? 0) * 10),
      0,
      100
    );

    const rulHours =
      mlOutputs?.rul_hours ??
      Math.max(200, Math.round((healthScore / 100) * 1000)); // fallback heuristic

    return {
      vibHealth,
      cavRisk,
      efficiency,
      efficiencyDrop,
      motorLoad,
      healthScore,
      hydraulicPowerKw: hydraulicPowerKw.toFixed(2),
      flow,
      dpBar,
      rulHours
    };
  }, [vibration, hydraulic, electrical, mlOutputs]);

  const mtbfHours = maintenance?.mtbf_hours ?? maintenance?.mtbf ?? null;

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] p-5">
        <div className="animate-pulse text-[var(--text-secondary)] text-sm">Loading analytics dashboard...</div>
      </div>
    );
  }

  if (!derived) return null;

  return (
    <div className="space-y-4">
      {errorText && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded px-3 py-2">
          {errorText}
        </div>
      )}

      <SectionToggle title="G. Analytics Dashboard" subtitle="Aggregate live metrics">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            title="Seal / Bearing Health"
            icon={<Shield className="w-4 h-4 text-primary-300" />}
            value={`${derived.vibHealth.toFixed(0)}%`}
            note="From vibration condition index"
          />
          <Card
            title="Cavitation Risk"
            icon={<Droplets className="w-4 h-4 text-sky-300" />}
            value={`${derived.cavRisk.toFixed(0)}%`}
            note="Lower is better; based on cavitation index"
          />
          <Card
            title="Efficiency"
            icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
            value={`${derived.efficiency.toFixed(1)}%`}
            note="Hydraulic vs motor power"
          />
          <Card
            title="Motor Load"
            icon={<Gauge className="w-4 h-4 text-amber-300" />}
            value={`${derived.motorLoad.toFixed(0)}%`}
            note="Current vs nominal"
          />
          <Card
            title="Performance vs Curve"
            icon={<BarChart3 className="w-4 h-4 text-[var(--text-primary)]" />}
            value={`${(100 - derived.efficiencyDrop).toFixed(0)}%`}
            note="Higher means closer to baseline"
          />
          <Card
            title="RUL Estimate"
            icon={<Timer className="w-4 h-4 text-[var(--text-primary)]" />}
            value={`${derived.rulHours} h`}
            note="From ML outputs or heuristic"
          />
          <Card
            title="MTBF"
            icon={<Activity className="w-4 h-4 text-[var(--text-primary)]" />}
            value={mtbfHours ? `${mtbfHours.toFixed(0)} h` : 'N/A'}
            note="Historical failures"
          />
        </div>
      </SectionToggle>

      <SectionToggle title="H. Daily Health Score" subtitle="Weighted 0–100 for operators" defaultOpen>
        <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary-400" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Health Score</p>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">{derived.healthScore.toFixed(0)} / 100</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Combines seal/bearing health, efficiency, motor load, vibration, cavitation risk.
          </p>
        </div>
      </SectionToggle>

      <SectionToggle title="I. Remaining Useful Life (RUL)" subtitle="Component life projection">
        <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 text-sm text-[var(--text-primary)]">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">{derived.rulHours} hours remaining (est.)</p>
          <p className="text-[var(--text-secondary)] text-xs">
            Uses ML outputs when available; otherwise derived from current health and degradation rate.
          </p>
        </div>
      </SectionToggle>

      <SectionToggle title="J. MTBF Calculation" subtitle="Mean Time Between Failures">
        <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 text-sm text-[var(--text-primary)]">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            {mtbfHours ? `${mtbfHours.toFixed(0)} hours` : 'Insufficient data'}
          </p>
          <p className="text-[var(--text-secondary)] text-xs">
            Computed from historical failures and operating hours. Useful for planning spares and maintenance windows.
          </p>
        </div>
      </SectionToggle>

      <SectionToggle title="K. Operating Envelope Monitoring" subtitle="Keeps pump within safe limits">
        <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 text-sm text-[var(--text-primary)] space-y-2">
          <EnvelopeRow label="Max flow" value={`${hydraulic.flow?.toFixed(1)} ${hydraulic.flow_unit || 'm³/h'}`} limit="within range" />
          <EnvelopeRow label="Head" value={`${(hydraulic.differential_pressure * 10.2).toFixed(1)} m`} limit="target ± tolerance" />
          <EnvelopeRow label="Motor load" value={`${derived.motorLoad.toFixed(0)}%`} limit="warn > 90%" />
          <EnvelopeRow label="Suction pressure" value={`${hydraulic.suction_pressure?.toFixed(2)} ${hydraulic.pressure_unit || 'bar'}`} limit="min suction limit" />
          {derived.cavRisk > 50 && (
            <div className="text-[11px] text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Cavitation warning: raise suction head or reduce flow.
            </div>
          )}
        </div>
      </SectionToggle>
    </div>
  );
};

const SectionToggle = ({ title, subtitle, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />}
      </button>
      {open && <div className="px-3 pb-4">{children}</div>}
    </div>
  );
};

const Card = ({ title, icon, value, note }) => (
  <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-2">
    <div className="flex items-center gap-2 text-[var(--text-primary)]">
      {icon}
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    {note && <p className="text-[11px] text-[var(--text-secondary)]">{note}</p>}
  </div>
);

const EnvelopeRow = ({ label, value, limit }) => (
  <div className="flex items-center justify-between bg-[var(--bg-card)]/60 border border-[var(--border-dark)] rounded-lg px-3 py-2">
    <div className="text-[var(--text-primary)]">{label}</div>
    <div className="text-[var(--text-primary)] font-semibold">{value}</div>
    <div className="text-[11px] text-[var(--text-tertiary)]">{limit}</div>
  </div>
);

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default AnalyticsDashboard;

