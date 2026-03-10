import React from 'react';
import { BarChart2, Download, FileText, Calendar } from 'lucide-react';

const recentReports = [
  { id: 'r1', name: 'Usage – March 2026', type: 'Usage', date: '2026-03-10', size: '124 KB' },
  { id: 'r2', name: 'Billing – Q1 2026', type: 'Billing', date: '2026-03-01', size: '89 KB' },
];

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reports</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Export usage, billing, and activity reports.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          <Download className="w-4 h-4" />
          Export report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-8 h-8 text-primary-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Usage report</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Client usage by pumps, API calls, and storage. Filter by date range.
          </p>
          <button className="text-sm text-primary-400 hover:underline">Generate →</button>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-8 h-8 text-primary-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Billing report</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Payments, subscriptions, and revenue summary.
          </p>
          <button className="text-sm text-primary-400 hover:underline">Generate →</button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
          <h3 className="font-semibold text-[var(--text-primary)]">Recent reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Report</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Size</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <span className="font-medium text-[var(--text-primary)]">{r.name}</span>
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{r.type}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                    {r.date}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-tertiary)]">{r.size}</td>
                  <td className="py-3 px-4">
                    <button type="button" className="text-primary-400 hover:underline text-sm">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
