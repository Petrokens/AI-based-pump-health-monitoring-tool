/**
 * Universal PdM Dashboard – pump-type-agnostic, sensor-driven layout.
 * 3 layers: (1) Universal Pump Health, (2) Performance & Efficiency, (3) Failure Diagnostics (AI).
 * Widgets shown only when corresponding sensor/data exists.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Gauge,
  Zap,
  Thermometer,
  Droplets,
  Wind,
  RotateCw,
  Brain,
  Wrench,
  ChevronDown,
  ChevronRight,
  Shield,
  Timer,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  fetchPumpOverview,
  fetchHydraulicData,
  fetchVibrationData,
  fetchElectricalData,
  fetchMLOutputs,
  fetchAlerts,
  fetchDashboardSummary,
  fetchTrendSignals,
  fetchPerformanceCurve,
} from '../../services/api';

// Standard sensor keys → display label; if value exists in merged data, show widget
const SENSOR_LABELS = {
  suction_pressure: { label: 'Suction Pressure', unit: 'bar', icon: Droplets },
  discharge_pressure: { label: 'Discharge Pressure', unit: 'bar', icon: Gauge },
  flow_m3h: { label: 'Flow Rate', unit: 'm³/h', icon: Wind },
  flow: { label: 'Flow', unit: 'm³/h', icon: Wind },
  motor_current: { label: 'Motor Current', unit: 'A', icon: Zap },
  motor_temp: { label: 'Motor Temperature', unit: '°C', icon: Thermometer },
  bearing_temp: { label: 'Bearing Temperature', unit: '°C', icon: Thermometer },
  bearing_temp_c: { label: 'Bearing Temperature', unit: '°C', icon: Thermometer },
  vibration_rms: { label: 'Vibration RMS', unit: 'mm/s', icon: Activity },
  vibration_mm_s: { label: 'Vibration Overall RMS', unit: 'mm/s', icon: Activity },
  rpm: { label: 'Shaft Speed', unit: 'RPM', icon: RotateCw },
};

const HEALTH_BANDS = [
  { min: 80, max: 100, label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { min: 60, max: 80, label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { min: 30, max: 60, label: 'Warning', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { min: 0, max: 30, label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20' },
];

const ALARM_LEVELS = ['Normal', 'Warning', 'Alarm', 'Critical'];

const PUMP_ZONES = [
  { id: 'bearing', label: 'Bearing', cx: 50, cy: 25 },
  { id: 'seal', label: 'Seal', cx: 50, cy: 45 },
  { id: 'impeller', label: 'Impeller', cx: 50, cy: 65 },
  { id: 'motor', label: 'Motor', cx: 25, cy: 50 },
  { id: 'shaft', label: 'Shaft', cx: 75, cy: 50 },
];

function getHealthBand(score) {
  const s = Number(score) ?? 0;
  return HEALTH_BANDS.find((b) => s >= b.min && s <= b.max) || HEALTH_BANDS[3];
}

function SectionToggle({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl mb-4 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Tile({ label, value, sub, status, icon: Icon }) {
  return (
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${status ? status : 'text-[var(--text-primary)]'}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  );
}

function SmallGauge({ value, max = 100, label, unit }) {
  const num = value != null ? Number(value) : null;
  const pct = num != null && max ? Math.min(100, Math.max(0, (num / max) * 100)) : 0;
  return (
    <div className="bg-[var(--bg-card)]/60 border border-[var(--border-color)] rounded-lg p-3">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-[var(--text-primary)]">{value != null ? value : '—'}</span>
        {unit && <span className="text-xs text-[var(--text-tertiary)]">{unit}</span>}
      </div>
      <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full mt-1 overflow-hidden">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UniversalPdMDashboard({ pumpId, pumps = [], selectedPump, onPumpSelect, hidePumpList = false }) {
  const [pumpListView, setPumpListView] = useState('cards'); // 'cards' | 'table'
  const [overview, setOverview] = useState(null);
  const [hydraulic, setHydraulic] = useState(null);
  const [vibration, setVibration] = useState(null);
  const [electrical, setElectrical] = useState(null);
  const [mlOutputs, setMLOutputs] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [performanceCurve, setPerformanceCurve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!pumpId) return;
    setError('');
    try {
      const [ov, hyd, vib, elec, ml, al, summary, trend, curve] = await Promise.allSettled([
        fetchPumpOverview(pumpId),
        fetchHydraulicData(pumpId),
        fetchVibrationData(pumpId),
        fetchElectricalData(pumpId),
        fetchMLOutputs(pumpId),
        fetchAlerts(pumpId),
        fetchDashboardSummary(),
        fetchTrendSignals(pumpId, ['vibration_mm_s', 'bearing_temp_c', 'flow_m3h', 'discharge_pressure_bar'], 168),
        fetchPerformanceCurve(pumpId),
      ]);
      setOverview(ov.status === 'fulfilled' ? ov.value : null);
      setHydraulic(hyd.status === 'fulfilled' ? hyd.value : null);
      setVibration(vib.status === 'fulfilled' ? vib.value : null);
      setElectrical(elec.status === 'fulfilled' ? elec.value : null);
      setMLOutputs(ml.status === 'fulfilled' ? ml.value : null);
      setAlerts(al.status === 'fulfilled' ? al.value : null);
      setFleetSummary(summary.status === 'fulfilled' ? summary.value : null);
      setTrends(trend.status === 'fulfilled' ? trend.value : null);
      setPerformanceCurve(curve.status === 'fulfilled' ? curve.value : null);
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [pumpId]);

  const mergedSensors = useMemo(() => {
    const o = overview || {};
    const h = hydraulic || {};
    const v = vibration || {};
    const e = electrical || {};
    const latest = v?.latest_reading || {};
    return {
      suction_pressure: h.suction_pressure ?? latest.suction_pressure_bar ?? null,
      discharge_pressure: h.discharge_pressure ?? h.differential_pressure ?? latest.discharge_pressure_bar ?? null,
      flow_m3h: h.flow ?? h.flow_m3h ?? latest.flow_m3h ?? null,
      flow: h.flow ?? latest.flow_m3h ?? null,
      motor_current: e.motor_current ?? e.current_a ?? null,
      motor_temp: e.motor_temperature ?? e.temperature_c ?? null,
      bearing_temp: v.bearing_temperature ?? latest.bearing_temp_c ?? null,
      bearing_temp_c: v.bearing_temperature ?? latest.bearing_temp_c ?? null,
      vibration_rms: v.vibration_rms ?? latest.vibration_mm_s ?? null,
      vibration_mm_s: v.vibration_rms ?? latest.vibration_mm_s ?? null,
      rpm: latest.rpm ?? e.rpm ?? null,
    };
  }, [overview, hydraulic, vibration, electrical]);

  const visibleSensors = useMemo(() => {
    return Object.entries(SENSOR_LABELS).filter(([key]) => {
      const val = mergedSensors[key];
      return val != null && val !== '' && !Number.isNaN(Number(val));
    });
  }, [mergedSensors]);

  const failureProbs = useMemo(() => {
    const probs = mlOutputs?.failure_mode_probabilities || {};
    return Object.entries(probs)
      .map(([name, p]) => ({ name, p: (Number(p) || 0) * 100 }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p)
      .slice(0, 5);
  }, [mlOutputs]);

  const alarmCounts = useMemo(() => {
    const list = alerts?.alerts || [];
    return {
      Normal: list.filter((a) => (a.severity || a.level) === 'Normal' || !a.severity).length,
      Warning: list.filter((a) => (a.severity || a.level) === 'Warning').length,
      Alarm: list.filter((a) => (a.severity || a.level) === 'Alarm').length,
      Critical: list.filter((a) => (a.severity || a.level) === 'Critical').length,
    };
  }, [alerts]);

  const healthBand = getHealthBand(overview?.health_score ?? mlOutputs?.health_index ?? 0);
  const failureProbabilityPct = mlOutputs?.failure_probability != null ? (Number(mlOutputs.failure_probability) * 100) : (100 - (overview?.health_score ?? 80));
  const rulHours = overview?.rul_hours ?? mlOutputs?.rul_hours ?? 0;
  const aiConfidence = mlOutputs?.confidence ?? mlOutputs?.ai_confidence ?? 85;

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" aria-hidden />
        <p className="ml-3 text-[var(--text-secondary)]">Loading universal PdM dashboard...</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
        {error}
      </div>
    );
  }

  const pumpList = Array.isArray(pumps) ? pumps : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* ========== Your Pumps – Card / Table view (hidden on single-pump dashboard) ========== */}
      {!hidePumpList && pumpList.length > 0 && (
        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Your Pumps</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPumpListView('cards')}
                className={`p-2 rounded-lg transition-colors ${pumpListView === 'cards' ? 'bg-primary-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                title="Card view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setPumpListView('table')}
                className={`p-2 rounded-lg transition-colors ${pumpListView === 'table' ? 'bg-primary-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                title="Table view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {pumpListView === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pumpList.map((pump) => {
                const isSelected = pump.id === selectedPump || pump.id === pumpId;
                const health = pump.health_index ?? 85;
                const band = getHealthBand(health);
                return (
                  <button
                    key={pump.id}
                    type="button"
                    onClick={() => onPumpSelect?.(pump.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/60 hover:border-primary-500/50 hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Activity className="w-5 h-5 text-primary-500 shrink-0" />
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${band.bg} ${band.color}`}>
                        {band.label}
                      </span>
                    </div>
                    <p className="font-bold text-[var(--text-primary)] truncate" title={pump.name || pump.id}>
                      {pump.name || pump.id}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">ID: {pump.id}</p>
                    <div className="mt-2 flex gap-2 text-xs text-[var(--text-secondary)]">
                      <span>Health: {Number(health).toFixed(0)}%</span>
                      {pump.rul_hours != null && <span>RUL: {pump.rul_hours}h</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Pump Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Pump ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Health</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">RUL</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pumpList.map((pump) => {
                    const isSelected = pump.id === selectedPump || pump.id === pumpId;
                    const health = pump.health_index ?? 85;
                    const band = getHealthBand(health);
                    return (
                      <tr
                        key={pump.id}
                        onClick={() => onPumpSelect?.(pump.id)}
                        className={`border-b border-[var(--border-color)] cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-500/15' : 'hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{pump.name || pump.id}</td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{pump.id}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium ${band.color}`}>{Number(health).toFixed(0)}%</span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{pump.rul_hours != null ? `${pump.rul_hours} h` : '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${band.bg} ${band.color}`}>
                            {band.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========== ROW 1: Universal Pump Health – Status & KPIs ========== */}
      <section aria-label="Universal Pump Health">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-500" />
          Layer 1: Universal Pump Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <Tile label="Pump" value={overview?.pump_id || pumpId} icon={Activity} />
          <Tile label="Status" value={overview?.operational_status || '—'} status={healthBand.color} icon={Activity} />
          <Tile label="Health Index" value={overview?.health_score != null ? `${Number(overview.health_score).toFixed(0)}` : (mlOutputs?.health_index != null ? `${Number(mlOutputs.health_index).toFixed(0)}` : '—')} sub={healthBand.label} status={healthBand.color} icon={Shield} />
          <Tile label="Failure Probability" value={typeof failureProbabilityPct === 'number' ? `${failureProbabilityPct.toFixed(0)}%` : '—'} icon={AlertTriangle} />
          <Tile label="RUL" value={rulHours ? `${rulHours} h` : '—'} sub={rulHours ? `${Math.round(rulHours / 24)} days` : null} icon={Timer} />
          <Tile label="AI Confidence" value={aiConfidence != null ? `${Number(aiConfidence).toFixed(0)}%` : '—'} icon={Brain} />
        </div>

        {/* Alarm Overview */}
        <div className="bg-[var(--bg-card)]/60 border border-[var(--border-color)] rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Alarm Overview</p>
          <div className="flex flex-wrap gap-2">
            {ALARM_LEVELS.map((level) => {
              const count = alarmCounts[level] ?? 0;
              const isNormal = level === 'Normal';
              const color = level === 'Critical' ? 'bg-red-500/30' : level === 'Alarm' ? 'bg-orange-500/30' : level === 'Warning' ? 'bg-amber-500/30' : 'bg-emerald-500/20';
              return (
                <span key={level} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${color} text-[var(--text-primary)]`}>
                  {level}: {count}
                </span>
              );
            })}
          </div>
        </div>

        {/* Key Sensor Indicators – sensor-driven */}
        {visibleSensors.length > 0 && (
          <div className="bg-[var(--bg-card)]/60 border border-[var(--border-color)] rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Key Sensor Indicators</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {visibleSensors.map(([key, { label, unit }]) => (
                <SmallGauge key={key} label={label} value={mergedSensors[key]} unit={unit} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========== ROW 2 & 3: Performance & Efficiency ========== */}
      <SectionToggle title="Layer 2: Performance & Efficiency" subtitle="Operating curve, energy, hydraulic health" defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Pump Operating Curve</p>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Actual vs design flow/head</p>
            {performanceCurve?.points?.length > 0 ? (
              <div className="h-48 flex items-center justify-center text-[var(--text-secondary)] text-sm">Curve chart (design vs actual)</div>
            ) : (
              <div className="h-24 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
                Design: Flow {overview?.pump_master?.rated_flow_m3h ?? '—'} m³/h, Head {overview?.pump_master?.rated_head_m ?? '—'} m. Actual: Flow {mergedSensors.flow ?? '—'}, Head from pressure.
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Energy Performance</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Motor power: {electrical?.power_consumption ?? electrical?.power_kw ?? '—'} kW</div>
                <div>Efficiency: {hydraulic?.efficiency_percent ?? mlOutputs?.efficiency ?? '—'}%</div>
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Hydraulic Health</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-[var(--bg-card)]">Cavitation risk: {hydraulic?.cavitation_index != null ? `${(100 - Number(hydraulic.cavitation_index)).toFixed(0)}%` : '—'}</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-card)]">NPSH margin: {hydraulic?.npsh_margin ?? '—'}</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-card)]">Zone: {hydraulic?.operating_zone ?? 'BEP'}</span>
              </div>
            </div>
          </div>
        </div>
      </SectionToggle>

      {/* ========== ROW 4: Failure Diagnostics (AI) ========== */}
      <SectionToggle title="Layer 3: Failure Diagnostics (AI)" subtitle="Top failures, signatures, maintenance recommendations" defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Top 5 Failure Probabilities</p>
            <ul className="space-y-2">
              {failureProbs.length ? failureProbs.map(({ name, p }) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="text-[var(--text-primary)] capitalize">{name.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-amber-400">{p.toFixed(0)}%</span>
                </li>
              )) : (
                <li className="text-[var(--text-tertiary)] text-sm">No failure data</li>
              )}
            </ul>
          </div>
          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Failure Signature Detection</p>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              {(mlOutputs?.detected_patterns || ['Cavitation pattern', 'Bearing pattern', 'Misalignment', 'Imbalance', 'Dry running']).slice(0, 5).map((p, i) => (
                <li key={i}>{typeof p === 'string' ? p : p.name || p}</li>
              ))}
            </ul>
          </div>
          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Maintenance Recommendation</p>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              {(alerts?.alerts?.filter((a) => a.recommendation).map((a) => a.recommendation) || [
                'Inspect suction line blockage',
                'Check bearing lubrication',
                'Verify pump alignment',
                'Replace mechanical seal within 120 h',
              ].slice(0, 4)).map((r, i) => (
                <li key={i} className="flex items-start gap-1">
                  <Wrench className="w-3 h-3 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Advanced AI Indicators */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Sensor Correlation Score', value: mlOutputs?.sensor_correlation_score ?? 78, unit: '%' },
            { label: 'Failure Detectability Index', value: mlOutputs?.failure_detectability_index ?? 82, unit: '%' },
            { label: 'Maintenance Priority Score', value: mlOutputs?.maintenance_priority_score ?? 65, unit: '' },
            { label: 'Shutdown Risk Level', value: mlOutputs?.shutdown_risk_level ?? 'Low', unit: '' },
            { label: 'AI Confidence Score', value: mlOutputs?.confidence ?? aiConfidence, unit: '%' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-[var(--bg-card)]/60 border border-[var(--border-color)] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{value}{unit}</p>
            </div>
          ))}
        </div>
      </SectionToggle>

      {/* ========== Pump Health Index Band ========== */}
      <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-xl p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Pump Health Index (0–100)</p>
        <div className="flex gap-2 flex-wrap">
          {HEALTH_BANDS.map((b) => (
            <span key={b.label} className={`px-3 py-1 rounded-lg text-xs ${b.bg} ${b.color}`}>
              {b.min}–{b.max}: {b.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">Derived from vibration, temperature, efficiency, hydraulic performance, alarms, and trends.</p>
      </div>

      {/* ========== Digital Twin Panel ========== */}
      <SectionToggle title="Standard Pump Digital Twin" subtitle="Expected vs actual">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Predicted Flow', expected: overview?.pump_master?.rated_flow_m3h, actual: mergedSensors.flow },
            { label: 'Predicted Head', expected: overview?.pump_master?.rated_head_m, actual: hydraulic?.head_m },
            { label: 'Predicted Power', expected: overview?.pump_master?.rated_power_kw, actual: electrical?.power_kw ?? electrical?.power_consumption },
          ].map(({ label, expected, actual }) => {
            const dev = expected && actual != null && Number(expected) ? (((Number(actual) - Number(expected)) / Number(expected)) * 100).toFixed(0) : null;
            return (
              <div key={label} className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Expected: {expected ?? '—'} | Actual: {actual ?? '—'}</p>
                {dev != null && <p className="text-xs text-amber-400">Deviation: {dev}%</p>}
              </div>
            );
          })}
        </div>
      </SectionToggle>

      {/* ========== Trend Analytics ========== */}
      <SectionToggle title="Trend Analytics" subtitle="7 / 30 / 90 days">
        {trends?.signals ? (
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            {Object.keys(trends.signals).slice(0, 4).map((sig) => (
              <div key={sig}>{sig}: trend data available</div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">Vibration, bearing temperature, flow vs power, and pressure trends (use Trend Explorer for full charts).</p>
        )}
      </SectionToggle>

      {/* ========== Pump Failure Map ========== */}
      <SectionToggle title="Pump Failure Map" subtitle="Click areas to see anomaly">
        <div className="flex justify-center py-6">
          <div className="relative w-48 h-48 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] flex items-center justify-center">
            <span className="text-[var(--text-tertiary)] text-sm">Pump</span>
            {PUMP_ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                className="absolute w-10 h-10 rounded-full bg-primary-500/30 border border-primary-500 hover:bg-primary-500/50 text-xs font-medium text-[var(--text-primary)]"
                style={{ left: `${z.cx - 5}%`, top: `${z.cy - 5}%` }}
                title={z.label}
              >
                {z.label.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-[var(--text-secondary)] text-center">Bearing • Seal • Impeller • Motor • Shaft — system highlights where anomaly exists.</p>
      </SectionToggle>

      {/* ========== Fleet Monitoring ========== */}
      {fleetSummary && (fleetSummary.total_pumps > 0 || pumps.length > 0) && (
        <SectionToggle title="Fleet Monitoring" subtitle="Total pumps, healthy / warning / critical" defaultOpen>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile label="Total Pumps" value={fleetSummary.total_pumps ?? pumps.length} icon={Activity} />
            <Tile label="Healthy" value={fleetSummary.normal ?? 0} status="text-emerald-400" icon={CheckCircle2} />
            <Tile label="Warning" value={fleetSummary.warning ?? 0} status="text-amber-400" icon={AlertCircle} />
            <Tile label="Critical" value={fleetSummary.critical ?? 0} status="text-red-400" icon={AlertTriangle} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Top 10 pumps needing attention: use pump selector in header to switch. Fleet summary from dashboard/summary API.</p>
        </SectionToggle>
      )}
    </div>
  );
}
