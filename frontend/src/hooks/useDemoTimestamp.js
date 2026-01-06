import { useDemoContext } from '../contexts/DemoContext';

/**
 * Hook to get the appropriate timestamp for API calls
 * Returns the demo's real timestamp if demo is active, otherwise undefined for live data
 */
export const useDemoTimestamp = () => {
  const { demoState } = useDemoContext();
  
  if (demoState.isActive && demoState.realTimestamp) {
    return demoState.realTimestamp;
  }
  
  return undefined;
};




