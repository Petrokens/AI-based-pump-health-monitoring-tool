import React, { createContext, useContext, useState } from 'react';

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

  const updateDemoState = (updates) => {
    setDemoState((prev) => ({ ...prev, ...updates }));
  };

  const resetDemo = () => {
    setDemoState({
      isActive: false,
      currentTimestamp: null,
      realTimestamp: null,
      progress: 0,
    });
  };

  return (
    <DemoContext.Provider value={{ demoState, updateDemoState, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
};




