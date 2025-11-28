import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  MoreVertical, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Youtube,
  Music,
  Calendar,
  Clock
} from 'lucide-react';
import { StreamVideo } from '@/entities/StreamVideo';
import { motion } from 'framer-motion';

const VideoCard = ({ video, onEdit, onDelete, onUpload, onToggleVisibility }) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500/50 transition-all duration-300"
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-slate-900">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-slate-500" />
          </div>
        )}
        
        {/* Duration Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-sm font-mono">
          {formatDuration(video.duration)}
        </div>
        
        {/* Visibility Indicator */}
        <div className="absolute top-2 left-2">
          {video.visibility === 'public' ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : video.visibility === 'private' ? (
            <EyeOff className="w-4 h-4 text-yellow-400" />
          ) : (
            <Edit className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-2">{video.title}</h3>
        
        <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(video.created_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{video.view_count || 0} views</span>
          </div>
        </div>
        
        {video.game_category && (
          <div className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded mb-3">
            {video.game_category}
          </div>
        )}

        {/* External Upload Status */}
        {video.uploaded_platforms && video.uploaded_platforms.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {video.uploaded_platforms.map(platform => (
              <div key={platform.platform} className="flex items-center gap-1">
                {platform.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                {platform.platform === 'tiktok' && <Music className="w-4 h-4 text-pink-500" />}
                <span className="text-xs text-slate-400">Uploaded</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => window.open(video.video_url, '_blank')}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-1" />
            Watch
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onUpload(video)}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => onEdit(video)}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => onDelete(video.id)}
              size="sm"
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function VideoLibrary() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const userVideos = await StreamVideo.list('-created_date');
      setVideos(userVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (video) => {
    const newTitle = prompt('Enter new title:', video.title);
    if (newTitle && newTitle !== video.title) {
      try {
        await StreamVideo.update(video.id, { title: newTitle });
        await loadVideos();
      } catch (error) {
        console.error('Failed to update video:', error);
        alert('Failed to update video');
      }
    }
  };

  const handleDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await StreamVideo.delete(videoId);
        await loadVideos();
      } catch (error) {
        console.error('Failed to delete video:', error);
        alert('Failed to delete video');
      }
    }
  };

  const handleUpload = async (video) => {
    // This would open a modal for platform selection and upload
    const platform = prompt('Enter platform (youtube/tiktok):');
    if (platform && ['youtube', 'tiktok'].includes(platform.toLowerCase())) {
      try {
        // In a real implementation, this would call the respective platform API
        const uploadData = {
          uploaded_platforms: [
            ...(video.uploaded_platforms || []),
            {
              platform: platform.toLowerCase(),
              platform_id: `mock_${Date.now()}`,
              uploaded_at: new Date().toISOString(),
              status: 'uploaded'
            }
          ]
        };
        
        await StreamVideo.update(video.id, uploadData);
        await loadVideos();
        alert(`Video uploaded to ${platform}!`);
      } catch (error) {
        console.error('Failed to upload video:', error);
        alert('Failed to upload video');
      }
    }
  };

  const handleToggleVisibility = async (video) => {
    const visibilityOptions = ['public', 'private', 'draft'];
    const currentIndex = visibilityOptions.indexOf(video.visibility);
    const nextVisibility = visibilityOptions[(currentIndex + 1) % visibilityOptions.length];
    
    try {
      await StreamVideo.update(video.id, { visibility: nextVisibility });
      await loadVideos();
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.game_category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'streams' && video.stream_type === 'live_stream') ||
                         (filterBy === 'uploads' && video.stream_type === 'upload') ||
                         (filterBy === 'public' && video.visibility === 'public') ||
                         (filterBy === 'private' && video.visibility === 'private');
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'oldest':
        return new Date(a.created_date) - new Date(b.created_date);
      case 'views':
        return (b.view_count || 0) - (a.view_count || 0);
      case 'duration':
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        .video-library {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 24px;
        }
      `}</style>

      <div className="video-library">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">My Video Library</h2>
          <div className="text-sm text-slate-400">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/50 border-slate-600 text-slate-200"
          />
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-200 w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="duration">Longest</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-200 w-full sm:w-48">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="streams">Live Streams</SelectItem>
              <SelectItem value="uploads">Uploads</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpload={handleUpload}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
            <p className="text-slate-400">
              {searchTerm ? 'Try adjusting your search or filters' : 'Start streaming to create your first video!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}