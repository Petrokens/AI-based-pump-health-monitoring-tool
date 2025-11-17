import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { fetchPumpTrends, fetchTrendSignals } from '../services/api';

const TrendExplorer = ({ pumpId, expanded = false }) => {
  const [trends, setTrends] = useState([]);
  const [timeRange, setTimeRange] = useState(24);
  const [selectedParams, setSelectedParams] = useState(['flow', 'motor_current', 'bearing_temp']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, [pumpId, timeRange, selectedParams]);

  const loadTrends = async () => {
    try {
      const signalKeys = selectedParams;
      const data = await fetchTrendSignals(pumpId, signalKeys, timeRange);
      setTrends(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trends:', error);
      // Fallback to old endpoint
      try {
        const data = await fetchPumpTrends(pumpId, timeRange);
        setTrends(data);
      } catch (fallbackError) {
        console.error('Error loading trends (fallback):', fallbackError);
      } finally {
        setLoading(false);
      }
    }
  };

  const parameters = [
    { key: 'flow', label: 'Flow', color: '#22c55e', unit: 'm³/hr' },
    { key: 'discharge_pressure', label: 'Discharge Pressure', color: '#3b82f6', unit: 'bar' },
    { key: 'motor_current', label: 'Motor Current', color: '#a855f7', unit: 'A' },
    { key: 'bearing_temp', label: 'Bearing Temp', color: '#f59e0b', unit: '°C' },
    { key: 'vibration', label: 'Vibration', color: '#ef4444', unit: 'mm/s' },
  ];

  const toggleParameter = (key) => {
    if (selectedParams.includes(key)) {
      setSelectedParams(selectedParams.filter(p => p !== key));
    } else {
      setSelectedParams([...selectedParams, key]);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const exportData = () => {
    const csv = [
      ['Timestamp', ...parameters.map(p => p.label)].join(','),
      ...trends.map(row => [
        row.timestamp,
        ...parameters.map(p => row[p.key] || '')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pump_${pumpId}_trends_${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="bg-slate-800 rounded-xl p-6 mb-6 animate-shimmer h-96"></div>;
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Historical Trend Explorer</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={1}>Last 1 Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {parameters.map((param) => (
          <button
            key={param.key}
            onClick={() => toggleParameter(param.key)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedParams.includes(param.key)
                ? 'border-slate-600 bg-slate-700 text-white'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: param.color }}
              ></div>
              <span>{param.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="h-96 bg-slate-900 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Legend />
            {parameters.map((param) =>
              selectedParams.includes(param.key) ? (
                <Line
                  key={param.key}
                  yAxisId={param.key === 'bearing_temp' || param.key === 'vibration' ? 'right' : 'left'}
                  type="monotone"
                  dataKey={param.key}
                  stroke={param.color}
                  strokeWidth={2}
                  dot={false}
                  name={`${param.label} (${param.unit})`}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4">
        {parameters.filter(p => selectedParams.includes(p.key)).map((param) => {
          const values = trends.map(t => t[param.key]).filter(v => v !== undefined);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);

          return (
            <div key={param.key} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">{param.label}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg:</span>
                  <span className="text-white font-semibold">{avg.toFixed(1)} {param.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max:</span>
                  <span className="text-white">{max.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Min:</span>
                  <span className="text-white">{min.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendExplorer;

