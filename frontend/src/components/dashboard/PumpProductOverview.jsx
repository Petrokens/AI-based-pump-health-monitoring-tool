/**
 * Product-style overview for a single pump: identity, key metrics strip, and quick actions.
 * Adds value to the pump dashboard with at-a-glance product info and navigation.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Building2,
  MapPin,
  Tag,
  Box,
  Brain,
  TrendingUp,
  Bell,
  BarChart3,
  Shield,
  Timer,
  Activity,
  ChevronRight,
} from 'lucide-react';

function getHealthBand(score) {
  const s = Number(score) ?? 0;
  if (s >= 80) return { label: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-500/20' };
  if (s >= 60) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/20' };
  if (s >= 40) return { label: 'Warning', color: 'text-orange-500', bg: 'bg-orange-500/20' };
  return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/20' };
}

export default function PumpProductOverview({ pump, pumpId, onOpenDigitalTwin }) {
  const navigate = useNavigate();
  const healthScore = pump?.health_index ?? 85;
  const band = getHealthBand(healthScore);
  const rulHours = pump?.rul_hours;
  const status = pump?.status || 'normal';

  const quickActions = [
    {
      id: 'digital-twin',
      label: '3D Digital Twin',
      icon: Box,
      onClick: () => (onOpenDigitalTwin ? onOpenDigitalTwin() : navigate(`/app/pump/${encodeURIComponent(pumpId)}/digital-twin`)),
    },
    { id: 'insights', label: 'AI Insights', icon: Brain, path: '/app/insights' },
    { id: 'trends', label: 'Trend Explorer', icon: TrendingUp, path: '/app/trends' },
    { id: 'alerts', label: 'Alerts', icon: Bell, path: '/app/alerts' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/app/reports' },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Product identity card */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-500">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {pump?.name || pump?.model || pumpId}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {pumpId} {pump?.model && `· ${pump.model}`}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-tertiary)]">
                {pump?.categoryLabel && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> {pump.categoryLabel}
                  </span>
                )}
                {pump?.pumpType && (
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> {pump.pumpType}
                  </span>
                )}
                {(pump?.vendor || pump?.manufacturer) && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {pump.vendor || pump.manufacturer}
                  </span>
                )}
                {(pump?.location || pump?.id) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {pump.location || 'Pump House'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics strip */}
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)]/80 px-3 py-2.5">
            <div className={`rounded-lg p-1.5 ${band.bg}`}>
              <Shield className={`h-5 w-5 ${band.color}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Health</p>
              <p className={`text-sm font-bold ${band.color}`}>{Number(healthScore).toFixed(0)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)]/80 px-3 py-2.5">
            <div className="rounded-lg p-1.5 bg-primary-500/20 text-primary-500">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">RUL</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {rulHours != null ? `${rulHours} h` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)]/80 px-3 py-2.5">
            <div className="rounded-lg p-1.5 bg-emerald-500/20 text-emerald-500">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Status</p>
              <p className="text-sm font-bold text-[var(--text-primary)] capitalize">
                {status === 'normal' ? 'Normal' : status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)]/80 px-3 py-2.5">
            <div className="rounded-lg p-1.5 bg-sky-500/20 text-sky-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Rated flow</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {pump?.rated_flow != null ? `${pump.rated_flow} m³/h` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Next step hint */}
        <div className="mt-4 rounded-xl bg-primary-500/10 border border-primary-500/20 px-4 py-2.5">
          <p className="text-sm text-[var(--text-primary)]">
            <strong>Next:</strong> Scroll down for health details, performance curves, and AI failure diagnostics.
          </p>
        </div>

        {/* Quick actions */}
        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(({ id, label, icon: Icon, onClick, path }) => (
              <button
                key={id}
                type="button"
                onClick={() => (path ? navigate(path) : onClick?.())}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:border-primary-500/40 transition-colors"
              >
                <Icon className="h-4 w-4 text-primary-500" />
                {label}
                <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
