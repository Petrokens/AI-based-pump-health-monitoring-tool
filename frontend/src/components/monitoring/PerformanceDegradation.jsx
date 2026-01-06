import React, { useEffect, useMemo, useState } from 'react';
import { TrendingDown, Droplets, Gauge, Activity } from 'lucide-react';
import { fetchElectricalData, fetchHydraulicData } from '../../services/api';
import { useDemoTimestamp } from '../../hooks/useDemoTimestamp';

const PerformanceDegradation = ({ pumpId }) => {
  const demoTimestamp = useDemoTimestamp();
  const [electrical, setElectrical] = useState(null);
  const [hydraulic, setHydraulic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setErrorText('');
        const [el, hy] = await Promise.all([
          fetchElectricalData(pumpId), 
          fetchHydraulicData(pumpId, demoTimestamp)
        ]);
        setElectrical(el);
        setHydraulic(hy);
      } catch (err) {
        console.error('Error loading performance data', err);
        setErrorText('Unable to load performance signals. Check backend connectivity.');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, demoTimestamp ? 500 : 5000);
    return () => clearInterval(interval);
  }, [pumpId, demoTimestamp]);

  const derived = useMemo(() => {
    if (!electrical || !hydraulic) return null;
    const flow = Number(hydraulic.flow ?? 0);
    const dpBar = Number(hydraulic.differential_pressure ?? 0);
    const head = dpBar * 10.2; // m
    const power = Number(electrical.power_consumption ?? electrical.power_kw ?? 0);

    const hydraulicPowerKw = flow * dpBar * 0.2778; // approx kW
    const efficiency = power > 0 ? clamp((hydraulicPowerKw / power) * 100, 0, 120) : 0;

    // Baselines (rough heuristics)
    const baselineHead = 70;
    const baselineEff = 75;

    const headDrop = clamp(((baselineHead - head) / baselineHead) * 100, 0, 100);
    const effDrop = clamp(((baselineEff - efficiency) / baselineEff) * 100, 0, 100);
    const curveDeviation = clamp(headDrop * 0.6 + effDrop * 0.4, 0, 100);

    return {
      flow: flow.toFixed(1),
      head: head.toFixed(1),
      hydraulicPowerKw: hydraulicPowerKw.toFixed(2),
      power: power.toFixed(1),
      efficiency: efficiency.toFixed(1),
      headDrop,
      effDrop,
      curveDeviation
    };
  }, [electrical, hydraulic]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] p-5">
        <div className="animate-pulse text-[var(--text-secondary)] text-sm">Evaluating pump performance...</div>
      </div>
    );
  }

  if (!derived) return null;

  const deviationColor =
    derived.curveDeviation > 70
      ? 'text-red-300 bg-red-500/10 border-red-500/30'
      : derived.curveDeviation > 40
      ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] mt-4 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">F. Performance Degradation</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Curve vs actual + efficiency</p>
          </div>
        </div>
        <Gauge className="w-4 h-4 text-[var(--text-tertiary)]" />
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
                <Activity className="w-4 h-4 text-sky-300" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Curve deviation</p>
              </div>
              <GaugeBar value={derived.curveDeviation} />
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{(100 - derived.curveDeviation).toFixed(0)}%</p>
              <span className={`text-[11px] px-2 py-1 rounded-full border ${deviationColor}`}>
                Deviation {derived.curveDeviation.toFixed(0)}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Compares actual head/flow/power against baseline curve; rising deviation flags wear or fouling.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Efficiency & head</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-primary)]">
              <Metric label="Efficiency" value={`${derived.efficiency}%`} />
              <Metric label="Head drop" value={`-${derived.headDrop.toFixed(0)}%`} />
              <Metric label="Flow" value={`${derived.flow} ${hydraulic?.flow_unit || 'm³/h'}`} />
              <Metric label="Head" value={`${derived.head} m`} />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Efficiency = hydraulic power / motor power; head from ΔP (bar → meters).
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Signals watched</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-primary)]">
              <Chip label={`ΔP: ${hydraulic?.differential_pressure?.toFixed(2) || '--'} ${hydraulic?.pressure_unit || 'bar'}`} />
              <Chip label={`Hydraulic kW: ${derived.hydraulicPowerKw}`} />
              <Chip label={`Motor kW: ${derived.power}`} />
              <Chip label={`Eff drop: ${derived.effDrop.toFixed(0)}%`} />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Deviations hint at impeller wear, erosion, blockage, or pipe fouling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Chip = ({ label }) => (
  <span className="px-2 py-1 rounded-full bg-[var(--bg-card)]/70 border border-[var(--border-color)]">{label}</span>
);

const Metric = ({ label, value }) => (
  <div className="bg-[var(--bg-card)]/70 rounded-lg border border-[var(--border-dark)] px-3 py-2 flex items-center justify-between">
    <span className="text-[var(--text-secondary)]">{label}</span>
    <span className="text-[var(--text-primary)] font-semibold">{value}</span>
  </div>
);

const GaugeBar = ({ value }) => (
  <div className="w-20 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400"
      style={{ width: `${clamp(value, 0, 100)}%` }}
    />
  </div>
);

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default PerformanceDegradation;






