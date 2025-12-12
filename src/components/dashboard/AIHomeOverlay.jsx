import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ThreeModelViewer from './ThreeModelViewer';

export default function AIHomeOverlay({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [olaModelUrl, setOlaModelUrl] = useState(null);

  useEffect(() => {
    loadTestBuild();
    loadOlaModel();
  }, []);

  const loadOlaModel = async () => {
    try {
      const models = await base44.entities.Model3D.filter({ name: 'OLA' });
      if (models.length > 0) {
        setOlaModelUrl(models[0].folder_url);
      }
    } catch (err) {
      console.error('Failed to load OLA model:', err);
    }
  };

  const loadTestBuild = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the test build
      const webApps = await base44.entities.WebApp3D.filter({ name: 'testbuild' });
      
      if (webApps.length === 0) {
        throw new Error('Test build not found. Please upload a 3D web app named "testbuild" in the admin panel.');
      }
      
      const app = webApps[0];
      
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      
      // Fetch the ZIP file
      const response = await fetch(app.zip_url);
      const blob = await response.blob();
      
      // Unzip
      const zip = await JSZip.loadAsync(blob);
      
      // Find index.html
      let indexFile = null;
      let indexPath = null;
      
      // Check root first
      if (zip.files['index.html']) {
        indexFile = zip.files['index.html'];
        indexPath = 'index.html';
      } else {
        // Search in subdirectories
        for (const [path, file] of Object.entries(zip.files)) {
          if (path.endsWith('index.html') && !file.dir) {
            indexFile = file;
            indexPath = path;
            break;
          }
        }
      }
      
      if (!indexFile) {
        throw new Error('index.html not found in ZIP');
      }
      
      // Get the directory of index.html
      const baseDir = indexPath.includes('/') ? indexPath.substring(0, indexPath.lastIndexOf('/') + 1) : '';
      
      // Extract all files
      const fileUrls = {};
      
      for (const [path, file] of Object.entries(zip.files)) {
        if (!file.dir && path.startsWith(baseDir)) {
          const content = await file.async('blob');
          const url = URL.createObjectURL(content);
          const relativePath = path.substring(baseDir.length);
          fileUrls[relativePath] = url;
        }
      }
      
      // Get HTML content
      let htmlContent = await indexFile.async('text');
      
      // Replace relative paths with blob URLs
      for (const [path, url] of Object.entries(fileUrls)) {
        if (path !== 'index.html') {
          // Replace various path formats
          htmlContent = htmlContent.replace(new RegExp(`"${path}"`, 'g'), `"${url}"`);
          htmlContent = htmlContent.replace(new RegExp(`'${path}'`, 'g'), `'${url}'`);
          htmlContent = htmlContent.replace(new RegExp(`"\\./${path}"`, 'g'), `"${url}"`);
          htmlContent = htmlContent.replace(new RegExp(`'\\./${path}'`, 'g'), `'${url}'`);
        }
      }
      
      // Create blob URL for HTML
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      setIframeUrl(htmlUrl);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load test build:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[120] w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-all border border-white/20 text-white"
      >
        <X className="w-5 h-5" />
      </button>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Loading 3D Web App...</p>
            <p className="text-slate-400 text-sm mt-2">Extracting and preparing testbuild</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="text-white font-bold text-xl mb-2">Failed to Load</h4>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {iframeUrl && (
        <>
          <iframe
            src={iframeUrl}
            className="w-full h-full border-none"
            title="3D Web App"
            allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; webgl"
            style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
          />
          
          {/* Invisible box in center for OLA model */}
          {olaModelUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none z-[110]">
              <ThreeModelViewer modelUrl={olaModelUrl} />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}