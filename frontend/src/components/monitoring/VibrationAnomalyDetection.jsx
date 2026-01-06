import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Radio, Waves, Move3d } from 'lucide-react';
import { fetchVibrationData } from '../../services/api';
import { useDemoTimestamp } from '../../hooks/useDemoTimestamp';

const VibrationAnomalyDetection = ({ pumpId }) => {
  const demoTimestamp = useDemoTimestamp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setErrorText('');
        const result = await fetchVibrationData(pumpId, demoTimestamp);
        setData(result);
      } catch (err) {
        console.error('Error loading vibration anomaly data', err);
        setErrorText('Unable to load vibration signals. Check backend connectivity.');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, demoTimestamp ? 500 : 5000);
    return () => clearInterval(interval);
  }, [pumpId, demoTimestamp]);

  const derived = useMemo(() => {
    if (!data) return null;
    const rms = Number(data.vibration_rms ?? 0);
    const misalign = Number(data.misalignment_indicator ?? 0);
    const imbalance = Number(data.imbalance_indicator ?? 0);
    const bearing = Number(data.bearing_condition_index ?? 0);

    const risk = clamp(
      rms * 15 + misalign * 35 + imbalance * 35 + (bearing < 60 ? (60 - bearing) * 0.5 : 0),
      0,
      100
    );

    let fault = 'Normal';
    if (misalign > 0.65) fault = 'Likely misalignment';
    else if (imbalance > 0.65) fault = 'Likely imbalance';
    else if (rms > 4.5) fault = 'High vibration';

    return {
      rms: rms.toFixed(2),
      misalign: misalign.toFixed(2),
      imbalance: imbalance.toFixed(2),
      bearing: bearing.toFixed(1),
      risk,
      health: Math.max(0, 100 - risk),
      fault
    };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] p-5">
        <div className="animate-pulse text-[var(--text-secondary)] text-sm">Analyzing vibration patterns...</div>
      </div>
    );
  }

  if (!data || !derived) {
    return null;
  }

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
          <Activity className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">D. Vibration Anomaly Detection</p>
            <p className="text-[11px] text-[var(--text-secondary)]">FFT + baseline comparison</p>
          </div>
        </div>
        <Radio className="w-4 h-4 text-[var(--text-tertiary)]" />
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
                <Waves className="w-4 h-4 text-sky-300" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Anomaly Score</p>
              </div>
              <GaugeBar value={100 - derived.health} />
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{derived.health.toFixed(0)}%</p>
              <span className={`text-[11px] px-2 py-1 rounded-full border ${riskColor}`}>Risk {derived.risk.toFixed(0)}%</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Raised when RMS rises vs baseline or when misalignment/imbalance indices exceed limits.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Move3d className="w-4 h-4 text-primary-300" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Likely Fault</p>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{derived.fault}</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-primary)]">
              <Chip label={`RMS: ${derived.rms} ${data.vibration_unit}`} />
              <Chip label={`Misalign idx: ${derived.misalign}`} />
              <Chip label={`Imbalance idx: ${derived.imbalance}`} />
              <Chip label={`Bearing cond: ${derived.bearing}%`} />
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Detection logic</p>
            <Bullet text="Compare current FFT vs baseline; flag rising amplitudes near 1× and 2× shaft freq." />
            <Bullet text="Use misalignment/imbalance indices from vibration analytics to classify fault." />
            <Bullet text="Alert when RMS or indices exceed tuned thresholds; display likely cause." />
          </div>
        </div>
      </div>
    </div>
  );
};

const Chip = ({ label }) => (
  <span className="px-2 py-1 rounded-full bg-[var(--bg-card)]/70 border border-[var(--border-color)]">{label}</span>
);

const Bullet = ({ text }) => (
  <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1" />
    <span>{text}</span>
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

export default VibrationAnomalyDetection;






