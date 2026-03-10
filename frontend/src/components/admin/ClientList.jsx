import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ClientList() {
  const { clients } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Client List</h2>
        <span className="text-sm text-[var(--text-secondary)]">{clients.length} clients</span>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-tertiary)]">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No clients registered yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)] w-14">Logo</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Company</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Contact</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Email</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Pumps</th>
                <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)]">Plan</th>
                <th className="w-10 py-4 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]">
                  <td className="py-4 px-4">
                    {c.companyLogoPreview ? (
                      <img src={c.companyLogoPreview} alt="" className="h-10 w-10 object-contain rounded border border-[var(--border-color)] bg-[var(--bg-secondary)]" />
                    ) : (
                      <span className="text-[var(--text-tertiary)] text-xs">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-medium text-[var(--text-primary)]">{c.companyName || '—'}</td>
                  <td className="py-4 px-4 text-[var(--text-secondary)]">{c.name || '—'}</td>
                  <td className="py-4 px-4 text-[var(--text-secondary)]">{c.email}</td>
                  <td className="py-4 px-4 text-[var(--text-secondary)]">{c.numberOfPumps ?? '—'}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-medium">
                      {c.plan || 'Demo (30 days)'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Link to={`/admin/clients/${c.id}`} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-primary-400">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
