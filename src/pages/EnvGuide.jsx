import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Copy, FileText } from 'lucide-react';
import { ENV_EXAMPLE } from '@/components/env/envValidator';

/**
 * Developer reference page for environment configuration
 * Only accessible in development mode
 */
export default function EnvGuide() {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ENV_EXAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Only show in dev mode
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Available in Production</h1>
          <p className="text-slate-400">This page is only accessible in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Environment Configuration Guide</h1>
          <p className="text-slate-400">How to set up environment variables for Atom x Eve</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              .env File Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-sm">
              Create a <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">.env</code> file 
              in your project root with the following content:
            </p>
            
            <div className="relative">
              <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-green-400">{ENV_EXAMPLE}</code>
              </pre>
              
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Current Environment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <EnvVariable 
              name="MODE" 
              value={import.meta.env.MODE} 
              required={false}
            />
            <EnvVariable 
              name="VITE_BASE44_APP_ID" 
              value={import.meta.env.VITE_BASE44_APP_ID} 
              required={false}
              note="Auto-detected from URL if not set"
            />
            <EnvVariable 
              name="VITE_STRIPE_PUBLISHABLE_KEY" 
              value={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY} 
              required={false}
              note="Required for Stripe payments"
            />
            <EnvVariable 
              name="VITE_PAYPAL_CLIENT_ID" 
              value={import.meta.env.VITE_PAYPAL_CLIENT_ID} 
              required={false}
              note="Required for PayPal payments"
            />
          </CardContent>
        </Card>

        <Card className="bg-blue-950/50 border-blue-900/50">
          <CardHeader>
            <CardTitle className="text-blue-300">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Only VITE_ prefixed variables are exposed to client</p>
                <p className="text-blue-300/80">
                  Vite only exposes variables that start with <code className="bg-blue-900/50 px-1 rounded">VITE_</code> to 
                  your client-side code. Never put secrets in VITE_ variables.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Backend secrets go in Dashboard Settings</p>
                <p className="text-blue-300/80">
                  API keys and secrets used by backend functions should be set in the Base44 Dashboard 
                  under Settings → Environment Variables (without VITE_ prefix).
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-400" />
              <div>
                <p className="font-semibold mb-1">Restart dev server after changes</p>
                <p className="text-blue-300/80">
                  Changes to .env files require restarting the development server to take effect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EnvVariable({ name, value, required, note }) {
  const isSet = value !== undefined && value !== '';
  
  return (
    <div className="flex items-start justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm font-mono text-cyan-400">{name}</code>
          {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {note && <p className="text-xs text-slate-400">{note}</p>}
      </div>
      
      <div className="flex items-center gap-2">
        {isSet ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <Badge className="bg-green-900/50 text-green-300 border-green-700">Set</Badge>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <Badge variant="outline" className="border-slate-600 text-slate-400">Not Set</Badge>
          </>
        )}
      </div>
    </div>
  );
}