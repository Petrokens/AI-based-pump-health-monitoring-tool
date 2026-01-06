import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { fetchAlerts } from '../services/api';

const AlertsWorkflow = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchAlerts(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [pumpId]);

  const handleAcknowledge = (alertId) => {
    setAcknowledged(new Set([...acknowledged, alertId]));
  };

  if (loading || !data) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)]">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading alerts...</div>
      </div>
    );
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500';
      default: return 'bg-blue-500/20 border-blue-500';
    }
  };

  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical' && !acknowledged.has(a.id));
  const warningAlerts = data.alerts.filter(a => a.severity === 'warning' && !acknowledged.has(a.id));
  const infoAlerts = data.alerts.filter(a => a.severity !== 'critical' && a.severity !== 'warning' && !acknowledged.has(a.id));

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center">
          <Bell className="w-6 h-6 mr-2 text-primary-500" />
          Alerts & Workflows
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">Total Alerts</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{data.total_alerts}</p>
          </div>
          {data.critical_count > 0 && (
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)]">Critical</p>
              <p className="text-2xl font-bold text-red-400">{data.critical_count}</p>
            </div>
          )}
          {data.warning_count > 0 && (
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)]">Warnings</p>
              <p className="text-2xl font-bold text-yellow-400">{data.warning_count}</p>
            </div>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-red-400 mb-3">Critical Alerts</h3>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className={`rounded-lg p-4 border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getSeverityIcon(alert.severity)}
                      <h4 className="text-[var(--text-primary)] font-semibold ml-2">{alert.title}</h4>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm mb-3">{alert.message}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[var(--text-secondary)]">Responsible: </span>
                        <span className="text-[var(--text-primary)]">{alert.responsible}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Downtime: </span>
                        <span className="text-[var(--text-primary)]">{alert.estimated_downtime_hours}h</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Cost: </span>
                        <span className="text-[var(--text-primary)]">${alert.estimated_cost.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Time: </span>
                        <span className="text-[var(--text-primary)]">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-[var(--bg-secondary)]/50 rounded-lg">
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Recommended Action:</p>
                      <p className="text-sm text-[var(--text-primary)]">{alert.recommended_action}</p>
                    </div>
                  </div>
                  {!acknowledged.has(alert.id) && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="ml-4 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">Warnings</h3>
          <div className="space-y-3">
            {warningAlerts.map((alert) => (
              <div key={alert.id} className={`rounded-lg p-4 border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getSeverityIcon(alert.severity)}
                      <h4 className="text-[var(--text-primary)] font-semibold ml-2">{alert.title}</h4>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm mb-2">{alert.message}</p>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {alert.responsible} • {new Date(alert.timestamp).toLocaleString()}
                    </div>
                    <div className="mt-2 p-2 bg-[var(--bg-secondary)]/50 rounded">
                      <p className="text-xs text-[var(--text-secondary)]">Action: {alert.recommended_action}</p>
                    </div>
                  </div>
                  {!acknowledged.has(alert.id) && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="ml-4 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 mb-3">Informational</h3>
          <div className="space-y-2">
            {infoAlerts.map((alert) => (
              <div key={alert.id} className={`rounded-lg p-3 border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getSeverityIcon(alert.severity)}
                    <div className="ml-2">
                      <p className="text-[var(--text-primary)] text-sm font-medium">{alert.title}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{alert.message}</p>
                    </div>
                  </div>
                  {!acknowledged.has(alert.id) && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="ml-4 px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] rounded text-xs transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.alerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No active alerts</p>
        </div>
      )}
    </div>
  );
};

export default AlertsWorkflow;

