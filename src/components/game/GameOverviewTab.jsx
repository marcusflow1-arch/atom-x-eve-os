import React, { useState } from 'react';
import { Play, X } from 'lucide-react';

export default function GameOverviewTab({ game, designMode }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);

  const contentStyles = {
    default: {
      text: 'text-slate-300',
      heading: 'text-white',
      card: 'bg-slate-800 border border-white/10',
    },
    minimal: {
      text: 'text-gray-700',
      heading: 'text-black',
      card: 'bg-gray-50 border border-gray-300',
    },
    dark: {
      text: 'text-gray-400',
      heading: 'text-white',
      card: 'bg-slate-900 border border-white/5',
    },
  };

  const style = contentStyles[designMode];

  // Mock data
  const screenshots = game.screenshots || [game.cover_image, game.cover_image, game.cover_image];
  const features = [
    '360° Open World Exploration',
    'Advanced AI Companion System',
    'Dynamic Card Collection System',
    '4-Player Co-op Multiplayer',
    'Cross-Platform Play',
    'Seasonal Content Updates',
  ];

  return (
    <div className="space-y-12">
      {/* Video Section */}
      <div className="space-y-4">
        <h2 className={`${style.heading} text-2xl font-bold`}>Trailer</h2>
        <div className={`relative w-full aspect-video rounded-xl overflow-hidden ${style.card} group cursor-pointer`}>
          <img
            src={game.cover_image}
            alt="Trailer thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <button
              onClick={() => setSelectedVideoUrl(game.video_urls?.[0] || 'https://www.youtube.com/embed/dQw4w9WgXcQ')}
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all group-hover:scale-110"
            >
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-4">
        <h2 className={`${style.heading} text-2xl font-bold`}>About This Game</h2>
        <p className={`${style.text} text-lg leading-relaxed`}>
          {game.description ||
            'Embark on an unforgettable journey in a world where technology and ancient power collide. Master unique abilities, collect rare artifacts, and forge your destiny.'}
        </p>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <h2 className={`${style.heading} text-2xl font-bold`}>Key Features</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, i) => (
            <li key={i} className={`${style.card} p-4 rounded-lg flex items-start gap-3`}>
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span className={style.text}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Screenshots Section */}
      <div className="space-y-4">
        <h2 className={`${style.heading} text-2xl font-bold`}>Screenshots</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {screenshots.map((screenshot, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(screenshot)}
              className={`relative w-full aspect-video rounded-lg overflow-hidden ${style.card} hover:scale-105 transition-transform group`}
            >
              <img
                src={screenshot}
                alt={`Screenshot ${i + 1}`}
                className="w-full h-full object-cover group-hover:brightness-110 transition-all"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideoUrl(null)}
        >
          <button
            onClick={() => setSelectedVideoUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <iframe
            src={selectedVideoUrl}
            title="Trailer"
            className="w-full max-w-4xl aspect-video rounded-xl"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={selectedImage} alt="Full size" className="max-w-4xl max-h-[90vh] rounded-xl" />
        </div>
      )}
    </div>
  );
}