import React, { useState } from 'react';
import { ScrollText, User, Calendar, Search } from 'lucide-react';

const sampleLog = [
  { id: 'a1', action: 'Demo approved', user: 'Master Admin', target: 'Techackode', time: '2026-03-10T15:32:00', ip: '192.168.1.1' },
  { id: 'a2', action: 'Login', user: 'Master Admin', target: '—', time: '2026-03-10T14:00:00', ip: '192.168.1.1' },
  { id: 'a3', action: 'Client plan updated', user: 'Master Admin', target: 'Petrokens Engineering', time: '2026-03-10T12:31:00', ip: '192.168.1.1' },
  { id: 'a4', action: 'Demo rejected', user: 'Master Admin', target: 'Acme Corp', time: '2026-03-09T11:00:00', ip: '192.168.1.1' },
];

export default function AdminAuditLog() {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? sampleLog.filter(
        (r) =>
          r.action.toLowerCase().includes(search.toLowerCase()) ||
          r.user.toLowerCase().includes(search.toLowerCase()) ||
          (r.target && r.target.toLowerCase().includes(search.toLowerCase()))
      )
    : sampleLog;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Audit Log</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Admin actions and system activity history.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by action, user, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
        <select className="px-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)]">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Action</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">User</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Target</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Date & time</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]">
                  <td className="py-4 px-4">
                    <span className="font-medium text-[var(--text-primary)]">{r.action}</span>
                  </td>
                  <td className="py-4 px-4 text-[var(--text-secondary)] flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                    {r.user}
                  </td>
                  <td className="py-4 px-4 text-[var(--text-secondary)]">{r.target}</td>
                  <td className="py-4 px-4 text-[var(--text-secondary)] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                    {new Date(r.time).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-[var(--text-tertiary)] text-xs">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-[var(--text-tertiary)]">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No matching audit entries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
