import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building2, Mail, Lock, Zap, ArrowLeft, Phone, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { registerDemoApi } from '../../services/api';

export default function DemoSignupPage() {
  const navigate = useNavigate();
  const { completeRegistrationFromBackend } = useAuth();
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    numberOfPumps: '',
    phone: '',
  });
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCompanyLogoFile(null);
      setCompanyLogoPreview('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.).');
      return;
    }
    setError('');
    setCompanyLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCompanyLogoPreview(reader.result || '');
    reader.readAsDataURL(file);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    const payload = {
      ...form,
      numberOfPumps: form.numberOfPumps ? Number(form.numberOfPumps) : 0,
      companyLogoPreview: companyLogoPreview || undefined,
      companyLogoFileName: companyLogoFile?.name,
    };
    setSubmitting(true);
    try {
      const response = await registerDemoApi(payload);
      if (response?.ok) {
        completeRegistrationFromBackend(response, payload);
        navigate('/app/select-pump');
        return;
      }
      setError(response?.error || 'Registration failed.');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed. Make sure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-lg">PM</div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Get Demo Now</h1>
              <p className="text-primary-400 text-sm font-medium">Try it free for 30 days</p>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Register with your details to start your 30-day free trial. No credit card required.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Company Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Acme Industries"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Company Logo</label>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center flex-1 min-h-[100px] border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)]/50 hover:border-primary-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  {companyLogoPreview ? (
                    <div className="p-2 w-full flex flex-col items-center">
                      <img src={companyLogoPreview} alt="Company logo preview" className="h-16 w-16 object-contain rounded-lg border border-[var(--border-color)]" />
                      <span className="text-xs text-[var(--text-tertiary)] mt-1">Click to change</span>
                    </div>
                  ) : (
                    <>
                      <Image className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
                      <span className="text-sm text-[var(--text-secondary)]">Upload logo (optional)</span>
                      <span className="text-xs text-[var(--text-tertiary)] mt-0.5">PNG, JPG, WebP</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Number of Pumps</label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="number"
                  name="numberOfPumps"
                  value={form.numberOfPumps}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  min={1}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
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
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5" /> {submitting ? 'Signing up…' : 'Get Demo Now — 30 Days Free'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
