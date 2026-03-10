import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const APP_LOGO_TEXT = 'PM';

export default function AppTopbar({ title, subtitle, children }) {
  const { user, logout, clients } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const client = user?.clientId
    ? clients?.find((c) => c.id === user.clientId)
    : null;
  const companyName = client?.companyName || user?.name;
  const logoUrl = client?.companyLogoPreview;
  const displayName = user?.name || user?.email || 'User';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="flex-shrink-0 bg-[var(--bg-header)] border-b border-[var(--border-color)] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Logo: company logo or app "PM" badge */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">{APP_LOGO_TEXT}</span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: company name, profile, logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {companyName && (
            <span className="text-sm text-[var(--text-secondary)] hidden sm:inline max-w-[140px] truncate" title={companyName}>
              {companyName}
            </span>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-color)] transition-colors"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[120px]">
                    {user.email}
                  </p>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-1 py-1 w-56 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg z-20"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {displayName}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {user.email}
                    </p>
                  )}
                  {companyName && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                      {companyName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
