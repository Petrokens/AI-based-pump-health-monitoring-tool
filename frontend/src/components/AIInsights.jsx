import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, CheckCircle, TrendingUp, Zap, Settings, Link } from 'lucide-react';
import { fetchPumpAnomalies, fetchPumpKPIs } from '../services/api';

const AIInsights = ({ pumpId, expanded = false }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [pumpId]);

  const loadData = async () => {
    try {
      setError(null);
      const [anomalyData, kpiData] = await Promise.all([
        fetchPumpAnomalies(pumpId),
        fetchPumpKPIs(pumpId)
      ]);
      setAnomalies(anomalyData?.anomalies || []);
      console.log('KPIs Data:', kpiData); // Debug log
      setKpis(kpiData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load AI insights');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-slate-800 rounded-xl p-6 mb-6 animate-shimmer h-64"></div>;
  }

  if (error || !kpis) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-red-500/50">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center">
          <Brain className="w-6 h-6 text-purple-500 mr-3" />
          Predictive AI Insights
        </h2>
        <p className="text-red-400">Error: {error || 'No data available'}</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-slate-600 bg-slate-700/50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <TrendingUp className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Brain className="w-6 h-6 text-purple-500 mr-3" />
          Predictive AI Insights
        </h2>
        <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
          AI Powered
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-lg text-white font-semibold mb-2">No Anomalies Detected</p>
          <p className="text-slate-400 text-center">
            The pump is operating within normal parameters. Continue routine monitoring.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anomaly, index) => (
            <div
              key={index}
              className={`border-l-4 rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(anomaly.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-white">{anomaly.type}</h3>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs uppercase">
                        {anomaly.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-3">{anomaly.message}</p>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-sm text-slate-400 mb-1">🛠️ Recommendation:</p>
                      <p className="text-sm text-white font-medium">{anomaly.recommendation}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-xs text-slate-400 mb-1">AI Confidence</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${anomaly.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {Math.round(anomaly.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Health Indices */}
      <div className="mt-6 space-y-4">
        {/* Motor Health Index */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            Motor Health Index
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Drive End (DE)</span>
                <span className={`text-lg font-bold ${
                  kpis.motor_health_de >= 80 ? 'text-green-400' :
                  kpis.motor_health_de >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {kpis.motor_health_de?.toFixed(1) || kpis.motor_health?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    kpis.motor_health_de >= 80 ? 'bg-green-500' :
                    kpis.motor_health_de >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${kpis.motor_health_de || kpis.motor_health || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Non-Drive End (NDE)</span>
                <span className={`text-lg font-bold ${
                  kpis.motor_health_nde >= 80 ? 'text-green-400' :
                  kpis.motor_health_nde >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {kpis.motor_health_nde?.toFixed(1) || kpis.motor_health?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    kpis.motor_health_nde >= 80 ? 'bg-green-500' :
                    kpis.motor_health_nde >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${kpis.motor_health_nde || kpis.motor_health || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bearing Health Index */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-red-400" />
            Bearing Health Index
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Drive End (DE)</span>
                <span className={`text-lg font-bold ${
                  kpis.bearing_health_de >= 80 ? 'text-green-400' :
                  kpis.bearing_health_de >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {kpis.bearing_health_de?.toFixed(1) || kpis.bearing_health?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    kpis.bearing_health_de >= 80 ? 'bg-green-500' :
                    kpis.bearing_health_de >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${kpis.bearing_health_de || kpis.bearing_health || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Non-Drive End (NDE)</span>
                <span className={`text-lg font-bold ${
                  kpis.bearing_health_nde >= 80 ? 'text-green-400' :
                  kpis.bearing_health_nde >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {kpis.bearing_health_nde?.toFixed(1) || kpis.bearing_health?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    kpis.bearing_health_nde >= 80 ? 'bg-green-500' :
                    kpis.bearing_health_nde >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${kpis.bearing_health_nde || kpis.bearing_health || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Coupling Health Index */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center">
            <Link className="w-4 h-4 mr-2 text-blue-400" />
            Coupling Health Index
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Non-Coupling End</span>
                <span className={`text-lg font-bold ${
                  (kpis.coupling_health_non_coupling ?? 0) >= 80 ? 'text-green-400' :
                  (kpis.coupling_health_non_coupling ?? 0) >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {kpis.coupling_health_non_coupling != null && kpis.coupling_health_non_coupling !== undefined 
                    ? `${kpis.coupling_health_non_coupling.toFixed(1)}%` 
                    : 'N/A'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    (kpis.coupling_health_non_coupling ?? 0) >= 80 ? 'bg-green-500' :
                    (kpis.coupling_health_non_coupling ?? 0) >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${kpis.coupling_health_non_coupling ?? 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Coupling End</span>
                <span className={`text-lg font-bold ${
                  (kpis.coupling_health_coupling ?? 0) >= 80 ? 'text-green-400' :
                  (kpis.coupling_health_coupling ?? 0) >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {kpis.coupling_health_coupling != null && kpis.coupling_health_coupling !== undefined 
                    ? `${kpis.coupling_health_coupling.toFixed(1)}%` 
                    : 'N/A'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    (kpis.coupling_health_coupling ?? 0) >= 80 ? 'bg-green-500' :
                    (kpis.coupling_health_coupling ?? 0) >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${kpis.coupling_health_coupling ?? 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Prediction and Maintenance */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">Failure Prediction</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Predicted RUL:</span>
              <span className="text-white font-semibold">{kpis.rul_hours} hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Health Index:</span>
              <span className="text-white font-semibold">{kpis.health_index}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-3">Maintenance Suggestion</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Action:</span>
              <span className={`font-semibold ${
                kpis.maintenance_recommendation.priority === 'critical' ? 'text-red-500' :
                kpis.maintenance_recommendation.priority === 'medium' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {kpis.maintenance_recommendation.action}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Timeline:</span>
              <span className="text-white font-semibold">{kpis.maintenance_recommendation.timeline}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;

