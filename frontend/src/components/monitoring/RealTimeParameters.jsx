import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { fetchPumpRealtime } from '../../services/api';

const RealTimeParameters = ({ pumpId }) => {
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({
    flow: [],
    discharge_pressure: [],
    motor_current: [],
    bearing_temp: [],
    vibration: [],
  });

  useEffect(() => {
    loadRealtimeData();
    const interval = setInterval(loadRealtimeData, 1000); // Update every 1 second for fast live reading
    return () => clearInterval(interval);
  }, [pumpId]);

  const loadRealtimeData = async () => {
    try {
      setError(null);
      const data = await fetchPumpRealtime(pumpId);
      if (data && data.data) {
        setRealtime(data.data);
        
        // Update history for sparklines
        setHistory(prev => ({
          flow: [...prev.flow.slice(-20), data.data.flow],
          discharge_pressure: [...prev.discharge_pressure.slice(-20), data.data.discharge_pressure],
          motor_current: [...prev.motor_current.slice(-20), data.data.motor_current],
          bearing_temp: [...prev.bearing_temp.slice(-20), data.data.bearing_temp],
          vibration: [...prev.vibration.slice(-20), data.data.vibration],
        }));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading realtime data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load realtime data');
      setLoading(false);
    }
  };

  if (loading && !realtime) {
    return <div className="bg-slate-800 rounded-xl p-6 mb-6 animate-shimmer h-48"></div>;
  }

  if (error || !realtime) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-red-500/50">
        <h2 className="text-xl font-bold text-white mb-2">Real-Time Parameters</h2>
        <p className="text-red-400">Error: {error || 'No data available'}</p>
      </div>
    );
  }

  const parameters = [
    {
      label: 'Flow Rate',
      value: realtime.flow,
      unit: 'm³/hr',
      data: history.flow,
      color: '#22c55e',
      warning: realtime.flow < 100,
    },
    {
      label: 'Discharge Pressure',
      value: realtime.discharge_pressure,
      unit: 'bar',
      data: history.discharge_pressure,
      color: '#3b82f6',
    },
    {
      label: 'Suction Pressure',
      value: realtime.suction_pressure,
      unit: 'bar',
      data: [],
      color: '#06b6d4',
    },
    {
      label: 'Motor Current',
      value: realtime.motor_current,
      unit: 'A',
      data: history.motor_current,
      color: '#a855f7',
      warning: realtime.motor_current > 50,
    },
    {
      label: 'Bearing Temperature',
      value: realtime.bearing_temp,
      unit: '°C',
      data: history.bearing_temp,
      color: '#f59e0b',
      warning: realtime.bearing_temp > 75,
    },
    {
      label: 'Vibration',
      value: realtime.vibration,
      unit: 'mm/s',
      data: history.vibration,
      color: '#ef4444',
      warning: realtime.vibration > 4.5,
    },
    {
      label: 'Displacement',
      value: realtime.displacement,
      unit: 'µm',
      data: [],
      color: '#ec4899',
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
        Real-Time Parameters
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {parameters.map((param, index) => (
          <div
            key={index}
            className={`bg-slate-900 rounded-lg p-4 border ${
              param.warning ? 'border-yellow-500 animate-pulse-slow' : 'border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-400 text-xs">{param.label}</p>
              {param.warning && (
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {param.value}
              <span className="text-sm text-slate-400 ml-1">{param.unit}</span>
            </p>
            
            {param.data.length > 0 && (
              <div className="h-12 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={param.data.map((v, i) => ({ value: v }))}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={param.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeParameters;

