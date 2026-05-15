// Slice A — local error boundary so a Three.js crash inside the test scene
// doesn't blank the whole page. Keeps controls + debug HUD usable for diagnosis.
import React from 'react';

export default class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[NetworkTestScene] crashed:', error, info?.componentStack);
  }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <div className="max-w-md p-5 rounded-lg border border-red-400/40 bg-red-500/10 text-red-100">
            <div className="font-bold mb-2">Scene crashed</div>
            <div className="text-xs font-mono whitespace-pre-wrap mb-3">
              {String(this.state.error?.message || this.state.error)}
            </div>
            <button
              onClick={this.reset}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm"
            >Reload scene</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}