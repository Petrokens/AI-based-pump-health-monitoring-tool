import React from 'react';
import { ChevronRight, Activity, Package, Plus } from 'lucide-react';

/**
 * Grid of pump cards for dashboard. Click a card to select that pump and view full details.
 * Optional onAddPump: when set, shows an "Add pump" button above the grid that navigates to pump setup.
 */
export default function PumpCards({ pumps, selectedPumpId, onSelectPump, onAddPump }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Pumps</h2>
        {onAddPump && (
          <button
            type="button"
            onClick={onAddPump}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add pump
          </button>
        )}
      </div>
      {pumps?.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pumps.map((pump) => {
          const isSelected = pump.id === selectedPumpId;
          return (
            <button
              key={pump.id}
              type="button"
              onClick={() => onSelectPump(pump.id)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-primary-500/50 hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {pump.name || pump.id}
                    </span>
                  </div>
                  {pump.categoryLabel && (
                    <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                      <Package className="w-3 h-3" />
                      {pump.categoryLabel}
                    </p>
                  )}
                  {pump.pumpType && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {pump.pumpType}
                      {pump.model && ` · ${pump.model}`}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-[var(--text-secondary)]">
                      Health: <strong className="text-[var(--text-primary)]">{pump.health_index ?? 85}%</strong>
                    </span>
                    {pump.location && (
                      <span className="text-[var(--text-tertiary)] truncate max-w-[120px]" title={pump.location}>
                        {pump.location}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 shrink-0 ${isSelected ? 'text-primary-500' : 'text-[var(--text-tertiary)]'}`}
                />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">Click to view full details</p>
            </button>
          );
        })}
      </div>
      ) : null}
    </div>
  );
}
