/**
 * Full-page dashboard for a single pump. Shown when user clicks a pump card from /app/dashboard.
 * Route: /app/pump/:pumpId/dashboard
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import PumpProductOverview from './PumpProductOverview';
import UniversalPdMDashboard from './UniversalPdMDashboard';
import DigitalTwinView from '../digital-twin/DigitalTwinView';

export default function PumpDashboardPage({
  pumps,
  selectedPump,
  setSelectedPump,
  loadPumps,
  loading,
  error,
  lastUpdate,
  view = 'dashboard',
}) {
  const { pumpId: pumpIdParam } = useParams();
  const pumpId = pumpIdParam ? decodeURIComponent(pumpIdParam) : null;
  const navigate = useNavigate();
  const pump = pumps.find((p) => p.id === pumpId);
  const currentPump = pumps.find((p) => p.id === selectedPump);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar
        selectedView="dashboard"
        onViewChange={(id) => (id === 'dashboard' ? navigate('/app/dashboard') : navigate(`/app/${id}`))}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header lastUpdate={lastUpdate} currentPumpStatus={currentPump?.status} />

        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-4" aria-hidden />
              <p className="text-[var(--text-secondary)]">Loading...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
              {error}
            </div>
          ) : !pumpId ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
              <p className="text-[var(--text-secondary)]">No pump selected.</p>
              <button
                type="button"
                onClick={() => navigate('/app/dashboard')}
                className="mt-4 inline-flex items-center gap-2 text-primary-500 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </div>
          ) : !pump && pumps.length > 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
              <p className="text-[var(--text-secondary)]">Pump not found.</p>
              <button
                type="button"
                onClick={() => navigate('/app/dashboard')}
                className="mt-4 inline-flex items-center gap-2 text-primary-500 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </div>
          ) : view === 'digital-twin' ? (
            <DigitalTwinView
              pumps={pumps}
              setSelectedPump={setSelectedPump}
              loadPumps={loadPumps}
              loading={loading}
              error={error}
              lastUpdate={lastUpdate}
            />
          ) : (
            <>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/dashboard')}
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to all pumps
                </button>
              </div>
              <PumpProductOverview
                pump={pump}
                pumpId={pumpId}
                onOpenDigitalTwin={() => navigate(`/app/pump/${encodeURIComponent(pumpId)}/digital-twin`)}
              />
              <UniversalPdMDashboard
                pumpId={pumpId}
                pumps={pumps}
                selectedPump={pumpId}
                onPumpSelect={(id) => {
                  setSelectedPump(id);
                  navigate(`/app/pump/${id}/dashboard`);
                }}
                hidePumpList
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
