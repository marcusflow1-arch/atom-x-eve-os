import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Save, Image as ImageIcon, Video, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function StreamerProfileEdit() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
    introVideo: '',
    images: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop'
    ],
    sponsors: [],
    bio: 'Professional gamer and content creator',
    favoriteGames: ['Counter-Strike 2', 'Valorant', 'Apex Legends']
  });

  const handleSave = () => {
    // Save profile logic here
    alert('Profile saved!');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Streamer Profile</h1>
            <p className="text-white/60">Customize your streaming profile</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>

        {/* Banner Section */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Profile Banner</h3>
          <div className="relative aspect-[3/1] rounded-xl overflow-hidden bg-slate-800 border-2 border-dashed border-white/20 hover:border-blue-400 transition-colors cursor-pointer group">
            {profile.bannerImage ? (
              <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-white/40 mx-auto mb-2" />
                  <p className="text-white/60">Click to upload banner</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Introduction Video */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Introduction Video</h3>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border-2 border-dashed border-white/20 hover:border-blue-400 transition-colors cursor-pointer">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Video className="w-12 h-12 text-white/40 mx-auto mb-2" />
                <p className="text-white/60">Click to upload intro video</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Gallery Images</h3>
          <div className="grid grid-cols-4 gap-4">
            {profile.images.map((img, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                <button className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            <div className="aspect-video rounded-lg bg-slate-800 border-2 border-dashed border-white/20 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white/40" />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Bio</h3>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full bg-slate-800 border border-white/20 rounded-lg p-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 h-32"
            placeholder="Tell your viewers about yourself..."
          />
        </div>

        {/* Sponsors/Affiliations */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Sponsors & Affiliations</h3>
          <div className="flex gap-4">
            <div className="w-32 h-32 rounded-lg bg-slate-800 border-2 border-dashed border-white/20 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center">
              <Users className="w-8 h-8 text-white/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}