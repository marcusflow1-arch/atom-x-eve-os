import React from 'react';
import { UserRound } from 'lucide-react';
import { COMPANION_MODELS } from '@/components/onboarding/genesisAssets';

export default function GenesisCompanionFields({ config, setConfig }) {
  const chooseGender = (gender) => {
    const model = COMPANION_MODELS[gender];
    setConfig((current) => ({
      ...current,
      gender,
      model_url: model.url,
      face_scan_generated: false,
      tripo_model_id: '',
      material_colors: {},
      morph_targets: {},
    }));
  };

  return <section className="genesis-fields genesis-gender-step">
    <p className="genesis-kicker">01 / CHARACTER BODY</p>
    <h1>Choose male<br />or female.</h1>
    <p className="genesis-description">This is the first choice in character creation. The male option uses the same white-shirt Luna AI avatar shown in the center of your dashboard. You can personalize the face on the next screen.</p>

    <div className="genesis-choices genesis-gender-choices">
      {Object.entries(COMPANION_MODELS).map(([gender, model]) => (
        <button type="button" key={gender} aria-pressed={config.gender === gender} onClick={() => chooseGender(gender)}>
          <span className="genesis-gender-icon"><UserRound size={21} /></span>
          <strong>{gender === 'male' ? 'Male' : 'Female'}</strong>
          <small>{model.name}</small>
          {gender === 'male' && <em>Dashboard Luna model</em>}
        </button>
      ))}
    </div>

    <p className="genesis-note">Your body choice sets the starting 3D model only. Face generation and appearance controls can still personalize the character afterward.</p>
  </section>;
}
