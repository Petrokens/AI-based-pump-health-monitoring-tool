import React from 'react';
import { LayoutDashboard, Brain, TrendingUp, Settings, Bell, BarChart3, PlusCircle, CreditCard } from 'lucide-react';

const Sidebar = ({ selectedView, onViewChange }) => {
  const menuItems = [
    { id: 'select-pump', icon: PlusCircle, label: 'Pump Setup' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'plan', icon: CreditCard, label: 'Plan' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'insights', icon: Brain, label: 'AI Insights' },
    { id: 'trends', icon: TrendingUp, label: 'Trend Explorer' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-20 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col items-center py-6 space-y-6">
      <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
        <span className="text-white font-bold text-xl">PM</span>
      </div>

      <nav className="flex-1 flex flex-col space-y-2" aria-label="App navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all ${
              selectedView === item.id
                ? 'bg-primary-500 text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
            }`}
            title={item.label}
            aria-current={selectedView === item.id ? 'page' : undefined}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

