import React from 'react';

export default function AdminPlans() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plans</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Configure subscription plans, limits, and pricing for clients.
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Plan catalog</h3>
          <button className="px-3 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
            New plan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border-color)]">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Max pumps</th>
                <th className="py-2 pr-4 font-medium">Billing</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              <tr className="border-b border-[var(--border-color)]/60">
                <td className="py-3 pr-4">Demo (30 days)</td>
                <td className="py-3 pr-4">Up to 5</td>
                <td className="py-3 pr-4">Free trial</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="border-b border-[var(--border-color)]/60">
                <td className="py-3 pr-4">Standard</td>
                <td className="py-3 pr-4">Up to 50</td>
                <td className="py-3 pr-4">Monthly</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    Active
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Enterprise</td>
                <td className="py-3 pr-4">Unlimited</td>
                <td className="py-3 pr-4">Custom</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                    Draft
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

