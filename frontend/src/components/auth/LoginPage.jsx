import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.ok) {
      if (result.role === 'admin') {
        navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        navigate('/app/select-pump', { replace: true });
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-lg">PM</div>
            <span className="text-xl font-bold text-[var(--text-primary)]">Sign In</span>
          </div>

          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Enter your email and password to access the pump monitoring dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/demo" className="text-primary-400 hover:underline font-medium">
              Get Demo Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
