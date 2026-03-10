import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, User, Mail, Phone, Zap, Calendar, Package, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClientPumps } from '../../services/api';

export default function ClientDetail() {
  const { id } = useParams();
  const { clients } = useAuth();
  const client = clients.find((c) => c.id === id);
  const [pumps, setPumps] = useState([]);
  const [pumpsLoading, setPumpsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setPumpsLoading(true);
    fetchClientPumps(id)
      .then((list) => setPumps(Array.isArray(list) ? list : []))
      .catch(() => setPumps([]))
      .finally(() => setPumpsLoading(false));
  }, [id]);

  if (!client) {
    return (
      <div className="space-y-4">
        <Link to="/admin/clients" className="inline-flex items-center gap-2 text-primary-400 hover:underline text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <p className="text-[var(--text-tertiary)]">Client not found.</p>
      </div>
    );
  }

  const rows = [
    { label: 'Company', value: client.companyName, icon: Building2 },
    { label: 'Contact Name', value: client.name, icon: User },
    { label: 'Email', value: client.email, icon: Mail },
    { label: 'Phone', value: client.phone || '—', icon: Phone },
    { label: 'Number of Pumps', value: client.numberOfPumps ?? '—', icon: Zap },
    { label: 'Plan', value: client.plan || 'Free', icon: Zap },
    { label: 'Registered', value: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <Link to="/admin/clients" className="inline-flex items-center gap-2 text-primary-400 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Client Details</h2>
        {client.companyLogoPreview && (
          <div className="mb-6 flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Company Logo</span>
            <img src={client.companyLogoPreview} alt="Company logo" className="h-16 w-16 object-contain rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1" />
            {client.companyLogoFileName && <span className="text-xs text-[var(--text-tertiary)]">{client.companyLogoFileName}</span>}
          </div>
        )}
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]/50">
              <Icon className="w-5 h-5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</dt>
                <dd className="text-[var(--text-primary)] font-medium mt-0.5">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Usage Summary</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Pumps created: <strong className="text-[var(--text-primary)]">{pumps.length}</strong>
          {client.plan && (
            <> · Plan: <strong className="text-[var(--text-primary)]">{client.plan}</strong></>
          )}
          {client.plan === 'Free' && (
            <span className="text-xs text-[var(--text-tertiary)] ml-1">(max 2 pumps)</span>
          )}
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          Pumps ({pumps.length})
        </h3>
        {pumpsLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading pumps…</p>
        ) : pumps.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No pumps created yet.</p>
        ) : (
          <ul className="space-y-3">
            {pumps.map((p) => (
              <li
                key={p.id || p.pump_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]"
              >
                <Package className="w-4 h-4 text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{p.name || p.id || p.pump_id}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {[p.categoryLabel, p.pumpType, p.model].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
