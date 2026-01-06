import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedSettings = localStorage.getItem('pumpMonitoringSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return settings.display?.theme || 'dark';
      } catch (e) {
        return 'dark';
      }
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const rootElement = document.documentElement;
    
    // Remove existing theme classes
    rootElement.classList.remove('dark', 'light');
    
    // Add current theme class
    rootElement.classList.add(theme);
    rootElement.setAttribute('data-theme', theme);

    // Save to localStorage
    const savedSettings = localStorage.getItem('pumpMonitoringSettings');
    let settings = {};
    try {
      settings = savedSettings ? JSON.parse(savedSettings) : {};
    } catch (e) {
      settings = {};
    }
    
    if (!settings.display) {
      settings.display = {};
    }
    settings.display.theme = theme;
    localStorage.setItem('pumpMonitoringSettings', JSON.stringify(settings));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
