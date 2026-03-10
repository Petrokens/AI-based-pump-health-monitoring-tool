import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import ErrorBoundary from '../common/ErrorBoundary';

const titles = {
  '/admin': { title: 'Overview', subtitle: 'Master admin dashboard' },
  '/admin/clients': { title: 'Clients', subtitle: 'Client list and plans' },
  '/admin/demo-entries': { title: 'Demo Entries', subtitle: 'Demo signup requests' },
  '/admin/plans': { title: 'Plans', subtitle: 'Subscription plans & limits' },
  '/admin/payments': { title: 'Payments', subtitle: 'Subscription payments status' },
  '/admin/products': { title: 'Products', subtitle: 'Product & module catalog' },
  '/admin/reports': { title: 'Reports', subtitle: 'Usage & billing reports' },
  '/admin/notifications': { title: 'Notifications', subtitle: 'Alerts & preferences' },
  '/admin/audit-log': { title: 'Audit Log', subtitle: 'Activity history' },
  '/admin/integrations': { title: 'Integrations', subtitle: 'Connected services' },
  '/admin/support': { title: 'Support', subtitle: 'Help & documentation' },
  '/admin/settings': { title: 'Settings', subtitle: 'Product admin settings' },
};

function getTitle(pathname) {
  if (pathname === '/admin/clients' && pathname.length > 14) return { title: 'Client Detail', subtitle: '' };
  const base = pathname.replace(/\/admin\/clients\/[^/]+/, '/admin/clients');
  return titles[base] || titles['/admin'];
}

export default function AdminLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const isClientDetail = /^\/admin\/clients\/[^/]+$/.test(pathname);
  const { title, subtitle } = isClientDetail ? { title: 'Client Detail', subtitle: '' } : getTitle(pathname);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
