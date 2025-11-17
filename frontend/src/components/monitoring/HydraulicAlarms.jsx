import React, { useState, useEffect } from 'react';
import { Droplets, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchHydraulicData } from '../../services/api';

const HydraulicAlarms = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchHydraulicData(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading hydraulic data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !data) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading hydraulic data...</div>
      </div>
    );
  }

  const getCavitationColor = (index) => {
    if (index < 30) return 'text-red-400';
    if (index < 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Droplets className="w-6 h-6 mr-2 text-primary-500" />
        Hydraulic & Process Alarms
      </h2>

      {/* Flow and Pressure */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Flow</span>
          <p className="text-2xl font-bold text-white">{data.flow.toFixed(2)}</p>
          <p className="text-xs text-slate-400">{data.flow_unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Discharge Pressure</span>
          <p className="text-2xl font-bold text-white">{data.discharge_pressure.toFixed(2)}</p>
          <p className="text-xs text-slate-400">{data.pressure_unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Suction Pressure</span>
          <p className="text-2xl font-bold text-white">{data.suction_pressure.toFixed(2)}</p>
          <p className="text-xs text-slate-400">{data.pressure_unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Differential Pressure</span>
          <p className="text-2xl font-bold text-white">{data.differential_pressure.toFixed(2)}</p>
          <p className="text-xs text-slate-400">{data.pressure_unit}</p>
        </div>
      </div>

      {/* Cavitation and NPSH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Cavitation Index</span>
          <p className={`text-2xl font-bold ${getCavitationColor(data.cavitation_index)}`}>
            {data.cavitation_index.toFixed(1)}%
          </p>
          {data.cavitation_index < 30 && (
            <p className="text-xs text-red-400 mt-1 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Critical
            </p>
          )}
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">NPSH Margin</span>
          <p className="text-2xl font-bold text-white">{data.npsh_margin.toFixed(2)}</p>
          <p className="text-xs text-slate-400">{data.npsh_margin_unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">NPSH Status</span>
          <p className={`text-lg font-semibold ${data.npsh_margin > 1 ? 'text-green-400' : 'text-red-400'}`}>
            {data.npsh_margin > 1 ? 'Adequate' : 'Insufficient'}
          </p>
        </div>
      </div>

      {/* Alarm Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-lg p-4 ${data.low_flow_detected ? 'bg-red-500/20 border border-red-500' : 'bg-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Low Flow</span>
            {data.low_flow_detected ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          <p className={`text-lg font-semibold ${data.low_flow_detected ? 'text-red-400' : 'text-green-400'}`}>
            {data.low_flow_detected ? 'Detected' : 'Normal'}
          </p>
        </div>

        <div className={`rounded-lg p-4 ${data.dead_head_detected ? 'bg-red-500/20 border border-red-500' : 'bg-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Dead Head</span>
            {data.dead_head_detected ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          <p className={`text-lg font-semibold ${data.dead_head_detected ? 'text-red-400' : 'text-green-400'}`}>
            {data.dead_head_detected ? 'Detected' : 'Normal'}
          </p>
        </div>

        <div className={`rounded-lg p-4 ${data.seal_leakage_flag ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Seal Leakage</span>
            {data.seal_leakage_flag ? (
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          <p className={`text-lg font-semibold ${data.seal_leakage_flag ? 'text-yellow-400' : 'text-green-400'}`}>
            {data.seal_leakage_flag ? 'Suspected' : 'Normal'}
          </p>
        </div>

        <div className={`rounded-lg p-4 ${data.gas_in_liquid ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Gas in Liquid</span>
            {data.gas_in_liquid ? (
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          <p className={`text-lg font-semibold ${data.gas_in_liquid ? 'text-yellow-400' : 'text-green-400'}`}>
            {data.gas_in_liquid ? 'Detected' : 'Normal'}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {(data.low_flow_detected || data.dead_head_detected || data.seal_leakage_flag || data.cavitation_index < 30) && (
        <div className="mt-6 bg-red-500/10 border border-red-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400 font-semibold">Hydraulic Alarms Active</span>
          </div>
          <ul className="text-slate-300 text-sm list-disc list-inside space-y-1">
            {data.low_flow_detected && (
              <li>Low flow condition detected - check system demand and valve positions</li>
            )}
            {data.dead_head_detected && (
              <li>Dead head condition - pump may be operating against closed valve</li>
            )}
            {data.seal_leakage_flag && (
              <li>Seal leakage suspected - monitor pressure differential and inspect seals</li>
            )}
            {data.cavitation_index < 30 && (
              <li>Critical cavitation risk - check NPSH availability and suction conditions</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HydraulicAlarms;

