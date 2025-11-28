import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Monitor, Smartphone, Globe, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function DesktopInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="desktop-installer-container">
      <style>{`
        .desktop-installer-container {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          min-height: 100vh;
          padding: 2rem;
          color: #e2e8f0;
        }

        .installer-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .installer-title {
          font-size: 3.5rem;
          font-weight: 900;
          background: linear-gradient(45deg, #ffffff, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }

        .installer-subtitle {
          font-size: 1.2rem;
          color: #94a3b8;
        }

        .installation-options {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .install-option {
          background: rgba(30, 41, 59, 0.8);
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .install-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .install-option:hover::before {
          opacity: 1;
        }

        .install-option:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.6);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
        }

        .option-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .option-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }

        .option-description {
          color: #94a3b8;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .install-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .install-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
        }

        .install-button:disabled {
          background: #374151;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .status-success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-available {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-info {
          background: rgba(168, 85, 247, 0.2);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .instructions-section {
          max-width: 800px;
          margin: 3rem auto;
          background: rgba(30, 41, 59, 0.6);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .instructions-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .instruction-step {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          border-left: 4px solid #3b82f6;
        }

        .step-number {
          background: #3b82f6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 700;
          margin-right: 0.75rem;
        }
      `}</style>

      <div className="installer-header">
        <h1 className="installer-title">ATOM × EVE OS</h1>
        <p className="installer-subtitle">Install as Desktop Application</p>
      </div>

      <div className="installation-options">
        {/* PWA Installation */}
        <div className="install-option">
          <div className="option-icon">
            <Download className="w-10 h-10" />
          </div>
          <h3 className="option-title">Progressive Web App</h3>
          
          {isInstalled && (
            <div className="status-badge status-success">
              <CheckCircle className="w-4 h-4" />
              Already Installed
            </div>
          )}
          
          {canInstall && !isInstalled && (
            <div className="status-badge status-available">
              <Download className="w-4 h-4" />
              Ready to Install
            </div>
          )}
          
          {!canInstall && !isInstalled && (
            <div className="status-badge status-info">
              <Info className="w-4 h-4" />
              Use Browser Menu
            </div>
          )}

          <p className="option-description">
            Install ATOM × EVE OS directly from your browser. Works offline, 
            launches like a native app, and stays up-to-date automatically.
          </p>
          
          <Button 
            onClick={handleInstallPWA}
            disabled={!canInstall || isInstalled}
            className="install-button"
          >
            {isInstalled ? 'Installed' : canInstall ? 'Install Now' : 'Use Browser Install'}
          </Button>
        </div>

        {/* Electron Option */}
        <div className="install-option">
          <div className="option-icon">
            <Monitor className="w-10 h-10" />
          </div>
          <h3 className="option-title">Electron Desktop App</h3>
          <div className="status-badge status-info">
            <Info className="w-4 h-4" />
            Developer Build
          </div>
          <p className="option-description">
            Full native desktop experience with advanced features like 
            system notifications, file system access, and custom shortcuts.
          </p>
          <Button className="install-button">
            Download Electron App
          </Button>
        </div>

        {/* Tauri Option */}
        <div className="install-option">
          <div className="option-icon">
            <Globe className="w-10 h-10" />
          </div>
          <h3 className="option-title">Tauri Native App</h3>
          <div className="status-badge status-info">
            <Info className="w-4 h-4" />
            Coming Soon
          </div>
          <p className="option-description">
            Ultra-lightweight native app built with Rust. 
            Minimal resource usage with maximum performance.
          </p>
          <Button disabled className="install-button">
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="instructions-section">
        <h3 className="instructions-title">
          <Info className="w-6 h-6" />
          Manual Installation Instructions
        </h3>
        
        <div className="instruction-step">
          <span className="step-number">1</span>
          <strong>Chrome/Edge:</strong> Click the install icon in the address bar, or go to Settings → Install ATOM × EVE OS
        </div>
        
        <div className="instruction-step">
          <span className="step-number">2</span>
          <strong>Firefox:</strong> Go to Settings → Install this site as an app
        </div>
        
        <div className="instruction-step">
          <span className="step-number">3</span>
          <strong>Safari:</strong> Click Share → Add to Dock (macOS) or Add to Home Screen (iOS)
        </div>
        
        <div className="instruction-step">
          <span className="step-number">4</span>
          <strong>Mobile:</strong> Use "Add to Home Screen" from your browser's share menu
        </div>
      </div>
    </div>
  );
}