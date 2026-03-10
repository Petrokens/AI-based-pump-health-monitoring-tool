import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Activity, CreditCard, ChevronRight } from 'lucide-react';

/**
 * Profile card for select-pump and client app: profile image, name, email, pump count, plan, change plan link.
 */
export default function ProfileCard({ user, client, pumpsCount = 0, className = '' }) {
  const navigate = useNavigate();
  const displayName = client?.companyName || user?.name || user?.email || 'User';
  const email = user?.email || '';
  const planName = client?.plan || 'Demo (30 days)';
  const avatarUrl = client?.companyLogoPreview;

  const handlePlanClick = () => {
    navigate('/app/plan');
  };

  return (
    <div
      className={`rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm ${className}`}
      data-testid="profile-card"
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Profile image */}
        <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-primary-500/20 border-2 border-primary-500/40 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-primary-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
            {displayName}
          </h2>
          {email && (
            <div className="flex items-center gap-1.5 mt-0.5 text-sm text-[var(--text-secondary)]">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Activity className="w-4 h-4 text-primary-500" />
              <strong className="text-[var(--text-primary)]">{pumpsCount}</strong> pump{pumpsCount !== 1 ? 's' : ''}
            </span>
            <span className="text-[var(--text-tertiary)]">•</span>
            <button
              type="button"
              onClick={handlePlanClick}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500/50 rounded"
            >
              <CreditCard className="w-4 h-4" />
              <span>Plan: {planName}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlanClick}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 border border-primary-500/30 text-sm font-medium transition-colors"
        >
          Change plan
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
