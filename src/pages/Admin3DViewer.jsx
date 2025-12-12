import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Eye, Copy, Trash2, ExternalLink, Download, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import Model3DPreview from '../components/admin/Model3DPreview';

export default function Admin3DViewer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [modelName, setModelName] = useState('');
  const [previewModel, setPreviewModel] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: models3D = [], isLoading, refetch } = useQuery({
    queryKey: ['admin3DModels'],
    queryFn: () => base44.entities.Model3D.list('-created_date'),
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id) => base44.entities.Model3D.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin3DModels'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['glb', 'gltf'].includes(fileType)) {
      alert('Please upload a .glb or .gltf file');
      return;
    }

    if (!modelName.trim()) {
      alert('Please enter a model name');
      return;
    }

    setUploading(true);
    try {
      // Upload to Base44 storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create model record
      await base44.entities.Model3D.create({
        name: modelName,
        file_url: file_url,
        file_size: file.size,
        file_type: fileType,
        is_global: true
      });
      
      refetch();
      setModelName('');
      e.target.value = '';
      alert('Model uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Admin check
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <Globe className="w-10 h-10 text-purple-500" />
            3D Model Viewer
          </h1>
          <p className="text-slate-400">Upload, preview, and manage GLTF/GLB 3D model files</p>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Upload New Model</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Model Name (e.g., Cyberpunk_Character)"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="bg-slate-900 border-slate-700 h-12"
              />
            </div>
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button 
                className="bg-purple-600 hover:bg-purple-700 w-full h-12" 
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Select GLB/GLTF File
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              💡 Supported formats: .glb (binary), .gltf (JSON). Files are stored in Base44 storage with public URLs.
            </p>
          </div>
        </div>

        {/* Models Grid */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Uploaded Models</h2>
            <Badge variant="outline" className="text-slate-400">
              {models3D.length} Model{models3D.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading models...
            </div>
          ) : models3D.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">No 3D models yet</p>
              <p className="text-sm">Upload your first GLTF or GLB file above</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {models3D.map((model) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Model Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white">{model.name}</h3>
                          <Badge className="bg-purple-600 text-xs uppercase">
                            {model.file_type}
                          </Badge>
                          {model.is_global && (
                            <Badge className="bg-blue-600 text-xs">Global</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span>{(model.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span>{new Date(model.created_date).toLocaleString()}</span>
                        </div>

                        {/* Public URL */}
                        <div className="space-y-2">
                          <label className="text-xs text-slate-400 font-semibold">Public URL:</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-slate-900 px-3 py-2 rounded text-cyan-400 font-mono break-all border border-slate-700">
                              {model.file_url}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(model.file_url, model.id)}
                              className="flex-shrink-0"
                            >
                              {copiedId === model.id ? (
                                <>✓ Copied</>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Usage Example */}
                        <details className="mt-3">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                            Show usage in code
                          </summary>
                          <code className="block mt-2 text-xs bg-slate-900 px-3 py-2 rounded text-green-400 font-mono border border-slate-700">
                            {`<ModelViewer3D url="${model.file_url}" autoRotate={true} />`}
                          </code>
                        </details>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 flex-1 lg:flex-none"
                          onClick={() => setPreviewModel(model)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        
                        <a
                          href={model.file_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                          onClick={() => {
                            if (confirm(`Delete "${model.name}"?`)) {
                              deleteModelMutation.mutate(model.id);
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
        </div>

        {/* Info Panel */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              File Serving
            </h3>
            <p className="text-blue-300/80 text-sm">
              Files are automatically served with correct MIME types:
              <br />• .gltf → <code>model/gltf+json</code>
              <br />• .glb → <code>model/gltf-binary</code>
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Global Access
            </h3>
            <p className="text-green-300/80 text-sm">
              All uploaded models are marked as "global" and can be used anywhere in your app using the ModelViewer3D component or Three.js primitives.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModel && (
        <Model3DPreview 
          url={previewModel.file_url} 
          onClose={() => setPreviewModel(null)} 
        />
      )}
    </div>
  );
}