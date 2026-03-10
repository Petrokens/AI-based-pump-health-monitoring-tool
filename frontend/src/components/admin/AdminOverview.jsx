import React from 'react';
import { Users, FileText, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function AdminOverview() {
  const { clients, demoEntries } = useAuth();
  const totalClients = clients.length;
  const totalDemos = demoEntries.length;
  const pendingDemos = demoEntries.filter((e) => e.status === 'pending').length;

  const cards = [
    { label: 'Total Clients', value: totalClients, icon: Users, to: '/admin/clients', color: 'text-primary-400' },
    { label: 'Demo Entries', value: totalDemos, icon: FileText, to: '/admin/demo-entries', color: 'text-amber-400' },
    { label: 'Pending Demos', value: pendingDemos, icon: Zap, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
              <Icon className={`w-8 h-8 ${color || 'text-[var(--text-tertiary)]'}`} />
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
            {to && (
              <Link to={to} className="mt-2 text-sm text-primary-400 hover:underline inline-block">
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Demo Entries</h2>
        {demoEntries.length === 0 ? (
          <p className="text-[var(--text-tertiary)] text-sm">No demo entries yet.</p>
        ) : (
          <ul className="space-y-3">
            {demoEntries.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{e.companyName || e.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{e.email} · {e.numberOfPumps || 0} pumps</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">{e.status || 'pending'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
