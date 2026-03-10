import React from 'react';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Admin Settings</h2>
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <p className="text-[var(--text-secondary)] text-sm">
          Product admin settings (e.g. plan limits, feature flags, email templates) can be configured here when backend is ready.
        </p>
      </div>
    </div>
  );
}
