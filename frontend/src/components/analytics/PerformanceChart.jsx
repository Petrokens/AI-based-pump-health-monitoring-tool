import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { fetchPerformanceCurve } from '../../services/api';

const PerformanceChart = ({ pumpId }) => {
  const [curveData, setCurveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurveData();
  }, [pumpId]);

  const loadCurveData = async () => {
    try {
      const data = await fetchPerformanceCurve(pumpId);
      setCurveData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading performance curve:', error);
    }
  };

  if (loading || !curveData) {
    return <div className="bg-slate-800 rounded-xl p-6 mb-6 animate-shimmer h-96"></div>;
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Performance Deviation Analysis</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-400">Design Baseline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-400">Actual Performance</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="flow"
              type="number"
              label={{ value: 'Flow (m³/hr)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              stroke="#94a3b8"
            />
            <YAxis
              label={{ value: 'Head (m)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              stroke="#94a3b8"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
            />
            <Legend />
            <Line
              data={curveData.baseline_curve}
              type="monotone"
              dataKey="head"
              stroke="#22c55e"
              strokeWidth={3}
              name="Design Baseline"
              dot={false}
            />
            <Scatter
              data={curveData.actual_points}
              fill="#3b82f6"
              name="Actual Operating Points"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-white">Analysis:</span> The pump is currently operating{' '}
          {curveData.actual_points[0]?.head < curveData.baseline_curve[6]?.head ? (
            <span className="text-yellow-500 font-semibold">below the design curve</span>
          ) : (
            <span className="text-green-500 font-semibold">on the design curve</span>
          )}
          . Monitor for impeller wear or system changes if deviation increases.
        </p>
      </div>
    </div>
  );
};

export default PerformanceChart;

