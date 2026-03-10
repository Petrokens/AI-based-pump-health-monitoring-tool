import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Filter } from 'lucide-react';

const sampleNotifications = [
  { id: 'n1', type: 'demo', title: 'New demo signup', body: 'Techackode requested a demo. Review in Demo Entries.', time: '2 hours ago', read: false },
  { id: 'n2', type: 'payment', title: 'Payment received', body: 'Petrokens Engineering – $1,999 for Enterprise plan.', time: '5 hours ago', read: true },
  { id: 'n3', type: 'system', title: 'System backup complete', body: 'Nightly backup finished successfully.', time: '1 day ago', read: true },
];

const preferenceOptions = [
  { key: 'demo_signup', label: 'New demo signups', desc: 'Email when a new demo is submitted', icon: MessageSquare },
  { key: 'payment', label: 'Payments', desc: 'Payment received and failed payment alerts', icon: Bell },
  { key: 'system', label: 'System alerts', desc: 'Backups, errors, and maintenance', icon: Mail },
];

export default function AdminNotifications() {
  const [filter, setFilter] = useState('all'); // all | unread
  const [prefs, setPrefs] = useState({ demo_signup: true, payment: true, system: true });

  const list = filter === 'unread' ? sampleNotifications.filter((n) => !n.read) : sampleNotifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            System alerts and admin notification preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)]"
          >
            <option value="all">All</option>
            <option value="unread">Unread only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
              <h3 className="font-semibold text-[var(--text-primary)]">Recent notifications</h3>
            </div>
            <ul className="divide-y divide-[var(--border-color)]">
              {list.length === 0 ? (
                <li className="p-8 text-center text-[var(--text-tertiary)] text-sm">No notifications.</li>
              ) : (
                list.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-4 hover:bg-[var(--bg-card-hover)] transition-colors ${!n.read ? 'bg-primary-500/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--text-primary)]">{n.title}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{n.body}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">{n.time}</p>
                      </div>
                      {!n.read && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-primary-500" title="Unread" />
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
              <h3 className="font-semibold text-[var(--text-primary)]">Preferences</h3>
            </div>
            <div className="p-4 space-y-4">
              {preferenceOptions.map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)] text-sm">{label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!prefs[key]}
                        onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                        className="rounded border-[var(--border-color)] text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">Email me</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
