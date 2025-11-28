import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            </div>
            
            <p className="text-slate-300 mb-4">
              The application encountered an error. This might be a temporary issue.
            </p>
            
            {this.state.error && (
              <div className="bg-slate-900/50 rounded p-4 mb-4 overflow-auto max-h-64">
                <p className="text-red-400 text-sm font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <pre className="text-slate-400 text-xs mt-2 whitespace-pre-wrap font-mono">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <details className="mt-2">
                    <summary className="text-blue-400 text-xs cursor-pointer hover:text-blue-300">
                      Component Stack (click to expand)
                    </summary>
                    <pre className="text-slate-400 text-xs mt-2 whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Button 
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
              >
                Clear Cache & Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}