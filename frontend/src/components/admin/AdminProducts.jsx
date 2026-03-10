import React from 'react';

const products = [
  {
    id: 'prod_pump_ai',
    name: 'Pump AI PdM Suite',
    category: 'Software',
    status: 'active',
  },
  {
    id: 'prod_edge_gateway',
    name: 'Edge Gateway',
    category: 'Hardware',
    status: 'planned',
  },
];

export default function AdminProducts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Product Management</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage products and modules available in the platform.
          </p>
        </div>
        <button className="px-3 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          New product
        </button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border-color)]">
                <th className="py-2 pr-4 font-medium">Product ID</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-color)]/60 last:border-0">
                  <td className="py-3 pr-4">{p.id}</td>
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4">{p.category}</td>
                  <td className="py-3 pr-4">
                    {p.status === 'active' ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                        Planned
                      </span>
                    )}
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

