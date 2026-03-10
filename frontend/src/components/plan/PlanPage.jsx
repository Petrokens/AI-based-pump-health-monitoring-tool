import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPlans, updateMyPlan } from '../../services/api';

/**
 * Plan page: current plan, change plan options (from DB), and pump usage.
 */
export default function PlanPage({ pumps = [] }) {
  const { user, getCurrentClient, updateClientPlan, clients } = useAuth();
  const client = getCurrentClient?.() ?? (user?.clientId && clients?.find((c) => c.id === user.clientId)) ?? null;
  const planName = client?.plan || 'Free';
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPlans()
      .then((list) => {
        if (!cancelled) setPlans(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.response?.data?.error || e.message || 'Failed to load plans');
          setPlans([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChangePlan = async (plan) => {
    if (!user?.clientId) return;
    setError(null);
    try {
      await updateMyPlan(user.clientId, { planName: plan.name });
      updateClientPlan?.(user.clientId, plan.name);
      setSelectedPlanId(plan.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to update plan');
    }
  };

  const formatPrice = (p) => {
    if (p == null || p === '') return null;
    if (typeof p === 'number') return `$${p}`;
    return String(p);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary-500" />
          Your plan
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Manage your subscription and see pump usage under this plan.
        </p>
      </div>

      {/* Current plan & change option */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Current plan</h2>
        <p className="text-[var(--text-primary)] font-medium text-lg">{planName}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Pumps in use: <strong>{pumps.length}</strong>
        </p>

        <h3 className="text-base font-semibold text-[var(--text-primary)] mt-6 mb-3">Change plan</h3>
        {error && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading plans…</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No plans available. Contact admin to add plans.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = (plan.name === planName);
              const isSelected = selectedPlanId === plan.id;
              const priceLabel = formatPrice(plan.price) ?? (plan.priceMonthly != null ? `$${plan.priceMonthly}/mo` : plan.billing || '—');
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleChangePlan(plan)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/60 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[var(--text-primary)]">{plan.name}</span>
                    {(isCurrent || isSelected) && (
                      <Check className="w-5 h-5 text-primary-500 shrink-0" />
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-[var(--text-secondary)]">{plan.description}</p>
                  )}
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 font-medium">
                    {priceLabel}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Up to {plan.pumpsLimit == null ? '—' : plan.pumpsLimit === 999 ? 'unlimited' : plan.pumpsLimit} pumps
                  </p>
                </button>
              );
            })}
          </div>
        )}
        {saved && (
          <p className="mt-3 text-sm text-primary-500 font-medium">Plan updated.</p>
        )}
      </div>

      {/* Pump-wise usage */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Pumps on this plan
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Pumps using your current plan ({planName}).
          </p>
        </div>
        <div className="overflow-x-auto">
          {pumps.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pumps added yet.</p>
              <p className="text-sm mt-1">Add pumps from Pump Setup to see them here.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]/80 text-left">
                  <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Pump name</th>
                  <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">ID</th>
                  <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Health</th>
                  <th className="px-6 py-3 font-medium text-[var(--text-secondary)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {pumps.map((pump) => {
                  const health = pump.health_index ?? 85;
                  const band =
                    health >= 80 ? 'Healthy' :
                    health >= 60 ? 'Moderate' :
                    health >= 30 ? 'Warning' : 'Critical';
                  return (
                    <tr
                      key={pump.id}
                      className="border-t border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]"
                    >
                      <td className="px-6 py-3 font-medium text-[var(--text-primary)]">
                        {pump.name || pump.id}
                      </td>
                      <td className="px-6 py-3 text-[var(--text-secondary)]">{pump.id}</td>
                      <td className="px-6 py-3">
                        <span className="text-[var(--text-primary)]">{Number(health).toFixed(0)}%</span>
                        <span className="ml-1 text-xs text-[var(--text-tertiary)]">({band})</span>
                      </td>
                      <td className="px-6 py-3 text-[var(--text-secondary)]">
                        {pump.status || 'Normal'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
