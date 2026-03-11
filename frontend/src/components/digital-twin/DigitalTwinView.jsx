/**
 * Digital Twin – live 3D pump view. Fetches realtime/overview and renders a 3D scene + sensor overlay.
 * Route: /app/pump/:pumpId/digital-twin
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ArrowLeft } from 'lucide-react';
import { fetchPumpRealtime, fetchPumpOverview } from '../../services/api';
import PumpScene from './PumpScene';
import SensorOverlay from './SensorOverlay';

const POLL_MS = 5000;

export default function DigitalTwinView({
  pumps,
  setSelectedPump,
  loadPumps,
  loading: parentLoading,
  error: parentError,
  lastUpdate,
}) {
  const { pumpId: pumpIdParam } = useParams();
  const pumpId = pumpIdParam ? decodeURIComponent(pumpIdParam) : null;
  const navigate = useNavigate();

  const [realtime, setRealtime] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!pumpId) return;
    try {
      setError(null);
      const [realtimeRes, overviewRes] = await Promise.all([
        fetchPumpRealtime(pumpId),
        fetchPumpOverview(pumpId).catch(() => null),
      ]);
      // Normalize realtime: API returns { data: { flow, bearing_temp, ... } }; flatten for overlay/3D
      const flatRealtime =
        realtimeRes?.data
          ? { ...realtimeRes, ...realtimeRes.data, flow_m3h: realtimeRes.data.flow ?? realtimeRes.data.flow_m3h }
          : realtimeRes || {};
      setRealtime(flatRealtime);
      setOverview(overviewRes || {});
    } catch (e) {
      setError(e?.message || 'Failed to load pump data');
      setRealtime({});
      setOverview({});
    } finally {
      setLoading(false);
    }
  }, [pumpId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pump = pumps?.find((p) => p.id === pumpId);

  if (!pumpId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
        <p className="text-[var(--text-secondary)] mb-4">No pump selected.</p>
        <button
          type="button"
          onClick={() => navigate('/app/dashboard')}
          className="inline-flex items-center gap-2 text-primary-500 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigate(`/app/pump/${encodeURIComponent(pumpId)}/dashboard`)}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Digital Twin · {pump?.name || pumpId}
        </h1>
      </div>

      <div className="relative flex-1 min-h-[420px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
        {parentError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]/90 z-10">
            <p className="text-red-400">{parentError}</p>
          </div>
        )}
        {loading && !realtime && !overview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-card)]/90 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-2" />
            <p className="text-[var(--text-secondary)]">Loading live data…</p>
          </div>
        )}
        {error && !realtime && !overview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-card)]/90 z-10">
            <p className="text-amber-500 mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
            >
              Retry
            </button>
          </div>
        )}
        <Canvas
          camera={{ position: [4, 2.2, 4], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <color attach="background" args={['#0f172a']} />
          <PumpScene realtime={realtime} overview={overview} />
        </Canvas>
        <SensorOverlay realtime={realtime} overview={overview} pumpId={pumpId} />
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mt-2">
        Full pump + pipeline view · Drag to rotate · Scroll to zoom · Colors: health (casing), bearing temp (left housing), vibration (seal). Data refreshes every 5s.
      </p>
    </div>
  );
}
