import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const DemoContext = createContext(null);

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  return context;
};

export const DemoProvider = ({ children }) => {
  const [demoState, setDemoState] = useState({
    isActive: false,
    currentTimestamp: null, // ISO timestamp string
    realTimestamp: null, // Original data timestamp
    progress: 0, // 0-1
  });

  const updateDemoState = useCallback((updates) => {
    setDemoState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetDemo = useCallback(() => {
    setDemoState({
      isActive: false,
      currentTimestamp: null,
      realTimestamp: null,
      progress: 0,
    });
  }, []);

  const value = useMemo(
    () => ({ demoState, updateDemoState, resetDemo }),
    [demoState, updateDemoState, resetDemo]
  );

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};




