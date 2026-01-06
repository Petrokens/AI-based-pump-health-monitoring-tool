import React, { useEffect, useMemo, useState } from 'react';
import { Zap, AlertTriangle, Gauge, Timer, Activity } from 'lucide-react';
import { fetchElectricalData, fetchHydraulicData } from '../../services/api';
import { useDemoTimestamp } from '../../hooks/useDemoTimestamp';

const MotorOverloadingPrediction = ({ pumpId }) => {
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
        console.error('Error loading overloading data', err);
        setErrorText('Unable to load motor/hydraulic inputs. Check backend connectivity.');
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
    const current = Number(electrical.motor_current ?? 0);
    const power = Number(electrical.power_consumption ?? electrical.power_kw ?? 0);
    const pf = Number(electrical.power_factor ?? 0.9);
    const flow = Number(hydraulic.flow ?? 0);
    const head = Number(hydraulic.differential_pressure ?? 0) * 10.2;

    // Heuristic overload risk: higher current and power relative to flow/head => risk
    const loadRatio = power > 0 && flow > 0 ? (power / Math.max(flow, 1)) * 5 : 0;
    const headPenalty = head < 30 ? 5 : head < 20 ? 10 : 0;
    const risk = clamp(current * 0.6 + loadRatio + headPenalty, 0, 100);
    const health = Math.max(0, 100 - risk);
    const tripHours = risk > 75 ? 1 : risk > 55 ? 3 : 8;

    return {
      current: current.toFixed(1),
      power: power.toFixed(1),
      pf: pf.toFixed(3),
      flow: flow.toFixed(1),
      head: head.toFixed(1),
      risk,
      health,
      tripHours
    };
  }, [electrical, hydraulic]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] p-5">
        <div className="animate-pulse text-[var(--text-secondary)] text-sm">Evaluating overload risk...</div>
      </div>
    );
  }

  if (!derived) return null;

  const riskColor =
    derived.risk > 70
      ? 'text-red-300 bg-red-500/10 border-red-500/30'
      : derived.risk > 40
      ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] mt-4 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">E. Motor Overloading Prediction</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Current + flow/head correlation</p>
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
                <p className="text-sm font-semibold text-[var(--text-primary)]">Health vs Risk</p>
              </div>
              <GaugeBar value={derived.risk} />
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{derived.health.toFixed(0)}%</p>
              <span className={`text-[11px] px-2 py-1 rounded-full border ${riskColor}`}>Risk {derived.risk.toFixed(0)}%</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Risk rises when motor current and kW increase faster than flow/head.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-300" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Trip prediction</p>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">Motor may trip in ~{derived.tripHours} hours</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-primary)]">
              <Chip label={`Current: ${derived.current} A`} />
              <Chip label={`Power: ${derived.power} kW`} />
              <Chip label={`PF: ${derived.pf}`} />
            </div>
            {derived.risk > 60 && (
              <div className="text-[11px] text-amber-300 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
                <AlertTriangle className="w-3 h-3" />
                Reduce load (throttle flow) or check process demand.
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Inputs monitored</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-primary)]">
              <Chip label={`Flow: ${derived.flow} ${hydraulic?.flow_unit || 'm³/h'}`} />
              <Chip label={`Head: ${derived.head} m`} />
              <Chip label={`ΔP: ${hydraulic?.differential_pressure?.toFixed(2) || '--'} ${hydraulic?.pressure_unit || 'bar'}`} />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Model correlates motor draw vs hydraulic load; flags overload when draw increases without matching flow/head.
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

const GaugeBar = ({ value }) => (
  <div className="w-20 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400"
      style={{ width: `${clamp(value, 0, 100)}%` }}
    />
  </div>
);

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default MotorOverloadingPrediction;






