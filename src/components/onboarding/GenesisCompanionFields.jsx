import React from 'react';
import { UserRound } from 'lucide-react';
import GenesisFaceScan from '@/components/onboarding/GenesisFaceScan';
import { COMPANION_MODELS } from '@/components/onboarding/genesisAssets';

export default function GenesisCompanionFields({ config, setConfig }) {
  const chooseGender = (gender) => {
    const model = COMPANION_MODELS[gender];
    setConfig((current) => ({
      ...current,
      gender,
      model_url: model.url,
      base_body_gender: gender,
      base_body_model_url: model.url,
      face_scan_generated: false,
      tripo_model_id: '',
      material_colors: {},
      morph_targets: {},
    }));
  };

  return <section className="genesis-fields genesis-gender-step">
    <p className="genesis-kicker">01 / CHARACTER BODY + FACE</p>
    <h1>Choose your body.<br />Then scan your face.</h1>
    <p className="genesis-description">Start by choosing Male or Female. The male option uses the white-shirt Luna AI character from the dashboard. On this same screen, your PC camera can capture your face and apply your likeness to the 3D character preview.</p>

    <div className="genesis-choices genesis-gender-choices">
      {Object.entries(COMPANION_MODELS).map(([gender, model]) => (
        <button type="button" key={gender} aria-pressed={config.gender === gender} onClick={() => chooseGender(gender)}>
          <span className="genesis-gender-icon"><UserRound size={21} /></span>
          <strong>{gender === 'male' ? 'Male' : 'Female'}</strong>
          <small>{model.name}</small>
          {gender === 'male' && <em>White-shirt Luna dashboard body</em>}
        </button>
      ))}
    </div>

    <GenesisFaceScan config={config} setConfig={setConfig} />

    <p className="genesis-note">Changing Male/Female restores that body's default face. After you capture a new face, the live 3D preview updates to the generated personal likeness.</p>
  </section>;
}
