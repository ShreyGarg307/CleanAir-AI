import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isScriptError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isScriptError: false
  };

  private handleWindowError = (event: ErrorEvent) => {
    if (event.message === 'Script error.') {
      this.setState({
        hasError: true,
        isScriptError: true,
        error: new Error('A cross-origin script error occurred. This is usually caused by an invalid or restricted Google Maps API key.')
      });
    }
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, isScriptError: error.message === 'Script error.' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.isScriptError) {
        return (
          <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-900 text-white p-8">
            <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-rose-500/30">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-4 text-rose-400">API Key Error</h2>
              <p className="text-slate-300 text-center mb-6">
                A script error occurred while loading Google Maps. This usually happens when your API key is invalid, lacks the <strong>Maps JavaScript API</strong> permission, or has strict domain restrictions.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm border border-slate-700">
                <p className="text-slate-400 mb-2">Please ensure:</p>
                <ul className="list-disc list-inside text-slate-300 ml-2 space-y-1">
                  <li>Maps JavaScript API is enabled in GCP.</li>
                  <li>Your API key is valid.</li>
                  <li>There are no HTTP Referrer restrictions blocking this domain.</li>
                </ul>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-900 text-white p-8">
          <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-rose-500/30">
            <h2 className="text-xl font-bold text-rose-400 mb-4">Application Error</h2>
            <details className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 text-sm text-slate-300">
              <summary className="cursor-pointer font-bold text-white mb-2">View Details</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
