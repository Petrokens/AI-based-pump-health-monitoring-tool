import React from 'react';

const payments = [
  {
    id: 'pay_001',
    client: 'Techackode',
    email: 'ranjithkumar@petrokens.com',
    amount: '$499',
    plan: 'Standard',
    status: 'pending',
    date: '2026-03-10, 15:32',
  },
  {
    id: 'pay_002',
    client: 'Petrokens Engineering and Services Pvt Ltd',
    email: 'murali@petrokens.com',
    amount: '$1,999',
    plan: 'Enterprise',
    status: 'paid',
    date: '2026-03-10, 12:31',
  },
];

export default function AdminPayments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Payments</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Review payment status for client subscriptions.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors">
            Filter: All
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border-color)]">
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-color)]/60 last:border-0">
                  <td className="py-3 pr-4">{p.client}</td>
                  <td className="py-3 pr-4">{p.email}</td>
                  <td className="py-3 pr-4">{p.plan}</td>
                  <td className="py-3 pr-4">{p.amount}</td>
                  <td className="py-3 pr-4">
                    {p.status === 'paid' ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

