import React, { useState } from 'react';
import AvatarPanel from '../components/avatar/AvatarPanel';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';

export default function AvatarStudio() {
  const { user, refreshUserData } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const avatars = await base44.entities.Avatar.filter({ user_id: user.id });
      
      if (avatars.length > 0) {
        await base44.entities.Avatar.update(avatars[0].id, { model_url: file_url });
      } else {
        await base44.entities.Avatar.create({
          user_id: user.id,
          name: user.username || 'My Avatar',
          gender: 'male',
          model_url: file_url
        });
      }

      await refreshUserData();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">Avatar Studio</h1>
              <p className="text-slate-400">Customize your 3D avatar and equipment</p>
            </div>
          </div>
        </div>

        {/* Full Avatar Panel */}
        <div className="flex justify-center">
          <AvatarPanel compact={false} showControls={true} />
        </div>

        {/* Additional Studio Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Custom Model Upload Card */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4">Custom Model</h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Upload your own .glb / .gltf avatar model to use in the game.
              </p>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload .GLB Model
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Max size: 50MB. Optimized GLB recommended.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start">
                🎨 Change Appearance
              </Button>
              <Button className="w-full justify-start" variant="outline">
                ⚔️ Manage Equipment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                🎭 Expression Presets
              </Button>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4">Avatar Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Level:</span>
                <span className="text-white">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Experience:</span>
                <span className="text-white">2,450 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Power Level:</span>
                <span className="text-yellow-400">847</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}