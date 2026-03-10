import React from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminTopbar({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-[var(--bg-header)] border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">{title || 'Admin'}</h1>
        {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)]" title="Notifications">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-[var(--border-color)]">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name || 'Admin'}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
