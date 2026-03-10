import React from 'react';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const styles = {
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  const style = styles[s] || styles.pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status || 'pending'}
    </span>
  );
}

export default function DemoEntryList() {
  const { demoEntries, updateDemoEntryStatus } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Demo Entries</h2>
        <span className="text-sm text-[var(--text-secondary)]">{demoEntries.length} entries</span>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        {demoEntries.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-tertiary)]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No demo entries yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Company / Name</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Email</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Pumps</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Date</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demoEntries.map((e) => {
                const status = (e.status || 'pending').toLowerCase();
                return (
                  <tr key={e.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]">
                    <td className="py-4 px-4">
                      <p className="font-medium text-[var(--text-primary)]">{e.companyName || e.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{e.name}</p>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">{e.email}</td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">{e.numberOfPumps ?? '—'}</td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">
                      {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateDemoEntryStatus(e.id, 'approved')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            status === 'approved'
                              ? 'bg-emerald-500/30 text-emerald-400 cursor-default'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                          title="Approve demo"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {status === 'approved' ? 'Approved' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDemoEntryStatus(e.id, 'rejected')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            status === 'rejected'
                              ? 'bg-red-500/30 text-red-400 cursor-default'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                          title="Reject demo"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {status === 'rejected' ? 'Rejected' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
