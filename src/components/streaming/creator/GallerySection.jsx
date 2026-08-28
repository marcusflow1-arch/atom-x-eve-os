import React from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function GallerySection({ isEditMode, galleryImages = [], onUpdateImages, onClose }) {

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onUpdateImages([...galleryImages, file_url]);
      } catch (err) {
        const url = URL.createObjectURL(file);
        onUpdateImages([...galleryImages, url]);
      }
    };
    input.click();
  };

  const handleRemove = (index) => {
    onUpdateImages(galleryImages.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Gallery
          {isEditMode && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}
        </h3>
        {isEditMode && (
          <Button size="sm" className="bg-white text-black hover:bg-slate-200" onClick={handleUpload}>
            <Upload className="w-3 h-3 mr-2" /> Upload
          </Button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {isEditMode && (
          <div
            onClick={handleUpload}
            className="aspect-video w-[280px] flex-shrink-0 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5 text-white/60" />
            </div>
            <span className="text-xs font-bold text-white/40">Upload Image</span>
          </div>
        )}
        {galleryImages.map((url, i) => (
          <div key={i} className="aspect-video w-[280px] flex-shrink-0 bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all cursor-pointer group relative">
            <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            {isEditMode && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 hover:text-white text-white/60 flex items-center justify-center transition-colors pointer-events-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {galleryImages.length === 0 && !isEditMode && (
          <div className="w-full py-12 text-center text-white/30 text-sm">No gallery images yet</div>
        )}
      </div>
    </div>
  );
}