import React, { useState, useEffect } from 'react';
import { Wrench, Clock, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMaintenanceMetrics, fetchPumpKPIs } from '../services/api';

const MaintenanceHistory = ({ pumpId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchMaintenanceMetrics(pumpId);
        setMetrics(result);
      } catch (error) {
        console.error('Error loading maintenance metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !metrics) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading maintenance data...</div>
      </div>
    );
  }

  const getSparePartStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'text-green-400';
      case 'low_stock': return 'text-yellow-400';
      case 'out_of_stock': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Wrench className="w-6 h-6 mr-2 text-primary-500" />
        Maintenance & History
      </h2>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs text-slate-400">MTBF</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics.mtbf_hours ? `${metrics.mtbf_days.toFixed(1)} days` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {metrics.mtbf_hours ? `(${metrics.mtbf_hours.toFixed(0)} hours)` : 'Insufficient data'}
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingDown className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs text-slate-400">MTTR</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics.mttr_hours ? `${metrics.mttr_hours.toFixed(1)}h` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Mean Time To Repair</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs text-slate-400">Total Failures</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.total_failures}</p>
          <p className="text-xs text-slate-400 mt-1">Recorded failures</p>
        </div>
      </div>

      {/* Failure Modes */}
      {Object.keys(metrics.failure_modes).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Failure Modes History</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics.failure_modes).map(([mode, count]) => (
                <div key={mode} className="bg-slate-600/50 rounded-lg p-3">
                  <span className="text-xs text-slate-400 capitalize">{mode.replace('_', ' ')}</span>
                  <p className="text-xl font-bold text-white mt-1">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spare Parts */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
          <Package className="w-4 h-4 mr-2" />
          Spare Parts Inventory
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.spare_parts).map(([part, info]) => (
            <div key={part} className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 capitalize">{part}</span>
                <span className={`text-xs font-semibold ${getSparePartStatusColor(info.status)}`}>
                  {info.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-lg font-bold text-white">Qty: {info.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Maintenance History</h3>
        <div className="bg-slate-700/30 rounded-lg p-4 max-h-96 overflow-y-auto">
          {metrics.maintenance_history.length > 0 ? (
            <div className="space-y-3">
              {metrics.maintenance_history.map((entry, idx) => (
                <div key={idx} className="bg-slate-600/50 rounded-lg p-4 border-l-4 border-primary-500">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">{entry.action} - {entry.component}</p>
                      <p className="text-xs text-slate-400 mt-1">{entry.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">{entry.downtime_hours.toFixed(1)}h</p>
                      <p className="text-xs text-slate-400">downtime</p>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-slate-300 mt-2">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No maintenance history available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceHistory;

