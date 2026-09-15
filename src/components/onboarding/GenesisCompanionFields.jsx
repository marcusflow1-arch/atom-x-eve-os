import { UserRound } from 'lucide-react';

import { COMPANION_MODELS, FEMALE_MODEL_VARIANTS } from '@/components/onboarding/genesisAssets';

export default function GenesisCompanionFields({ config, setConfig }) {
  const resetBody = (current, gender, model, femaleVariant = '') => ({
    ...current,
    gender, female_model_variant: gender === 'female' ? femaleVariant : '',
    face_shape: {}, face_fit_source: 'manual', appearance_version: 3,
    model_url: model.url,
    base_body_gender: gender,
    base_body_model_url: model.url,
    face_scan_generated: false,
    face_model_url: '',
    face_capture_preview_url: '',
    tripo_model_id: '',
    material_colors: {},
    morph_targets: {},
  });

  const chooseGender = (gender) => {
    const model = COMPANION_MODELS[gender];
    setConfig((current) => resetBody(current, gender, model, gender === 'female' ? 'artemis_archer' : ''));
  };

  const chooseFemaleModel = (variantId) => {
    const model = FEMALE_MODEL_VARIANTS[variantId] || FEMALE_MODEL_VARIANTS.artemis_archer;
    setConfig((current) => resetBody(current, 'female', model, model.id));
  };

  return <section className="genesis-fields genesis-gender-step">
    <p className="genesis-kicker">01 / CHARACTER BODY + FACE</p>
    <h1>Choose your body.<br />Then scan your face.</h1>
    <p className="genesis-description">Start by choosing Male or Female. The male option uses the white-shirt Luna AI character from the dashboard. On the next screen, use your camera or upload a photo to fit your face.</p>

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

    {config.gender === 'female' && (
      <div className="mt-5">
        <p className="genesis-kicker">FEMALE MODEL</p>
        <div className="genesis-choices genesis-gender-choices mt-2">
          {Object.values(FEMALE_MODEL_VARIANTS).map((model) => {
            const selected = (config.female_model_variant || 'greco_girl') === model.id;
            return (
              <button type="button" key={model.id} aria-pressed={selected} onClick={() => chooseFemaleModel(model.id)}>
                <span className="genesis-gender-icon"><UserRound size={21} /></span>
                <strong>{model.name}</strong>
                <small>{model.id === 'artemis_archer' ? 'Default female · Mythic Greek Archer · idle rig' : 'Greco-Roman female · alternate body'}</small>
                {model.isDefault && <em>Default</em>}
              </button>
            );
          })}
        </div>
      </div>
    )}

    <p className="genesis-note">Changing Male/Female restores that body's default face. Female characters can choose the Mythic Greek Archer or the Greco-Roman Girl; the Mythic Greek Archer is the current default. After you capture a new face, the live 3D preview updates to the fitted likeness.</p>
  </section>;
}
