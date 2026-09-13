import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AVATAR_STYLE_PRESETS, COMPANION_MODELS, PERSONALITIES } from '@/components/onboarding/genesisAssets';

export default function GenesisReview({ profile, config, preview }) {
  const style = AVATAR_STYLE_PRESETS.find((item) => item.id === config.style_preset) || AVATAR_STYLE_PRESETS[0];
  const details = [
    ['Display name', profile.display_name],
    ['Username', profile.username],
    ['Companion', config.name],
    ['Form', config.face_scan_generated ? 'Personal likeness · rigged avatar' : COMPANION_MODELS[config.gender].name],
    ['Art direction', style.name],
    ['Personality', PERSONALITIES.find((p) => p.id === config.personality)?.name],
    ['Hood', config.hood_enabled === false ? 'Off' : 'On / when supported'],
    ['Weapon', config.weapon_visible === false ? 'Hidden' : 'Visible / when supported'],
    ['Voice', config.voice?.uri || 'System default'],
    ['AI learning', 'Starts neutral · learns from your play'],
  ];

  return <section className="genesis-fields">
    <p className="genesis-kicker">05 / READY TO BEGIN</p>
    <h1>Your journey.<br />Your companion.</h1>
    <p className="genesis-description">Review the identity, look and learning setup that will follow you into Atom × Eve.</p>
    <dl className="genesis-summary">{details.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
    <p className="genesis-note"><ShieldCheck size={18}/>{preview ? 'Developer preview saves a separate draft only. Your live avatar, personal profile and progress are not changed.' : 'Your generated likeness is used as the 3D companion model. The AI mind still begins neutral and develops from gameplay, conversations and the observation settings you choose.'}</p>
  </section>;
}
