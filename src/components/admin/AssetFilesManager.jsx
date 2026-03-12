import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, File, Loader2, FolderArchive, Package, Image, Film, FileText, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

export default function AssetFilesManager() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type || 'unknown',
        url: file_url,
        uploadedAt: new Date().toLocaleString()
      };
      
      setUploadedFiles(prev => [newFile, ...prev]);
      showSuccess('File uploaded successfully!');
    } catch (error) {
      showError(error, 'Upload');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    showSuccess('URL copied to clipboard!');
  };

  const removeFileFromView = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return <Image className="w-8 h-8 text-blue-400" />;
    if (type.includes('video')) return <Film className="w-8 h-8 text-purple-400" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('archive')) return <Package className="w-8 h-8 text-yellow-400" />;
    return <FileText className="w-8 h-8 text-slate-400" />;
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-yellow-500" />
            Asset Files
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload generic files, folders (as zip), map data, asset packs, and other media
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <h3 className="font-semibold mb-4 text-white">Upload New Asset</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <label className="relative cursor-pointer w-full md:w-auto">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button 
              disabled={uploading}
              className="bg-yellow-600 hover:bg-yellow-700 w-full md:w-auto"
              asChild
            >
              <span>
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Select File</>
                )}
              </span>
            </Button>
          </label>
          <div className="text-sm text-slate-400">
            Supports any file type. You can copy the URL immediately after upload.
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Recent Uploads (Session)</h3>
        {uploadedFiles.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
            <FolderArchive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No files uploaded in this session yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedFiles.map(file => (
              <div key={file.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-4 group">
                <div className="bg-slate-900 p-3 rounded-lg">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-200 truncate" title={file.name}>{file.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.uploadedAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-700 text-slate-300"
                    onClick={() => copyToClipboard(file.url)}
                    title="Copy URL"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    onClick={() => removeFileFromView(file.id)}
                    title="Remove from list (Does not delete file)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}