import React, { useState, useEffect } from 'react';
import { Thermometer, AlertTriangle } from 'lucide-react';
import { fetchThermalData } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ThermalDiagnostics = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchThermalData(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading thermal data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 2000); // Update every 2 seconds for fast live reading
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !data) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading thermal data...</div>
      </div>
    );
  }

  const getTempColor = (temp) => {
    if (temp > 80) return 'text-red-400';
    if (temp > 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Thermometer className="w-6 h-6 mr-2 text-primary-500" />
        Thermal Diagnostics
        {data.hot_spot_warning && (
          <span className="ml-3 px-3 py-1 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Hot Spot Warning
          </span>
        )}
      </h2>

      {/* Temperature Readings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Thermometer className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-xs text-slate-400">Bearing Temperature</span>
          </div>
          <p className={`text-3xl font-bold ${getTempColor(data.bearing_temperature)}`}>
            {data.bearing_temperature.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">{data.unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Thermometer className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-xs text-slate-400">Motor Winding Temp</span>
          </div>
          <p className={`text-3xl font-bold ${getTempColor(data.motor_winding_temperature)}`}>
            {data.motor_winding_temperature.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">{data.unit}</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Thermometer className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-xs text-slate-400">Casing Temperature</span>
          </div>
          <p className={`text-3xl font-bold ${getTempColor(data.casing_temperature)}`}>
            {data.casing_temperature.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">{data.unit}</p>
        </div>
      </div>

      {/* Temperature Trend */}
      {data.trend && data.trend.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Temperature Trends</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#94a3b8" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bearing_temp" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Bearing"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="motor_winding_temp" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Motor Winding"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="casing_temp" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Casing"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Warnings */}
      {data.hot_spot_warning && (
        <div className="mt-6 bg-red-500/10 border border-red-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400 font-semibold">Hot Spot Detected</span>
          </div>
          <p className="text-slate-300 text-sm">
            One or more temperature readings exceed safe operating limits. 
            Immediate inspection recommended to prevent component failure.
          </p>
        </div>
      )}
    </div>
  );
};

export default ThermalDiagnostics;

