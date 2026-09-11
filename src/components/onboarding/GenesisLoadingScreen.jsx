import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { INTRO_VIDEO } from '@/components/onboarding/genesisAssets';
export default function GenesisLoadingScreen({ label = 'Restoring your companion' }) {
  const reduced = useReducedMotion();
  return <motion.div className="genesis-surface genesis-loading" role="status" aria-live="polite" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.4}}><div className="genesis-moon"><Moon aria-hidden="true" />{!reduced && <video src={INTRO_VIDEO} autoPlay muted loop playsInline aria-hidden="true" />}</div><p className="genesis-kicker">ATOM × EVE</p><h2>{label}</h2><div className="genesis-loading-line" /><p>Your world. Your companion.</p></motion.div>;
}