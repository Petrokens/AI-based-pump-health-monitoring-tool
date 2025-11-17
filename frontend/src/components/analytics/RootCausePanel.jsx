import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { fetchRootCause } from '../../services/api';

const RootCausePanel = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchRootCause(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading root cause data:', error);
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
        <div className="animate-pulse">Loading root cause analysis...</div>
      </div>
    );
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'high': return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      default: return 'bg-blue-500/20 border-blue-500 text-blue-400';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Search className="w-6 h-6 mr-2 text-primary-500" />
        Root Cause & Diagnostics
      </h2>

      {/* Health Summary */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Current Health Index</span>
            <p className={`text-3xl font-bold ${data.health_index >= 80 ? 'text-green-400' : data.health_index >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.health_index.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Detected Anomalies</span>
            <p className="text-3xl font-bold text-white">{data.detected_anomalies}</p>
          </div>
        </div>
      </div>

      {/* Contributing Signals */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Top Contributing Sensor Signals
        </h3>
        {data.top_contributing_signals.length > 0 ? (
          <div className="space-y-3">
            {data.top_contributing_signals.map((signal, idx) => (
              <div key={idx} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${signal.impact === 'high' ? 'bg-red-400' : signal.impact === 'medium' ? 'bg-yellow-400' : 'bg-green-400'} mr-2`}></div>
                    <span className="text-white font-semibold">{signal.signal}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${getImpactColor(signal.impact)}`}>
                      {signal.deviation > 0 ? '+' : ''}{signal.deviation.toFixed(1)}{signal.unit}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Impact: </span>
                    <span className={`font-semibold ${getImpactColor(signal.impact)} capitalize`}>
                      {signal.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-700/30 rounded-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-slate-400">No significant signal deviations detected</p>
          </div>
        )}
      </div>

      {/* Suggested Actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
          <Wrench className="w-4 h-4 mr-2" />
          Suggested Corrective Actions
        </h3>
        {data.suggested_actions.length > 0 ? (
          <div className="space-y-3">
            {data.suggested_actions.map((action, idx) => (
              <div key={idx} className={`rounded-lg p-4 border ${getPriorityColor(action.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-semibold uppercase mr-2">{action.priority}</span>
                      <span className="text-xs opacity-75">Confidence: {(action.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm font-medium">{action.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-700/30 rounded-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-slate-400">No immediate actions required</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RootCausePanel;

