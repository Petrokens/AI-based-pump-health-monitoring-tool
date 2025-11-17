import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { fetchReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const ReportsKPIs = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchReports(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !data) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 mr-2 text-primary-500" />
        Reports & KPIs
      </h2>

      {/* Key KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-xs text-slate-400">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{data.uptime_percentage.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Availability</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-xs text-slate-400">SLA Compliance</span>
          </div>
          <p className={`text-2xl font-bold ${data.sla_compliance >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
            {data.sla_compliance.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Target: {data.sla_target}%</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-xs text-slate-400">Interventions</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.number_of_interventions}</p>
          <p className="text-xs text-slate-400 mt-1">Maintenance events</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <DollarSign className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-xs text-slate-400">Cost Avoided</span>
          </div>
          <p className="text-2xl font-bold text-green-400">${data.cost_avoided.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Estimated savings</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Total Downtime</span>
          <p className="text-xl font-bold text-white">{data.total_downtime_hours.toFixed(1)}h</p>
          <p className="text-xs text-slate-400 mt-1">Report period</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Downtime Cost</span>
          <p className="text-xl font-bold text-red-400">${data.downtime_cost.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Estimated cost</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <span className="text-xs text-slate-400">Report Period</span>
          <p className="text-sm font-semibold text-white">
            {data.report_period.start} to {data.report_period.end}
          </p>
          <p className="text-xs text-slate-400 mt-1">Last 28 days</p>
        </div>
      </div>

      {/* Weekly Reports Chart */}
      {data.weekly_reports && data.weekly_reports.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Weekly Performance</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weekly_reports}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Bar dataKey="interventions" fill="#f59e0b" name="Interventions" />
                <Bar dataKey="downtime_hours" fill="#ef4444" name="Downtime (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Uptime Trend */}
      {data.weekly_reports && data.weekly_reports.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Uptime Trend</h3>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.weekly_reports}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="uptime_percentage" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Uptime %"
                  dot={{ fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={() => data.sla_target} 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="SLA Target"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Weekly Summary</h3>
        <div className="bg-slate-700/30 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-600/50">
              <tr>
                <th className="text-left p-3 text-xs text-slate-300">Week</th>
                <th className="text-right p-3 text-xs text-slate-300">Interventions</th>
                <th className="text-right p-3 text-xs text-slate-300">Downtime (h)</th>
                <th className="text-right p-3 text-xs text-slate-300">Uptime %</th>
              </tr>
            </thead>
            <tbody>
              {data.weekly_reports.map((week, idx) => (
                <tr key={idx} className="border-t border-slate-600">
                  <td className="p-3 text-sm text-white">{week.week}</td>
                  <td className="p-3 text-sm text-white text-right">{week.interventions}</td>
                  <td className="p-3 text-sm text-white text-right">{week.downtime_hours.toFixed(1)}</td>
                  <td className={`p-3 text-sm font-semibold text-right ${week.uptime_percentage >= data.sla_target ? 'text-green-400' : 'text-yellow-400'}`}>
                    {week.uptime_percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsKPIs;

