import React, { useState, useEffect } from 'react';
import { Activity, Clock, Wrench, Calendar, MapPin, Package } from 'lucide-react';
import { fetchPumpOverview } from '../services/api';

const PumpOverview = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchPumpOverview(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading pump overview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !data) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading overview...</div>
      </div>
    );
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'bg-green-500';
      case 'Warning': return 'bg-yellow-500';
      case 'Standby': return 'bg-blue-500';
      case 'Fault': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Activity className="w-6 h-6 mr-2 text-primary-500" />
        Pump Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Plant/Site Info */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MapPin className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Location</span>
          </div>
          <p className="text-white font-semibold">{data.location}</p>
          <p className="text-xs text-slate-400 mt-1">{data.plant} - {data.site}</p>
        </div>

        {/* Model */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Package className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Model</span>
          </div>
          <p className="text-white font-semibold">{data.model}</p>
          <p className="text-xs text-slate-400 mt-1">Pump ID: {data.pump_id}</p>
        </div>

        {/* Health Score */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Activity className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Health Score</span>
          </div>
          <p className={`text-2xl font-bold ${getHealthColor(data.health_score)}`}>
            {data.health_score.toFixed(1)}%
          </p>
        </div>

        {/* Operational Status */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(data.operational_status)} mr-2`}></div>
            <span className="text-sm text-slate-400">Status</span>
          </div>
          <p className="text-white font-semibold">{data.operational_status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RUL */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Remaining Useful Life</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.rul_hours}h</p>
          <p className="text-xs text-slate-400 mt-1">({data.rul_days} days)</p>
        </div>

        {/* Last Maintenance */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Last Maintenance</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          {data.last_maintenance ? (
            <>
              <p className="text-white font-semibold">{data.last_maintenance.date}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data.last_maintenance.action} - {data.last_maintenance.component}
              </p>
            </>
          ) : (
            <p className="text-slate-400 text-sm">No maintenance recorded</p>
          )}
        </div>

        {/* Next Maintenance */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Next Planned</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-white font-semibold">{data.next_maintenance}</p>
          <p className="text-xs text-slate-400 mt-1">Scheduled maintenance</p>
        </div>
      </div>
    </div>
  );
};

export default PumpOverview;

