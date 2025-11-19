import React, { useCallback, useEffect, useState } from 'react';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { fetchPumpRuntime, controlPump } from '../../services/api';

const PumpControlButton = ({ pumpId, onControl = () => {} }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadState = useCallback(async () => {
    if (!pumpId) return;
    try {
      const data = await fetchPumpRuntime(pumpId);
      setIsRunning(Boolean(data?.is_running));
      setError(null);
    } catch (err) {
      console.error('Failed to load runtime state', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [pumpId]);

  useEffect(() => {
    setLoading(true);
    loadState();
  }, [loadState]);

  const handleClick = async () => {
    if (!pumpId) return;
    const action = isRunning ? 'stop' : 'start';
    setActionLoading(true);
    try {
      const data = await controlPump(pumpId, action);
      setIsRunning(Boolean(data?.is_running));
      setError(null);
      onControl();
    } catch (err) {
      console.error('Failed to control pump', err);
      setError(err.response?.data?.error || err.message || 'Control failed');
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (actionLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-semibold">Processing...</span>
        </>
      );
    }
    if (isRunning) {
      return (
        <>
          <PowerOff className="h-4 w-4" />
          <span className="text-sm font-semibold">Stop Pump</span>
        </>
      );
    }
    return (
      <>
        <Power className="h-4 w-4" />
        <span className="text-sm font-semibold">Start Pump</span>
      </>
    );
  };

  return (
    <div className="pl-4 flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || actionLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
          isRunning
            ? 'border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20'
            : 'border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-semibold">Loading...</span>
          </>
        ) : (
          renderContent()
        )}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default PumpControlButton;

