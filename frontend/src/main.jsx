import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'

// Apply default dark theme on load
const rootElement = document.documentElement;
const savedSettings = localStorage.getItem('pumpMonitoringSettings');
if (savedSettings) {
  try {
    const settings = JSON.parse(savedSettings);
    const theme = settings.display?.theme || 'dark';
    if (theme === 'light') {
      rootElement.classList.add('light');
      rootElement.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      rootElement.classList.add('dark');
      rootElement.setAttribute('data-theme', 'dark');
    } else {
      // Auto
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        rootElement.classList.add('dark');
        rootElement.setAttribute('data-theme', 'dark');
      } else {
        rootElement.classList.add('light');
        rootElement.setAttribute('data-theme', 'light');
      }
    }
  } catch (e) {
    rootElement.classList.add('dark');
    rootElement.setAttribute('data-theme', 'dark');
  }
} else {
  rootElement.classList.add('dark');
  rootElement.setAttribute('data-theme', 'dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)

