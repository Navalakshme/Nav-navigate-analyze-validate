import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NAV Uncaught Error in UI Component:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
          <div className="card p-8 max-w-lg w-full text-center space-y-4 border-status-missing/30 shadow-card">
            <div className="w-12 h-12 rounded-full bg-status-missing/10 text-status-missing flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-text-primary">Something went wrong</h2>
            <p className="text-xs text-text-secondary">
              An unexpected display error occurred while rendering this view.
            </p>
            {this.state.error && (
              <div className="bg-bg-elevated p-3 rounded-lg text-left overflow-x-auto border border-border-subtle">
                <p className="text-[11px] font-mono text-status-missing break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reload View
              </button>
              <button
                onClick={this.handleReset}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
