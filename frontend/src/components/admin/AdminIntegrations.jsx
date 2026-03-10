import React, { useState } from 'react';
import { Plug, CreditCard, Mail, BarChart3, CheckCircle2, XCircle } from 'lucide-react';

const integrations = [
  { id: 'stripe', name: 'Stripe', desc: 'Payment processing', icon: CreditCard, connected: true, config: 'Live mode' },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Transactional email', icon: Mail, connected: true, config: 'Verified' },
  { id: 'analytics', name: 'Analytics', desc: 'Usage and events', icon: BarChart3, connected: false, config: null },
];

export default function AdminIntegrations() {
  const [connecting, setConnecting] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Connect payment, email, and analytics services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((int) => {
          const Icon = int.icon;
          const isConnected = int.connected;
          return (
            <div
              key={int.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-500" />
                </div>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                    <XCircle className="w-3.5 h-3.5" />
                    Not connected
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">{int.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5 mb-4">{int.desc}</p>
              {int.config && (
                <p className="text-xs text-[var(--text-tertiary)] mb-4">{int.config}</p>
              )}
              <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
                {isConnected ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      Configure
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConnecting(int.id)}
                    disabled={connecting === int.id}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {connecting === int.id ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Plug className="w-6 h-6 text-primary-500" />
          <h3 className="font-semibold text-[var(--text-primary)]">Add integration</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          More integrations (webhooks, CRM, SSO) can be added when the backend supports them.
        </p>
      </div>
    </div>
  );
}
