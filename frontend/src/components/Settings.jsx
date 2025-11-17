import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Clock, 
  Monitor, 
  Database, 
  Download, 
  Save,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Zap,
  Mail,
  Volume2
} from 'lucide-react';

const Settings = () => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState({
    // Alert Settings
    alertThresholds: {
      healthIndexCritical: 50,
      healthIndexWarning: 70,
      rulCriticalHours: 72,
      rulWarningHours: 168,
      vibrationCritical: 4.5,
      vibrationWarning: 3.0,
      temperatureCritical: 80,
      temperatureWarning: 70,
    },
    // Update Intervals
    updateIntervals: {
      dashboard: 10,
      realtime: 5,
      trends: 30,
      alerts: 15,
    },
    // Display Preferences
    display: {
      theme: 'dark',
      showSparklines: true,
      showTooltips: true,
      chartAnimation: true,
      compactMode: false,
    },
    // Notification Settings
    notifications: {
      emailEnabled: false,
      emailAddress: '',
      soundEnabled: true,
      criticalOnly: false,
      pushEnabled: false,
    },
    // Data Settings
    data: {
      retentionDays: 90,
      exportFormat: 'csv',
      autoExport: false,
      maxDataPoints: 1000,
    },
    // API Settings
    api: {
      baseUrl: 'https://ai-based-pump-health-monitoring-tool.onrender.com/api',
      timeout: 10000,
      retryAttempts: 3,
    }
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pumpMonitoringSettings');
    if (savedSettings) {
      try {
        const loaded = JSON.parse(savedSettings);
        setSettings(loaded);
        // Apply theme on load
        if (loaded.display?.theme) {
          applyTheme(loaded.display.theme);
        } else {
          applyTheme('dark');
        }
      } catch (e) {
        console.error('Error loading settings:', e);
        applyTheme('dark');
      }
    } else {
      // Apply default theme
      applyTheme('dark');
    }

    // Listen for system theme changes when auto mode is selected
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      const savedSettings = localStorage.getItem('pumpMonitoringSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.display?.theme === 'auto') {
            applyTheme('auto');
          }
        } catch (e) {
          // Ignore errors
        }
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const handleSave = () => {
    localStorage.setItem('pumpMonitoringSettings', JSON.stringify(settings));
    // Apply theme immediately
    applyTheme(settings.display.theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    
    if (theme === 'light') {
      root.classList.add('light');
      // For light theme, we'll use a different approach since components use dark classes
      // We can add a data attribute to signal light mode
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      // Auto - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      localStorage.removeItem('pumpMonitoringSettings');
      window.location.reload();
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'alerts', label: 'Alert Thresholds', icon: Bell },
    { id: 'intervals', label: 'Update Intervals', icon: Clock },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Mail },
    { id: 'data', label: 'Data & Export', icon: Database },
    { id: 'api', label: 'API Settings', icon: Zap },
  ];

  return (
    <div className="bg-slate-900 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-primary-500" />
            Settings
          </h1>
          <p className="text-slate-400">
            Configure alert thresholds, update intervals, display preferences, and more
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6">
          <div className="flex border-b border-slate-700 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400 bg-slate-700/50'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Alert Thresholds */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                    Health Index Thresholds
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Critical Threshold (%)</label>
                      <input
                        type="number"
                        value={settings.alertThresholds.healthIndexCritical}
                        onChange={(e) => updateSetting('alertThresholds', 'healthIndexCritical', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-slate-500 mt-1">Alerts when health index falls below this value</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Warning Threshold (%)</label>
                      <input
                        type="number"
                        value={settings.alertThresholds.healthIndexWarning}
                        onChange={(e) => updateSetting('alertThresholds', 'healthIndexWarning', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-slate-500 mt-1">Warnings when health index falls below this value</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    RUL Thresholds
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Critical RUL (hours)</label>
                      <input
                        type="number"
                        value={settings.alertThresholds.rulCriticalHours}
                        onChange={(e) => updateSetting('alertThresholds', 'rulCriticalHours', parseInt(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Warning RUL (hours)</label>
                      <input
                        type="number"
                        value={settings.alertThresholds.rulWarningHours}
                        onChange={(e) => updateSetting('alertThresholds', 'rulWarningHours', parseInt(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-red-400" />
                    Sensor Thresholds
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Vibration Critical (mm/s)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.alertThresholds.vibrationCritical}
                        onChange={(e) => updateSetting('alertThresholds', 'vibrationCritical', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Vibration Warning (mm/s)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.alertThresholds.vibrationWarning}
                        onChange={(e) => updateSetting('alertThresholds', 'vibrationWarning', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Temperature Critical (°C)</label>
                      <input
                        type="number"
                        value={settings.alertThresholds.temperatureCritical}
                        onChange={(e) => updateSetting('alertThresholds', 'temperatureCritical', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Temperature Warning (°C)</label>
                      <input
                        type="number"
                        value={settings.alertThresholds.temperatureWarning}
                        onChange={(e) => updateSetting('alertThresholds', 'temperatureWarning', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Update Intervals */}
            {activeTab === 'intervals' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Data Refresh Intervals (seconds)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.updateIntervals).map(([key, value]) => (
                      <div key={key} className="bg-slate-700/50 rounded-lg p-4">
                        <label className="text-sm text-slate-400 mb-2 block capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => updateSetting('updateIntervals', key, parseInt(e.target.value))}
                          className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          min="1"
                        />
                        <p className="text-xs text-slate-500 mt-1">Update every {value} seconds</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Display Preferences */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Display Options</h3>
                  <div className="space-y-4">
                    {Object.entries(settings.display).map(([key, value]) => (
                      <div key={key} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-white block capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-xs text-slate-400 mt-1">
                            {key === 'theme' ? 'Color scheme for the dashboard' :
                             key === 'showSparklines' ? 'Show mini trend lines in parameter cards' :
                             key === 'showTooltips' ? 'Show helpful tooltips on hover' :
                             key === 'chartAnimation' ? 'Animate chart transitions' :
                             'Use compact layout for smaller screens'}
                          </p>
                        </div>
                        {typeof value === 'boolean' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => updateSetting('display', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                         ) : (
                           <select
                             value={value}
                             onChange={(e) => {
                               updateSetting('display', key, e.target.value);
                               // Apply theme immediately when changed
                               if (key === 'theme') {
                                 applyTheme(e.target.value);
                               }
                             }}
                             className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                           >
                             <option value="dark">Dark</option>
                             <option value="light">Light</option>
                             <option value="auto">Auto</option>
                           </select>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-400" />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white block">Enable Email Notifications</label>
                        <p className="text-xs text-slate-400 mt-1">Receive alerts via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailEnabled}
                          onChange={(e) => updateSetting('notifications', 'emailEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    {settings.notifications.emailEnabled && (
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <label className="text-sm text-slate-400 mb-2 block">Email Address</label>
                        <input
                          type="email"
                          value={settings.notifications.emailAddress}
                          onChange={(e) => updateSetting('notifications', 'emailAddress', e.target.value)}
                          className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Volume2 className="w-5 h-5 mr-2 text-green-400" />
                    Sound & Push Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white block">Enable Sound Alerts</label>
                        <p className="text-xs text-slate-400 mt-1">Play sound for critical alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.soundEnabled}
                          onChange={(e) => updateSetting('notifications', 'soundEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white block">Critical Alerts Only</label>
                        <p className="text-xs text-slate-400 mt-1">Only notify for critical issues</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.criticalOnly}
                          onChange={(e) => updateSetting('notifications', 'criticalOnly', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Export */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-purple-400" />
                    Data Retention
                  </h3>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <label className="text-sm text-slate-400 mb-2 block">Retention Period (days)</label>
                    <input
                      type="number"
                      value={settings.data.retentionDays}
                      onChange={(e) => updateSetting('data', 'retentionDays', parseInt(e.target.value))}
                      className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="1"
                      max="365"
                    />
                    <p className="text-xs text-slate-500 mt-1">Keep data for {settings.data.retentionDays} days</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-green-400" />
                    Export Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Export Format</label>
                      <select
                        value={settings.data.exportFormat}
                        onChange={(e) => updateSetting('data', 'exportFormat', e.target.value)}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="excel">Excel</option>
                      </select>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white block">Auto Export</label>
                        <p className="text-xs text-slate-400 mt-1">Automatically export data daily</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.data.autoExport}
                          onChange={(e) => updateSetting('data', 'autoExport', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Max Data Points per Chart</label>
                      <input
                        type="number"
                        value={settings.data.maxDataPoints}
                        onChange={(e) => updateSetting('data', 'maxDataPoints', parseInt(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="100"
                        max="10000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                    API Configuration
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Base URL</label>
                      <input
                        type="text"
                        value={settings.api.baseUrl}
                        onChange={(e) => updateSetting('api', 'baseUrl', e.target.value)}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://ai-based-pump-health-monitoring-tool.onrender.com/api"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Timeout (ms)</label>
                      <input
                        type="number"
                        value={settings.api.timeout}
                        onChange={(e) => updateSetting('api', 'timeout', parseInt(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="1000"
                        max="60000"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <label className="text-sm text-slate-400 mb-2 block">Retry Attempts</label>
                      <input
                        type="number"
                        value={settings.api.retryAttempts}
                        onChange={(e) => updateSetting('api', 'retryAttempts', parseInt(e.target.value))}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        max="10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-slate-800 rounded-xl p-6 border border-slate-700">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          <div className="flex items-center space-x-4">
            {saved && (
              <span className="text-green-400 text-sm flex items-center">
                <Save className="w-4 h-4 mr-1" />
                Settings saved!
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

