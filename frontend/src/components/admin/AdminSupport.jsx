import React, { useState } from 'react';
import { HelpCircle, BookOpen, Mail, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const faqs = [
  { q: 'How do I approve a demo request?', a: 'Go to Demo Entries, find the request, and click Approve. The client will then be able to log in and access the app.' },
  { q: 'How do I change a client plan?', a: 'Open Clients, select the client, and use the plan dropdown to assign a new plan (e.g. Standard, Enterprise).' },
  { q: 'Where are payment records stored?', a: 'Payments are listed under the Payments sidebar. Connect Stripe (or another gateway) in Integrations for live processing.' },
];

const resources = [
  { label: 'Product documentation', href: '#', icon: BookOpen },
  { label: 'API reference', href: '#', icon: ExternalLink },
  { label: 'Status page', href: '#', icon: MessageCircle },
];

export default function AdminSupport() {
  const [openFaq, setOpenFaq] = useState(null);
  const [message, setMessage] = useState({ subject: '', body: '' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Support</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Help, documentation, and contact options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-500" />
            FAQ
          </h3>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border-b border-[var(--border-color)] last:border-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-4 py-4 text-left flex items-center justify-between gap-2 hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  <span className="font-medium text-[var(--text-primary)] text-sm">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[var(--text-tertiary)]" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-sm text-[var(--text-secondary)]">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Resources
          </h3>
          <div className="space-y-2">
            {resources.map((r, i) => (
              <a
                key={i}
                href={r.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-primary)]"
              >
                <r.icon className="w-5 h-5 text-primary-500 shrink-0" />
                <span className="font-medium text-sm">{r.label}</span>
                <ExternalLink className="w-4 h-4 ml-auto text-[var(--text-tertiary)] shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-primary-500" />
          Contact support
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Subject</label>
            <input
              type="text"
              value={message.subject}
              onChange={(e) => setMessage((m) => ({ ...m, subject: e.target.value }))}
              placeholder="e.g. Billing question"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Message</label>
            <textarea
              value={message.body}
              onChange={(e) => setMessage((m) => ({ ...m, body: e.target.value }))}
              placeholder="Describe your issue or question..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-y"
            />
          </div>
          <div>
            <button
              type="button"
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Send message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
