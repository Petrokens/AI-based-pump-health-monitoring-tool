import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import AppTopbar from './components/common/AppTopbar';
import Sidebar from './components/Sidebar';
import AIInsights from './components/AIInsights';
import TrendExplorer from './components/TrendExplorer';
import UniversalPdMDashboard from './components/dashboard/UniversalPdMDashboard';
import PumpCards from './components/dashboard/PumpCards';
import PumpDashboardPage from './components/dashboard/PumpDashboardPage';
import DigitalTwinView from './components/digital-twin/DigitalTwinView';
import MLOutputs from './components/MLOutputs';
import RootCausePanel from './components/RootCausePanel';
import AlertsWorkflow from './components/AlertsWorkflow';
import ReportsKPIs from './components/ReportsKPIs';
import Settings from './components/Settings';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { fetchPumps, createPump } from './services/api';

import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import DemoSignupPage from './components/auth/DemoSignupPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './components/admin/AdminOverview';
import ClientList from './components/admin/ClientList';
import ClientDetail from './components/admin/ClientDetail';
import DemoEntryList from './components/admin/DemoEntryList';
import AdminSettings from './components/admin/AdminSettings';
import AdminPlans from './components/admin/AdminPlans';
import AdminPayments from './components/admin/AdminPayments';
import AdminProducts from './components/admin/AdminProducts';
import AdminReports from './components/admin/AdminReports';
import AdminNotifications from './components/admin/AdminNotifications';
import AdminAuditLog from './components/admin/AdminAuditLog';
import AdminIntegrations from './components/admin/AdminIntegrations';
import AdminSupport from './components/admin/AdminSupport';
import PumpSelectionFlow from './components/setup/PumpSelectionFlow';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProfileCard from './components/profile/ProfileCard';
import PlanPage from './components/plan/PlanPage';

const VALID_VIEWS = ['dashboard', 'analytics', 'insights', 'trends', 'alerts', 'reports', 'settings', 'plan'];
function viewOrDashboard(view) {
  return VALID_VIEWS.includes(view) ? view : 'dashboard';
}

function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const from = location.pathname + location.search;
  if (!isAuthenticated) {
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }
  if (!isAdmin) return <Navigate to="/app/select-pump" replace />;
  return children;
}

function RequireClient({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  // For now, allow unauthenticated users to access client app routes
  // so that deep links like /app/select-pump work even before login.
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function SelectPumpLayout({ setPumps, setSelectedPump, pumps, clientId, loadPumps }) {
  const navigate = useNavigate();
  const { user, getCurrentClient } = useAuth();
  const client = getCurrentClient?.() ?? null;

  const handlePumpSetupComplete = (pumpOrPayload) => {
    const isApiPump = pumpOrPayload && typeof pumpOrPayload.id !== 'undefined' && pumpOrPayload.name;
    const pump = isApiPump
      ? pumpOrPayload
      : {
          id: pumpOrPayload.pump_id || pumpOrPayload.pumpId || 'P-101A',
          name: pumpOrPayload.model ? `${pumpOrPayload.model} - ${pumpOrPayload.pump_id}` : `${pumpOrPayload.pumpType || 'Pump'} - ${pumpOrPayload.pump_id}`,
          status: 'normal',
          health_index: 85,
          rul_hours: 500,
          location: 'Pump House - Unit 1',
          model: pumpOrPayload.model || 'Custom',
          vendor: pumpOrPayload.manufacturer || 'Unknown',
          rated_flow: pumpOrPayload.flow ?? 150,
          ai_confidence: 90,
          categoryLabel: pumpOrPayload.categoryLabel,
          pumpType: pumpOrPayload.pumpType,
        };
    setPumps((prev) => [pump, ...(prev || [])]);
    setSelectedPump(pump.id);
    if (clientId && loadPumps) loadPumps();
    navigate('/app/dashboard');
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar selectedView="select-pump" onViewChange={(id) => navigate(`/app/${id}`)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppTopbar
          title="Pump Selection & Setup"
          subtitle="Select category, type, and enter pump data to open the predictive maintenance dashboard."
        />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-6 min-h-0" style={{ minHeight: '400px' }}>
          <div className="space-y-6 max-w-5xl">
            <ErrorBoundary>
              <ProfileCard user={user ?? {}} client={client ?? null} pumpsCount={pumps?.length ?? 0} />
            </ErrorBoundary>
            <ErrorBoundary>
              <PumpSelectionFlow
                clientId={clientId}
                onSubmit={handlePumpSetupComplete}
                pumpsCount={pumps?.length ?? 0}
              />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

function MainAppLayout({
  pumps,
  selectedPump,
  setSelectedPump,
  loadPumps,
  loading,
  error,
  lastUpdate,
  initialView,
}) {
  const { view: routeView } = useParams();
  const navigate = useNavigate();
  const effectiveView = initialView || routeView;
  const selectedView = viewOrDashboard(effectiveView);
  const currentPump = pumps.find((p) => p.id === selectedPump);

  // Redirect invalid view param to dashboard (shareable URLs stay valid)
  React.useEffect(() => {
    if (routeView && !VALID_VIEWS.includes(routeView)) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [routeView, navigate]);

  const handleViewChange = (id) => navigate(`/app/${id}`);
  const hasNoPumps = !loading && !error && pumps.length === 0;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar selectedView={selectedView} onViewChange={handleViewChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header lastUpdate={lastUpdate} currentPumpStatus={currentPump?.status} />

        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-4" aria-hidden />
              <p className="text-[var(--text-secondary)]">Loading pump data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 max-w-md">
                <h3 className="text-red-500 font-bold text-lg mb-2">Connection Error</h3>
                <p className="text-[var(--text-secondary)] mb-4">{error}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={loadPumps}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Retry Connection
                  </button>
                  <button
                    onClick={() => navigate('/app/select-pump')}
                    className="border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] px-4 py-2 rounded-lg transition-colors"
                  >
                    Add pump
                  </button>
                </div>
              </div>
            </div>
          ) : hasNoPumps && selectedView !== 'plan' ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 max-w-md text-center">
                <h3 className="text-[var(--text-primary)] font-bold text-lg mb-2">No pumps yet</h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Set up your first pump to see the dashboard, analytics, and other views.
                </p>
                <button
                  onClick={() => navigate('/app/select-pump')}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Set up pump
                </button>
              </div>
            </div>
          ) : (
            <>
              {selectedView === 'dashboard' && (
                    <PumpCards
                      pumps={pumps}
                      selectedPumpId={selectedPump}
                      onSelectPump={setSelectedPump}
                      onAddPump={() => navigate('/app/select-pump')}
                      onCardClick={(pump) => navigate(`/app/pump/${pump.id}/dashboard`)}
                    />
                  )}

                  {selectedView === 'insights' && (
                    <>
                      <MLOutputs pumpId={selectedPump} />
                      <RootCausePanel pumpId={selectedPump} />
                      <AIInsights pumpId={selectedPump} expanded={true} />
                    </>
                  )}

                  {selectedView === 'trends' && (
                    <TrendExplorer pumpId={selectedPump} expanded={true} />
                  )}

                  {selectedView === 'analytics' && (
                    <AnalyticsDashboard pumpId={selectedPump} />
                  )}

                  {selectedView === 'alerts' && (
                    <AlertsWorkflow pumpId={selectedPump} />
                  )}

                  {selectedView === 'reports' && (
                    <ReportsKPIs pumpId={selectedPump} />
                  )}

                  {selectedView === 'settings' && (
                    <Settings />
                  )}

                  {selectedView === 'plan' && (
                    <PlanPage pumps={pumps} />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
  );
}

function ClientAppRoutes() {
  const { user } = useAuth();
  const clientId = user?.clientId ?? null;
  const [selectedPump, setSelectedPump] = useState('P-101A');
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadPumps = async () => {
    try {
      setError(null);
      const data = await fetchPumps(clientId || undefined);
      const list = Array.isArray(data) ? data : [];
      setPumps(list);
      setSelectedPump((prevSelected) => {
        if (list.length === 0) return '';
        if (prevSelected && list.find((p) => p.id === prevSelected)) return prevSelected;
        return list[0].id;
      });
      setLoading(false);
    } catch (err) {
      if (!err._logged) {
        err._logged = true;
        console.error('Error loading pumps:', err);
      }
      let errorMessage = 'Failed to connect to backend.';
      if (err.code === 'ECONNABORTED' || err.message?.includes?.('timeout')) {
        errorMessage = 'Backend request timed out.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend. Please check the server.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    let pollingInterval = 10000;
    let intervalId = null;
    let consecutiveFailures = 0;

    const attemptLoad = async (retries = 5) => {
      let retryDelay = 2000;
      for (let i = 0; i < retries; i++) {
        try {
          await loadPumps();
          consecutiveFailures = 0;
          break;
        } catch (err) {
          consecutiveFailures++;
          if (i === retries - 1) pollingInterval = 30000;
          else {
            retryDelay = Math.min(16000, retryDelay * 2);
            await new Promise((r) => setTimeout(r, retryDelay));
          }
        }
      }
    };

    attemptLoad();

    const scheduleNextPoll = () => {
      if (intervalId) clearTimeout(intervalId);
      intervalId = setTimeout(async () => {
        try {
          await loadPumps();
          consecutiveFailures = 0;
          setLastUpdate(new Date());
        } catch (err) {
          consecutiveFailures++;
          pollingInterval = Math.min(30000, 10000 + consecutiveFailures * 5000);
        }
        scheduleNextPoll();
      }, pollingInterval);
    };

    scheduleNextPoll();
    return () => { if (intervalId) clearTimeout(intervalId); };
  }, [clientId]);

  const selectPumpEl = (
    <SelectPumpLayout
      setPumps={setPumps}
      setSelectedPump={setSelectedPump}
      pumps={pumps}
      clientId={clientId}
      loadPumps={loadPumps}
    />
  );

  return (
    <Routes>
      {/* /app with no segment → go to select-pump */}
      <Route path="/app" element={<Navigate to="/app/select-pump" replace />} />
      {/* Single-pump dashboard: support both full path and relative (under /app/*) */}
      <Route
        path="/app/pump/:pumpId/dashboard"
        element={
          <PumpDashboardPage
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
          />
        }
      />
      <Route
        path="pump/:pumpId/dashboard"
        element={
          <PumpDashboardPage
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
          />
        }
      />
      {/* Digital Twin – 3D live pump view */}
      <Route
        path="/app/pump/:pumpId/digital-twin"
        element={
          <PumpDashboardPage
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
            view="digital-twin"
          />
        }
      />
      <Route
        path="pump/:pumpId/digital-twin"
        element={
          <PumpDashboardPage
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
            view="digital-twin"
          />
        }
      />
      {/* Pump-specific AI Insights: from pump dashboard opens this pump's predictions */}
      <Route
        path="/app/pump/:pumpId/insights"
        element={
          <PumpDashboardPage
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
            view="insights"
          />
        }
      />
      <Route
        path="pump/:pumpId/insights"
        element={
          <PumpDashboardPage
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
            view="insights"
          />
        }
      />
      {/* Pump setup */}
      <Route path="/app/select-pump" element={selectPumpEl} />
      <Route path="select-pump" element={selectPumpEl} />
      {/* Dashboard, plan, analytics, etc. */}
      <Route
        path="/app/:view"
        element={
          <MainAppLayout
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
          />
        }
      />
      <Route
        path=":view"
        element={
          <MainAppLayout
            pumps={pumps}
            selectedPump={selectedPump}
            setSelectedPump={setSelectedPump}
            loadPumps={loadPumps}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
          />
        }
      />
      <Route path="*" element={<Navigate to="/app/select-pump" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <Routes>
            {/* Public: landing, login, demo signup */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/demo" element={<DemoSignupPage />} />
            {/* Admin: /admin, /admin/clients, /admin/clients/:id, /admin/demo-entries, /admin/settings */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="clients" element={<ClientList />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="demo-entries" element={<DemoEntryList />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="integrations" element={<AdminIntegrations />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            {/* Client app: /app, /app/select-pump, /app/dashboard, /app/analytics, /app/insights, /app/trends, /app/alerts, /app/reports, /app/settings, /app/plan */}
            <Route
              path="/app/*"
              element={
                <RequireClient>
                  <ClientAppRoutes />
                </RequireClient>
              }
            />
            {/* 404 → landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
