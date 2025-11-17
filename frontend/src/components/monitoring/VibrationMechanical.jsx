import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchVibrationData } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const VibrationMechanical = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchVibrationData(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading vibration data:', error);
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
        <div className="animate-pulse">Loading vibration data...</div>
      </div>
    );
  }

  const getConditionColor = (value) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Prepare spectrum data for chart
  const spectrumData = data.spectrum.frequencies.map((freq, idx) => ({
    frequency: freq.toFixed(1),
    amplitude: data.spectrum.amplitudes[idx]
  })).filter((_, idx) => idx % 5 === 0); // Sample every 5th point

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Activity className="w-6 h-6 mr-2 text-primary-500" />
        Vibration & Mechanical Health
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Overall Vibration RMS</span>
          <p className="text-2xl font-bold text-white">{data.vibration_rms.toFixed(2)}</p>
          <p className="text-xs text-slate-400">{data.vibration_unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Bearing Condition</span>
          <p className={`text-2xl font-bold ${getConditionColor(data.bearing_condition_index)}`}>
            {data.bearing_condition_index.toFixed(1)}%
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Misalignment Indicator</span>
          <p className="text-2xl font-bold text-white">{data.misalignment_indicator.toFixed(3)}</p>
          {data.misalignment_indicator > 0.5 && (
            <p className="text-xs text-yellow-400 mt-1 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              High
            </p>
          )}
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Imbalance Indicator</span>
          <p className="text-2xl font-bold text-white">{data.imbalance_indicator.toFixed(3)}</p>
          {data.imbalance_indicator > 0.5 && (
            <p className="text-xs text-yellow-400 mt-1 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              High
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FFT Spectrum */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">FFT Spectrum</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={spectrumData.slice(0, 50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="frequency" 
                  stroke="#94a3b8"
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Bar dataKey="amplitude" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-slate-400">
              Shaft Frequency: {data.shaft_frequency_hz.toFixed(2)} Hz | RPM: {data.rpm.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Vibration Trend */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Vibration Trend</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="vibration_rms" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Diagnostic Information */}
      <div className="mt-6 bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Diagnostic Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Bearing Condition: </span>
            <span className={getConditionColor(data.bearing_condition_index)}>
              {data.bearing_condition_index >= 80 ? 'Good' : data.bearing_condition_index >= 60 ? 'Fair' : 'Poor'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Shaft Alignment: </span>
            <span className={data.misalignment_indicator > 0.5 ? 'text-yellow-400' : 'text-green-400'}>
              {data.misalignment_indicator > 0.5 ? 'Check Required' : 'Normal'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Rotor Balance: </span>
            <span className={data.imbalance_indicator > 0.5 ? 'text-yellow-400' : 'text-green-400'}>
              {data.imbalance_indicator > 0.5 ? 'Check Required' : 'Normal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibrationMechanical;

