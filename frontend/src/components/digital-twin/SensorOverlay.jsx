/**
 * 2D overlay showing live sensor values for the digital twin view.
 */
import React from 'react';

export default function SensorOverlay({ realtime = {}, overview = {}, pumpId }) {
  const health = overview?.health_score ?? overview?.health_index ?? realtime?.health_index ?? '—';
  const flow = realtime?.flow ?? realtime?.flow_m3h ?? '—';
  const rpm = realtime?.rpm ?? '—';
  const bearingTemp = realtime?.bearing_temp ?? realtime?.bearing_temp_c ?? '—';
  const vibration = realtime?.vibration ?? realtime?.vibration_mm_s ?? '—';
  const dischargePressure = realtime?.discharge_pressure_bar ?? '—';

  const format = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v);

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xs rounded-xl bg-[var(--bg-card)]/95 border border-[var(--border-color)] shadow-lg p-4 text-sm">
      <div className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        Live data {pumpId ? `· ${pumpId}` : ''}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[var(--text-secondary)]">
        <dt className="text-[var(--text-tertiary)]">Health</dt>
        <dd className="font-medium text-[var(--text-primary)]">{format(health)}%</dd>
        <dt className="text-[var(--text-tertiary)]">Flow</dt>
        <dd>{format(flow)} m³/h</dd>
        <dt className="text-[var(--text-tertiary)]">RPM</dt>
        <dd>{format(rpm)}</dd>
        <dt className="text-[var(--text-tertiary)]">Bearing temp</dt>
        <dd>{format(bearingTemp)} °C</dd>
        <dt className="text-[var(--text-tertiary)]">Vibration</dt>
        <dd>{format(vibration)} mm/s</dd>
        <dt className="text-[var(--text-tertiary)]">Discharge P</dt>
        <dd>{format(dischargePressure)} bar</dd>
      </dl>
    </div>
  );
}
