import React from 'react';
import { Activity, Clock, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ selectedPump, onPumpChange, pumps, lastUpdate, currentPumpStatus }) => {
  const { theme, toggleTheme } = useTheme();
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500 animate-pulse-slow';
      case 'critical': return 'bg-red-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'normal': return 'Normal Operation';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  const formatTime = (date) => {
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <header className="bg-[var(--bg-header)] border-b border-[var(--border-color)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Petrokens Pump Predictive Maintenance</h1>
              <p className="text-sm text-[var(--text-secondary)]">Cooling Water Pump House - Unit 1</p>
            </div>
          </div>

          <div className="border-l border-[var(--border-light)] pl-6">
            <label className="text-sm text-[var(--text-secondary)] block mb-1">Pump ID</label>
            <select
              value={selectedPump}
              onChange={(e) => onPumpChange(e.target.value)}
              className="bg-[var(--bg-input)] text-[var(--text-primary)] px-4 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!pumps || pumps.length === 0}
            >
              {pumps && pumps.length > 0 ? (
                pumps.map((pump) => (
                  <option key={pump.id} value={pump.id}>
                    {pump.id} - {pump.name}
                  </option>
                ))
              ) : (
                <option value="">No pumps available</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[var(--text-primary)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--text-primary)]" />
            )}
          </button>

          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(currentPumpStatus)}`}></div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Alert Status</p>
              <p className="text-[var(--text-primary)] font-semibold">{getStatusText(currentPumpStatus)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
            <Clock className="w-4 h-4" />
            <div>
              <p className="text-xs">Last Update</p>
              <p className="text-sm font-medium">{formatTime(lastUpdate)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

