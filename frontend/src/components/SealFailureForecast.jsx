import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ThermometerSun,
  Vibrate,
  Waves,
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
  fetchHydraulicData,
  fetchThermalData,
  fetchVibrationData
} from '../services/api';

const SealFailureForecast = ({ pumpId }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSealForecast = async () => {
      try {
        setLoading(true);
        const [hydraulic, thermal, vibration] = await Promise.all([
          fetchHydraulicData(pumpId),
          fetchThermalData(pumpId),
          fetchVibrationData(pumpId)
        ]);

        const nextForecast = buildSealForecast(hydraulic, thermal, vibration);
        setForecast(nextForecast);
      } catch (error) {
        console.error('Error loading seal forecast:', error);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };

    loadSealForecast();
    const interval = setInterval(loadSealForecast, 7000);
    return () => clearInterval(interval);
  }, [pumpId]);

  return (
    <div className="bg-slate-800/70 rounded-lg border border-slate-700 mt-4">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-primary-400" />
          <span className="text-sm font-semibold text-slate-200">A. Seal Failure Forecast</span>
        </div>
        <Cpu className="w-4 h-4 text-slate-400" />
      </div>
      <div className="border-t border-slate-700 p-4">
        {loading ? (
          <div className="text-slate-400 text-sm">Running seal model...</div>
        ) : !forecast ? (
          <div className="text-slate-400 text-sm">No seal forecast available.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ThermometerSun className="w-4 h-4 text-amber-300" />
                  <p className="text-sm font-semibold text-white">Health Score</p>
                </div>
                <Gauge className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold text-white">{forecast.health.toFixed(0)}%</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculated from temperature, flow deviation, pressure spikes, and vibration near seals.
              </p>
              <div className="flex items-center text-xs text-slate-300 gap-2">
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  Temp {forecast.inputs.temperature_c}°C
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  Flow {forecast.inputs.flow_m3h} m³/h
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  ΔP {forecast.inputs.delta_p_bar} bar
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  Vib {forecast.inputs.vibration_mm_s} mm/s
                </span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-sky-300" />
                  <p className="text-sm font-semibold text-white">Remaining Useful Life</p>
                </div>
                <Waves className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold text-white">{forecast.rul_days} d</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Horizon computed from ML-style heuristic on recent operating conditions.
              </p>
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  Risk {forecast.risk.toFixed(0)}%
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  Leak {forecast.flags.seal_leakage ? 'Yes' : 'No'}
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/70 border border-slate-700">
                  Low Flow {forecast.flags.low_flow ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Vibrate className="w-4 h-4 text-primary-300" />
                <p className="text-sm font-semibold text-white">Action</p>
              </div>
              <p className="text-base font-semibold text-white">{forecast.action}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{forecast.rationale}</p>
            </div>

            <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-primary-400" />
                  <p className="text-sm font-semibold text-white">Seal Stress Trend</p>
                </div>
                <span className="text-xs text-slate-400">Inputs: flow, ΔP, temp, vibration</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast.trend}>
                    <defs>
                      <linearGradient id="sealHealthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 110]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="health"
                      stroke="#22d3ee"
                      fill="url(#sealHealthGradient)"
                      strokeWidth={2}
                      dot={false}
                      name="Health %"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#fbbf24"
                      fill="url(#tempGradient)"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SealFailureForecast;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const buildSealForecast = (hydraulic, thermal, vibration) => {
  const flow = hydraulic?.flow ?? 0;
  const deltaP = hydraulic?.differential_pressure ?? 0;
  const temp = thermal?.bearing_temperature ?? 0;
  const vib = vibration?.vibration_rms ?? 0;

  const tempRisk = clamp(((temp - 70) / 35) * 100, 0, 100); // >70C drives risk
  const vibRisk = clamp(((vib - 2.5) / 2.5) * 100, 0, 100); // >2.5 mm/s drives risk
  const pressureRisk = clamp(((deltaP - 5) / 10) * 100, 0, 100);
  const flowRisk = hydraulic?.low_flow_detected ? 60 : flow < 10 ? 40 : 0;
  const leakRisk = hydraulic?.seal_leakage_flag ? 80 : 0;

  const risk = clamp(
    0.3 * tempRisk + 0.25 * vibRisk + 0.25 * pressureRisk + 0.1 * flowRisk + 0.1 * leakRisk,
    0,
    100
  );
  const health = clamp(100 - risk, 0, 100);
  const rul_days = Math.max(2, Math.round((health / 100) * 30));

  const action =
    risk > 70
      ? 'Inspect mechanical seal immediately and schedule outage within 2–3 days.'
      : risk > 45
      ? 'Inspect seal within 5 days; verify cooling, flush, and alignment.'
      : 'Continue monitoring; check seal flush and cooling during next walkdown.';

  const rationale = [
    `Temp: ${temp.toFixed ? temp.toFixed(1) : temp}°C`,
    `ΔP: ${deltaP.toFixed ? deltaP.toFixed(2) : deltaP} bar`,
    `Vib: ${vib.toFixed ? vib.toFixed(2) : vib} mm/s`,
    hydraulic?.low_flow_detected ? 'Low flow detected' : null,
    hydraulic?.seal_leakage_flag ? 'Pressure drop suggests leakage' : null
  ]
    .filter(Boolean)
    .join(' • ');

  const tempTrend = (thermal?.trend || []).slice(-20);
  const vibTrend = (vibration?.trend || []).slice(-20);
  const trendLength = Math.max(tempTrend.length, vibTrend.length, 8);

  const trend = Array.from({ length: trendLength }).map((_, idx) => {
    const tPoint = tempTrend[idx] || tempTrend[tempTrend.length - 1] || {};
    const vPoint = vibTrend[idx] || vibTrend[vibTrend.length - 1] || {};
    const pointTemp = tPoint.bearing_temp ?? tPoint.bearing_temperature ?? temp;
    const pointVib = vPoint.vibration_rms ?? vib;
    const pointHealth = clamp(
      100 -
        (0.35 * clamp(((pointTemp - 70) / 35) * 100, 0, 100) +
          0.35 * clamp(((pointVib - 2.5) / 2.5) * 100, 0, 100) +
          0.3 * pressureRisk),
      0,
      100
    );
    const ts = tPoint.timestamp || vPoint.timestamp || new Date().toISOString();
    const label = new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return {
      label,
      health: parseFloat(pointHealth.toFixed(1)),
      temperature: parseFloat((pointTemp ?? temp).toFixed(1)),
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
      low_flow: Boolean(hydraulic?.low_flow_detected),
      seal_leakage: Boolean(hydraulic?.seal_leakage_flag)
    },
    inputs: {
      flow_m3h: Number(flow?.toFixed ? flow.toFixed(1) : flow),
      delta_p_bar: Number(deltaP?.toFixed ? deltaP.toFixed(2) : deltaP),
      temperature_c: Number(temp?.toFixed ? temp.toFixed(1) : temp),
      vibration_mm_s: Number(vib?.toFixed ? vib.toFixed(2) : vib)
    },
    trend
  };
};









