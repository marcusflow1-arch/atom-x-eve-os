
import React from 'react';
import { motion } from 'framer-motion';
import CharacterMedia from './CharacterMedia';
import StoryText from './StoryText';
import AmbientLayer from './AmbientLayer';

export default function SceneFrame({ scene, character, isActive, parallaxX }) {
  const isRightMedia = scene.layout === 'rightMedia';

  return (
    <motion.div
      className="relative w-screen h-screen flex-shrink-0 snap-center overflow-hidden"
      aria-roledescription="slide"
      aria-label={`${scene.headline}`}
    >
      <div
        className={`w-full h-full flex flex-col md:flex-row items-center justify-center ${
          isRightMedia ? 'md:flex-row-reverse' : ''
        }`}
      >
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          {isActive && <CharacterMedia media={scene.media} character={character} />}
        </div>
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-8 md:p-16">
          <StoryText scene={scene} isActive={isActive} />
        </div>
      </div>
      <AmbientLayer effectType={scene.bg?.ambientFx} parallaxDepth={parallaxX * (scene.bg?.parallaxDepth || 0)} />
    </motion.div>
  );
}
