import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mapError, logError } from './ErrorMapper';

/**
 * Page-level error boundary with recovery options
 * Use for high-risk pages like Admin, Store, Library
 */
export default class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, this.props.pageName || 'Page');
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const mapped = mapError(this.state.error);

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div 
              className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl"
              style={{ boxShadow: '0 0 50px rgba(239, 68, 68, 0.1)' }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white text-center mb-3">
                Page Error
              </h1>
              
              {/* Error Message */}
              <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-200 text-center">
                  {mapped.userMessage}
                </p>
              </div>

              {/* Error Code (Dev Only) */}
              {import.meta.env.DEV && (
                <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 mb-6 font-mono text-xs text-slate-400">
                  <span className="text-slate-500">Error Code:</span> {mapped.code}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {mapped.canRetry && (
                  <Button
                    onClick={this.handleReset}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                )}
                
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 gap-2"
                >
                  <Link to={createPageUrl('LunaTemplate')}>
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-center text-slate-500 text-sm mt-6">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}