import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Settings,
  CreditCard,
  Package,
  Layers,
  BarChart2,
  Bell,
  ScrollText,
  Plug,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/demo-entries', icon: FileText, label: 'Demo Entries' },
  { to: '/admin/plans', icon: Layers, label: 'Plans' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/audit-log', icon: ScrollText, label: 'Audit Log' },
  { to: '/admin/integrations', icon: Plug, label: 'Integrations' },
  { to: '/admin/support', icon: HelpCircle, label: 'Support' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col min-h-screen">
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">
            PM
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">Master Admin</p>
            <p className="text-xs text-[var(--text-tertiary)]">Product Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border-color)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
