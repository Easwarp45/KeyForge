import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback UI. Defaults to the built-in error card. */
  fallback?: React.ReactNode;
}

/**
 * ErrorBoundary — React class component that catches JavaScript errors in the
 * component tree and renders a fallback UI instead of a blank screen.
 *
 * WHY: React doesn't catch errors thrown during rendering in functional components
 * automatically — without a boundary, any uncaught render error causes the entire
 * app to go blank. This boundary confines errors to the subtree it wraps (e.g., a
 * single page), so navigation, the sidebar, and other pages remain functional.
 *
 * USAGE:
 *   // Wrap the entire app (main.tsx) for global protection:
 *   <ErrorBoundary><App /></ErrorBoundary>
 *
 *   // Or wrap specific pages for isolated protection:
 *   <ErrorBoundary fallback={<p>Dashboard failed to load</p>}>
 *     <Dashboard />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to your error monitoring service (e.g. Sentry):
    // Sentry.captureException(error, { extra: info });
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error" style={{ fontSize: 32 }}>error_outline</span>
          </div>
          <div>
            <h2 className="text-on-surface font-bold text-xl mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant text-sm max-w-sm">
              An unexpected error occurred in this section. The rest of the app is still running normally.
            </p>
            {this.state.error && (
              <p className="font-mono text-xs text-error/80 mt-2 bg-error/5 border border-error/10 rounded px-3 py-1 inline-block">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold shadow-emerald-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary px-5 py-2.5 rounded-lg text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
