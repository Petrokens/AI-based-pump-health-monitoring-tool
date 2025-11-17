import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchMLOutputs } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const MLOutputs = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchMLOutputs(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading ML outputs:', error);
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
        <div className="animate-pulse">Loading ML predictions...</div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  // Prepare failure mode data for pie chart
  const failureModeData = Object.entries(data.failure_mode_probabilities)
    .filter(([_, prob]) => prob > 0.01)
    .map(([mode, prob]) => ({
      name: mode.charAt(0).toUpperCase() + mode.slice(1),
      value: (prob * 100).toFixed(1)
    }));

  // Feature importance data
  const featureData = data.feature_importance.map(f => ({
    feature: f.feature,
    importance: f.importance
  }));

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Brain className="w-6 h-6 mr-2 text-primary-500" />
        Predictive Analytics / ML Outputs
      </h2>

      {/* Anomaly Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Anomaly Score</span>
          <p className={`text-3xl font-bold ${data.anomaly_score > data.anomaly_threshold ? 'text-red-400' : 'text-green-400'}`}>
            {data.anomaly_score.toFixed(3)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Threshold: {data.anomaly_threshold}
            {data.is_anomaly && (
              <span className="ml-2 text-red-400 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Anomaly Detected
              </span>
            )}
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Health Index</span>
          <p className={`text-3xl font-bold ${data.health_index >= 80 ? 'text-green-400' : data.health_index >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.health_index.toFixed(1)}%
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">ML Confidence</span>
          <p className="text-3xl font-bold text-white">
            {((1 - data.anomaly_score) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Failure Mode Probabilities */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Failure Mode Probabilities</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            {failureModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={failureModeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {failureModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-8">No failure modes predicted</p>
            )}
          </div>
        </div>

        {/* Feature Importance */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Feature Importance (SHAP-like)</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Bar dataKey="importance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RUL Distribution */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          RUL Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
            <span className="text-xs text-slate-400">Best Case</span>
            <p className="text-2xl font-bold text-green-400">{data.rul_distribution.best_case_hours}h</p>
            <p className="text-xs text-slate-400 mt-1">
              ({Math.floor(data.rul_distribution.best_case_hours / 24)} days)
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <span className="text-xs text-slate-400">Median</span>
            <p className="text-2xl font-bold text-blue-400">{data.rul_distribution.median_hours}h</p>
            <p className="text-xs text-slate-400 mt-1">
              ({Math.floor(data.rul_distribution.median_hours / 24)} days)
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <span className="text-xs text-slate-400">Worst Case</span>
            <p className="text-2xl font-bold text-red-400">{data.rul_distribution.worst_case_hours}h</p>
            <p className="text-xs text-slate-400 mt-1">
              ({Math.floor(data.rul_distribution.worst_case_hours / 24)} days)
            </p>
          </div>
        </div>
      </div>

      {/* Failure Mode Details */}
      <div className="mt-6 bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Failure Mode Probabilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data.failure_mode_probabilities)
            .filter(([_, prob]) => prob > 0.01)
            .map(([mode, prob]) => (
              <div key={mode} className="bg-slate-600/50 rounded-lg p-3">
                <span className="text-xs text-slate-400 capitalize">{mode.replace('_', ' ')}</span>
                <p className="text-xl font-bold text-white mt-1">{(prob * 100).toFixed(1)}%</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MLOutputs;

