import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Global error boundary for product-grade error handling.
 * Catches React render errors and shows a friendly recovery UI.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-amber-500" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              The app encountered an error. You can try again or refresh the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
