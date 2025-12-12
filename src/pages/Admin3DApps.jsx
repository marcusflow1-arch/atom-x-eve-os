import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Play, Folder, Loader2, X, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';

export default function Admin3DApps() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [appName, setAppName] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const { data: webApps = [], isLoading } = useQuery({
    queryKey: ['webApps3D'],
    queryFn: () => base44.entities.WebApp3D.list('-created_date'),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id) => base44.entities.WebApp3D.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webApps3D'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      alert('Please upload a .zip file');
      return;
    }

    if (!appName.trim()) {
      alert('Please enter an app name');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('File size must be under 500MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.WebApp3D.create({
        name: appName,
        zip_url: file_url,
        file_size: file.size,
      });
      
      queryClient.invalidateQueries({ queryKey: ['webApps3D'] });
      setAppName('');
      e.target.value = '';
      alert(`App "${appName}" uploaded successfully!`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">3D Web Apps Manager</h1>
            <p className="text-slate-400">Upload and run Three.js / Rogue Engine builds</p>
          </div>
          <Badge variant="outline" className="text-slate-400">
            {webApps.length} Apps
          </Badge>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload New Web Build
          </h2>
          <div className="space-y-4">
            <Input
              placeholder="App Name (e.g., My Three.js Game)"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              id="webAppUpload"
              disabled={uploading}
              onChange={handleFileUpload}
            />
            <label htmlFor="webAppUpload" className="cursor-pointer">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 w-full" 
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Folder className="w-4 h-4 mr-2" />
                      Select ZIP File (Max 500MB)
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Apps List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading apps...
          </div>
        ) : webApps.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No 3D web apps uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {webApps.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(app.created_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Folder className="w-4 h-4" />
                          {(app.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedApp(app)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Open Viewer
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => {
                          if (confirm(`Delete "${app.name}"?`)) {
                            deleteAppMutation.mutate(app.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
          <h4 className="text-blue-400 font-semibold mb-2">Requirements</h4>
          <ul className="text-blue-300/80 text-sm space-y-1">
            <li>• ZIP file containing your Three.js / Rogue Engine build</li>
            <li>• Must include index.html in the root or subdirectory</li>
            <li>• Maximum file size: 500MB</li>
            <li>• All assets (models, textures, scripts) must be in the ZIP</li>
          </ul>
        </div>
      </div>

      {/* Viewer Modal */}
      {selectedApp && (
        <WebAppViewer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}

function WebAppViewer({ app, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    loadApp();
  }, [app]);

  const loadApp = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
          htmlContent = htmlContent.replace(new RegExp(`"\./${path}"`, 'g'), `"${url}"`);
          htmlContent = htmlContent.replace(new RegExp(`'\./${path}'`, 'g'), `'${url}'`);
        }
      }
      
      // Create blob URL for HTML
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      setIframeUrl(htmlUrl);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load app:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-8 bg-slate-950 border border-slate-800 rounded-2xl z-[101] flex flex-col overflow-hidden"
      >
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{app.name}</h3>
            <p className="text-slate-400 text-sm">3D Web App Viewer</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 bg-black relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading app...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-white font-bold mb-2">Failed to Load App</h4>
                <p className="text-slate-400 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {iframeUrl && (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="w-full h-full border-none"
              title={app.name}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            />
          )}
        </div>
      </motion.div>
    </>
  );
}