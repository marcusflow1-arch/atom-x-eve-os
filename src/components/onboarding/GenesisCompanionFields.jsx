import React from 'react';
import { COMPANION_MODELS } from '@/components/onboarding/genesisAssets';
export default function GenesisCompanionFields({config,setConfig}) {
  return <section className="genesis-fields"><p className="genesis-kicker">02 / YOUR AI</p><h1>Meet your<br />other half.</h1><p className="genesis-description">Two starting forms. One lasting identity. Choose the companion you want to bring into your world.</p>
    <div className="genesis-choices">{Object.entries(COMPANION_MODELS).map(([gender,model]) => <button type="button" key={gender} aria-pressed={config.gender===gender} onClick={()=>setConfig(c=>({...c,gender,model_url:model.url,material_colors:{},morph_targets:{}}))}><strong>{gender === 'female' ? 'Female' : 'Male'}</strong><small>{model.name}</small></button>)}</div>
    <label>Companion name<input required maxLength={40} value={config.name} placeholder="Give your AI a name" onChange={e=>setConfig(c=>({...c,name:e.target.value}))} /></label>
    <p className="genesis-note">Your AI is saved to your account—not just this device. Returning users keep their companion and earned progress.</p>
  </section>;
}