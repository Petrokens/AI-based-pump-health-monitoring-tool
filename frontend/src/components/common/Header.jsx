import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ selectedPump, onPumpChange, pumps, lastUpdate, currentPumpStatus }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, clients } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const client = user?.clientId ? clients?.find((c) => c.id === user.clientId) : null;
  const companyName = client?.companyName || user?.name;
  const displayName = user?.name || user?.email || 'User';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/');
  };
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

          {companyName && (
            <span className="text-sm text-[var(--text-secondary)] max-w-[120px] truncate" title={companyName}>
              {companyName}
            </span>
          )}

          <div className="relative pl-4 border-l border-[var(--border-light)]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg-card-hover)]"
              aria-expanded={profileOpen}
            >
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                <User className="w-4 h-4 text-primary-400" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[100px]">{displayName}</p>
                {user?.email && <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[100px]">{user.email}</p>}
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 w-52 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg z-20">
                <div className="px-4 py-3 border-b border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
                  {user?.email && <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>}
                  {companyName && <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{companyName}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

