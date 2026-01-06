import React, { useEffect, useMemo, useState } from 'react';
import { Droplets, Activity, Clock, Gauge, AlertTriangle, Waves, Info } from 'lucide-react';
import { fetchHydraulicData } from '../../services/api';
import { useDemoTimestamp } from '../../hooks/useDemoTimestamp';

const CavitationPrediction = ({ pumpId }) => {
  const demoTimestamp = useDemoTimestamp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setErrorText('');
        const result = await fetchHydraulicData(pumpId, demoTimestamp);
        setData(result);
      } catch (err) {
        console.error('Error loading cavitation data:', err);
        setErrorText('Unable to load cavitation inputs (suction/flow). Check backend connectivity.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, demoTimestamp ? 500 : 5000);
    return () => clearInterval(interval);
  }, [pumpId, demoTimestamp]);

  const derived = useMemo(() => {
    if (!data) return null;
    const npshAvailable = data.suction_pressure * 10.2; // bar → meters (approx)
    const npshRequired = 3 + data.flow / 100; // same heuristic as backend
    const npshMargin = data.npsh_margin;
    const cavitationIndex = clamp(data.cavitation_index, 0, 100);
    const risk = clamp(100 - cavitationIndex, 0, 100);

    // Simple time-to-risk heuristic: lower margin -> sooner risk
    const timeToRiskMin = npshMargin <= 0 ? 0 : Math.max(2, Math.round((npshMargin / Math.max(0.5, npshRequired)) * 60));

    return {
      npshAvailable: npshAvailable.toFixed(2),
      npshRequired: npshRequired.toFixed(2),
      npshMargin: npshMargin.toFixed(2),
      cavitationIndex: cavitationIndex.toFixed(1),
      risk,
      timeToRiskMin
    };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] p-5">
        <div className="animate-pulse text-[var(--text-secondary)] text-sm">Running cavitation model...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const riskColor =
    derived?.risk > 70
      ? 'text-red-300 bg-red-500/10 border-red-500/30'
      : derived?.risk > 40
      ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] mt-4 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">C. Cavitation Prediction</p>
            <p className="text-[11px] text-[var(--text-secondary)]">NPSHa vs NPSHr + flow/RPM oscillations</p>
          </div>
        </div>
        <Info className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>

      <div className="p-5 space-y-4">
        {errorText && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded px-3 py-2">
            {errorText}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-300" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Cavitation Risk</p>
              </div>
              <Gauge className="w-4 h-4 text-[var(--text-tertiary)]" />
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{derived.cavitationIndex}%</p>
              <span className={`text-[11px] px-2 py-1 rounded-full border ${riskColor}`}>Risk {derived.risk.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400"
                style={{ width: `${100 - derived.risk}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Risk rises when NPSHa approaches NPSHr or when suction/flow oscillates.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-300" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Time to Cavitation</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{derived.timeToRiskMin}</p>
              <span className="text-[var(--text-secondary)] text-sm">min (heuristic)</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Based on NPSH margin decay. Faster decay expected when margin &lt; 1 m.
            </p>
            {derived.timeToRiskMin <= 5 && (
              <div className="text-[11px] text-amber-300 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
                <AlertTriangle className="w-3 h-3" />
                Consider throttling flow or raising suction head.
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-primary-300" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">NPSH Check</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="NPSHa" value={derived.npshAvailable} unit="m" />
              <Metric label="NPSHr" value={derived.npshRequired} unit="m" />
              <Metric label="Margin" value={derived.npshMargin} unit="m" />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Cavitation risk increases as margin approaches zero; keep NPSHa &gt; NPSHr.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">How it works</p>
            <Bullet text="Cavitation occurs when suction pressure drops below vapor pressure → bubbles form." />
            <Bullet text="Formula: compare NPSHa (available) vs NPSHr (required)." />
            <Bullet text="AI watches suction pressure, flow, RPM*, temperature for oscillations/surges." />
            <p className="text-[11px] text-[var(--text-tertiary)]">*RPM placeholder if provided by sensor feed.</p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Signals watched</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-primary)]">
              <Chip label={`Suction: ${data.suction_pressure.toFixed(2)} bar`} />
              <Chip label={`Flow: ${data.flow.toFixed(2)} ${data.flow_unit}`} />
              <Chip label={`ΔP: ${data.differential_pressure.toFixed(2)} ${data.pressure_unit}`} />
              <Chip label={`Cavitation idx: ${data.cavitation_index.toFixed(1)}%`} />
              <Chip label={`NPSH margin: ${data.npsh_margin.toFixed(2)} ${data.npsh_margin_unit}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, unit }) => (
  <div className="bg-[var(--bg-card)]/70 rounded-lg border border-[var(--border-dark)] px-3 py-2">
    <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
    <p className="text-lg font-semibold text-[var(--text-primary)]">
      {value} <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
    </p>
  </div>
);

const Bullet = ({ text }) => (
  <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1" />
    <span>{text}</span>
  </div>
);

const Chip = ({ label }) => (
  <span className="px-2 py-1 rounded-full bg-[var(--bg-card)]/70 border border-[var(--border-color)]">{label}</span>
);

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default CavitationPrediction;






