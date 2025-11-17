import React, { useState, useEffect } from 'react';
import { Gauge, Zap, Droplets, TrendingUp } from 'lucide-react';
import { fetchPumpRealtime, fetchHydraulicData, fetchElectricalData } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RealtimeOperatingPanel = ({ pumpId }) => {
  const [realtimeData, setRealtimeData] = useState(null);
  const [hydraulicData, setHydraulicData] = useState(null);
  const [electricalData, setElectricalData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [realtime, hydraulic, electrical] = await Promise.all([
          fetchPumpRealtime(pumpId),
          fetchHydraulicData(pumpId),
          fetchElectricalData(pumpId)
        ]);
        
        setRealtimeData(realtime);
        setHydraulicData(hydraulic);
        setElectricalData(electrical);
        
        // Build trend data
        if (electrical.trend && electrical.trend.length > 0) {
          setTrendData(electrical.trend.slice(-20).map((point, idx) => ({
            time: idx,
            flow: hydraulic.flow,
            power: point.power,
            current: point.current,
            pressure: hydraulic.discharge_pressure
          })));
        }
      } catch (error) {
        console.error('Error loading realtime data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !realtimeData || !hydraulicData || !electricalData) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading real-time data...</div>
      </div>
    );
  }

  const data = realtimeData.data;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Gauge className="w-6 h-6 mr-2 text-primary-500" />
        Real-Time Operating Parameters
      </h2>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {/* Flow */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Droplets className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-xs text-slate-400">Flow</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.flow.toFixed(1)}</p>
          <p className="text-xs text-slate-400">m³/h</p>
          <div className="mt-2 text-xs">
            <span className="text-slate-500">1-min avg: </span>
            <span className="text-slate-300">{data.flow.toFixed(1)}</span>
          </div>
        </div>

        {/* Discharge Pressure */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-xs text-slate-400">Discharge P</span>
          </div>
          <p className="text-2xl font-bold text-white">{hydraulicData.discharge_pressure.toFixed(2)}</p>
          <p className="text-xs text-slate-400">bar</p>
        </div>

        {/* Suction Pressure */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-xs text-slate-400">Suction P</span>
          </div>
          <p className="text-2xl font-bold text-white">{hydraulicData.suction_pressure.toFixed(2)}</p>
          <p className="text-xs text-slate-400">bar</p>
        </div>

        {/* Differential Pressure */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-xs text-slate-400">ΔP</span>
          </div>
          <p className="text-2xl font-bold text-white">{hydraulicData.differential_pressure.toFixed(2)}</p>
          <p className="text-xs text-slate-400">bar</p>
        </div>

        {/* RPM */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Zap className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-xs text-slate-400">RPM</span>
          </div>
          <p className="text-2xl font-bold text-white">{realtimeData.data.rpm?.toFixed(0) || '1450'}</p>
        </div>

        {/* Motor Current */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Zap className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-xs text-slate-400">Current</span>
          </div>
          <p className="text-2xl font-bold text-white">{electricalData.motor_current.toFixed(1)}</p>
          <p className="text-xs text-slate-400">A</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Voltage</span>
          <p className="text-lg font-semibold text-white">{electricalData.voltage.toFixed(0)} V</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Power Consumption</span>
          <p className="text-lg font-semibold text-white">{electricalData.power_consumption.toFixed(2)} kW</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Power Factor</span>
          <p className="text-lg font-semibold text-white">{electricalData.power_factor.toFixed(3)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Electrical Efficiency</span>
          <p className="text-lg font-semibold text-white">{electricalData.electrical_efficiency.toFixed(1)}%</p>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Trends (Last 20 readings)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Line type="monotone" dataKey="flow" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="power" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RealtimeOperatingPanel;

