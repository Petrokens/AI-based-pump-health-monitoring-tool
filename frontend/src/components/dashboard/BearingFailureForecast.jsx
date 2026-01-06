import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Vibrate,
  ThermometerSun,
  Gauge,
  Cpu,
  Clock
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  fetchVibrationData,
  fetchThermalData,
  fetchElectricalData
} from '../../services/api';
import { useDemoContext } from '../../contexts/DemoContext';

const BearingFailureForecast = ({ pumpId }) => {
  const { demoState } = useDemoContext();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        setErrorText('');
        
        // Use demo timestamp if demo is active
        const atParam = demoState.isActive && demoState.realTimestamp 
          ? demoState.realTimestamp 
          : undefined;

        const [vibration, thermal, electrical] = await Promise.all([
          fetchVibrationData(pumpId, atParam),
          fetchThermalData(pumpId, atParam),
          fetchElectricalData(pumpId)
        ]);

        const next = buildBearingForecast(vibration, thermal, electrical);
        setForecast(next);
      } catch (err) {
        console.error('Error loading bearing forecast:', err);
        setForecast(null);
        setErrorText('Unable to load bearing forecast. Check backend connectivity.');
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
    // Update more frequently when demo is active
    const interval = setInterval(loadForecast, demoState.isActive ? 500 : 7000);
    return () => clearInterval(interval);
  }, [pumpId, demoState.isActive, demoState.realTimestamp]);

  const riskColor =
    forecast?.risk > 70 ? 'text-red-400 bg-red-500/10 border-red-500/30' : forecast?.risk > 45 ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="bg-[var(--bg-card)]/80 rounded-2xl border border-[var(--border-color)] mt-4 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">B. Bearing Failure Forecast</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Vibration + temperature + load fused model</p>
          </div>
        </div>
        <Cpu className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>

      <div className="p-5 space-y-4">
        {errorText && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded px-3 py-2">
            {errorText}
          </div>
        )}
        {loading ? (
          <div className="text-[var(--text-secondary)] text-sm">Running bearing model...</div>
        ) : !forecast ? (
          <div className="text-[var(--text-secondary)] text-sm">No bearing forecast available.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-primary-300" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Health</p>
                  </div>
                  <Gauge className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{forecast.health.toFixed(0)}%</p>
                  <span className={`text-[11px] px-2 py-1 rounded-full border ${riskColor}`}>
                    Risk {forecast.risk.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400"
                    style={{ width: `${forecast.health}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center text-[11px] text-[var(--text-secondary)] gap-2">
                  <Pill label="Vib" value={`${forecast.inputs.vibration_mm_s} mm/s`} />
                  <Pill label="Temp" value={`${forecast.inputs.temperature_c}°C`} />
                  <Pill label="Power" value={`${forecast.inputs.power_kw} kW`} />
                  <Pill label="Misalign" value={forecast.inputs.misalignment_idx.toFixed(2)} />
                  <Pill label="Imbalance" value={forecast.inputs.imbalance_idx.toFixed(2)} />
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-300" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Remaining Useful Life</p>
                  </div>
                  <Activity className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{forecast.rul_days}</p>
                  <span className="text-[var(--text-secondary)] text-sm">days (est.)</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Based on degradation velocity across vibration and thermal drift.
                </p>
                <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 flex-wrap">
                  <Pill label="Heat" value={forecast.flags.overheat ? 'Overheat' : 'OK'} />
                  <Pill label="Vibration" value={forecast.flags.high_vibration ? 'High' : 'OK'} />
                  <Pill label="Overall" value={forecast.health > 60 ? 'Stable' : 'Watch'} />
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4 text-amber-300" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Recommended Action</p>
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)] leading-tight">{forecast.action}</p>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1">
                  <p>{forecast.rationale}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Updated every 7s with latest sensor fusion</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-primary-400" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Bearing Stress Trend</p>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">Health vs temp/vibration</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.trend}>
                      <defs>
                        <linearGradient id="bearingHealthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="bearingTempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} domain={[0, 110]} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-primary)', border: `1px solid var(--border-color)` }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="health"
                        stroke="#22d3ee"
                        fill="url(#bearingHealthGradient)"
                        strokeWidth={2}
                        dot={false}
                        name="Health %"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="temperature"
                        stroke="#f59e0b"
                        fill="url(#bearingTempGradient)"
                        strokeWidth={1.5}
                        dot={false}
                        name="Temp °C"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="vibration"
                        stroke="#a78bfa"
                        fillOpacity={0}
                        strokeWidth={1.5}
                        dot={false}
                        name="Vibration mm/s"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-dark)] rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Drivers</p>
                <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                  <Driver label="Vibration severity" value={forecast.inputs.vibration_mm_s} unit="mm/s" weight="high" />
                  <Driver label="Bearing temperature" value={forecast.inputs.temperature_c} unit="°C" weight="high" />
                  <Driver label="Load / power" value={forecast.inputs.power_kw} unit="kW" weight="medium" />
                  <Driver label="Misalignment index" value={forecast.inputs.misalignment_idx.toFixed(2)} unit="" weight="medium" />
                  <Driver label="Imbalance index" value={forecast.inputs.imbalance_idx.toFixed(2)} unit="" weight="low" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BearingFailureForecast;

const Pill = ({ label, value }) => (
  <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)]/70 border border-[var(--border-color)] text-[var(--text-secondary)]">
    {label} {value}
  </span>
);

const Driver = ({ label, value, unit, weight }) => {
  const color =
    weight === 'high' ? 'text-rose-300' : weight === 'medium' ? 'text-amber-300' : 'text-[var(--text-secondary)]';
  return (
    <div className="flex items-center justify-between bg-[var(--bg-tertiary)]/60 border border-[var(--border-dark)] rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${weight === 'high' ? 'bg-rose-400' : weight === 'medium' ? 'bg-amber-300' : 'bg-[var(--text-tertiary)]'}`} />
        <span className="text-[var(--text-primary)]">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>
        {value} {unit}
      </span>
    </div>
  );
};

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const buildBearingForecast = (vibration, thermal, electrical) => {
  if (!vibration || !thermal || !electrical) return null;

  const vib = Number(vibration?.vibration_rms ?? 0);
  const bearingTemp = Number(thermal?.bearing_temperature ?? 0);
  const power = Number(electrical?.power_consumption ?? electrical?.power_kw ?? 0);
  const misalign = Number(vibration?.misalignment_indicator ?? 0);
  const imbalance = Number(vibration?.imbalance_indicator ?? 0);

  const vibRisk = clamp(((vib - 2.5) / 3) * 100, 0, 100);
  const tempRisk = clamp(((bearingTemp - 75) / 40) * 100, 0, 100);
  const powerRisk = clamp(((power - 50) / 80) * 100, 0, 100); // relative scale
  const misalignRisk = clamp(misalign * 40, 0, 100);
  const imbalanceRisk = clamp(imbalance * 40, 0, 100);

  const risk = clamp(
    0.35 * vibRisk +
      0.25 * tempRisk +
      0.15 * powerRisk +
      0.15 * misalignRisk +
      0.10 * imbalanceRisk,
    0,
    100
  );
  const health = clamp(100 - risk, 0, 100);
  const rul_days = Math.max(3, Math.round((health / 100) * 60));

  const action =
    risk > 70
      ? 'Inspect bearings immediately; plan shutdown within 48 hours.'
      : risk > 45
      ? 'Schedule bearing inspection and lubrication within 5 days.'
      : 'Continue monitoring; verify vibration balance and lubrication route.';

  const rationale = [
    `Vib: ${vib.toFixed(2)} mm/s`,
    `Temp: ${bearingTemp.toFixed(1)}°C`,
    `Power: ${power.toFixed(1)} kW`,
    `Misalign idx: ${misalign.toFixed(2)}`,
    `Imbalance idx: ${imbalance.toFixed(2)}`
  ].join(' • ');

  const vibTrend = (vibration?.trend || []).slice(-20);
  const tempTrend = (thermal?.trend || []).slice(-20);
  const trendLength = Math.max(vibTrend.length, tempTrend.length, 8);
  const now = new Date();
  const intervalMinutes = 5;

  const trend = Array.from({ length: trendLength }).map((_, idx) => {
    const tPoint = tempTrend[idx] || tempTrend[tempTrend.length - 1] || {};
    const vPoint = vibTrend[idx] || vibTrend[vibTrend.length - 1] || {};
    const pointTemp = tPoint.bearing_temp ?? tPoint.bearing_temperature ?? bearingTemp;
    const pointVib = vPoint.vibration_rms ?? vib;
    const ts =
      tPoint.timestamp ||
      vPoint.timestamp ||
      new Date(now.getTime() - (trendLength - idx - 1) * intervalMinutes * 60 * 1000).toISOString();
    const label = new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const pointRisk = clamp(
      0.4 * clamp(((pointVib - 2.5) / 3) * 100, 0, 100) +
        0.35 * clamp(((pointTemp - 75) / 40) * 100, 0, 100) +
        0.25 * powerRisk,
      0,
      100
    );
    return {
      label,
      health: parseFloat((100 - pointRisk).toFixed(1)),
      temperature: parseFloat((pointTemp ?? bearingTemp).toFixed(1)),
      vibration: parseFloat((pointVib ?? vib).toFixed(2))
    };
  });

  return {
    health,
    risk,
    rul_days,
    action,
    rationale,
    flags: {
      overheat: bearingTemp > 80,
      high_vibration: vib > 4.0
    },
    inputs: {
      vibration_mm_s: Number(vib.toFixed ? vib.toFixed(2) : vib),
      temperature_c: Number(bearingTemp.toFixed ? bearingTemp.toFixed(1) : bearingTemp),
      power_kw: Number(power.toFixed ? power.toFixed(1) : power),
      misalignment_idx: misalign,
      imbalance_idx: imbalance
    },
    trend
  };
};

