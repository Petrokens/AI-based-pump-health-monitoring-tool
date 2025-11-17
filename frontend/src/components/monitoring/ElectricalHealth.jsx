import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchElectricalData } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ElectricalHealth = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchElectricalData(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading electrical data:', error);
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
        <div className="animate-pulse">Loading electrical data...</div>
      </div>
    );
  }

  const getHealthColor = (value, threshold) => {
    if (value > threshold) return 'text-red-400';
    if (value > threshold * 0.7) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Zap className="w-6 h-6 mr-2 text-primary-500" />
        Electrical Health
      </h2>

      {/* Primary Electrical Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Motor Current</span>
          <p className="text-2xl font-bold text-white">{data.motor_current.toFixed(1)}</p>
          <p className="text-xs text-slate-400">A</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Voltage</span>
          <p className="text-2xl font-bold text-white">{data.voltage.toFixed(0)}</p>
          <p className="text-xs text-slate-400">V</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Power Consumption</span>
          <p className="text-2xl font-bold text-white">{data.power_consumption.toFixed(2)}</p>
          <p className="text-xs text-slate-400">kW</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Power Factor</span>
          <p className="text-2xl font-bold text-white">{data.power_factor.toFixed(3)}</p>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Current Unbalance</span>
            {data.current_unbalance > 5 && (
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <p className={`text-2xl font-bold ${getHealthColor(data.current_unbalance, 5)}`}>
            {data.current_unbalance.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {data.current_unbalance > 5 ? 'Warning: High unbalance' : 'Normal'}
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Inrush Current Events</span>
          <p className="text-2xl font-bold text-white">{data.inrush_current_events}</p>
          <p className="text-xs text-slate-400 mt-1">Start/stop cycles</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Harmonic Distortion</span>
            {data.harmonic_distortion > 5 && (
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <p className={`text-2xl font-bold ${getHealthColor(data.harmonic_distortion, 5)}`}>
            {data.harmonic_distortion.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">THD</p>
        </div>
      </div>

      {/* Efficiency */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Electrical Efficiency</span>
            <p className="text-2xl font-bold text-green-400">{data.electrical_efficiency.toFixed(1)}%</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-400" />
        </div>
      </div>

      {/* Trend Chart */}
      {data.trend && data.trend.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Electrical Trends</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Current (A)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="power" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Power (kW)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="power_factor" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Power Factor"
                  dot={false}
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(data.current_unbalance > 5 || data.harmonic_distortion > 5) && (
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-400 font-semibold">Electrical Anomaly Detected</span>
          </div>
          <ul className="text-slate-300 text-sm list-disc list-inside space-y-1">
            {data.current_unbalance > 5 && (
              <li>Current unbalance exceeds recommended limit (5%)</li>
            )}
            {data.harmonic_distortion > 5 && (
              <li>Harmonic distortion exceeds recommended limit (5%)</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ElectricalHealth;

