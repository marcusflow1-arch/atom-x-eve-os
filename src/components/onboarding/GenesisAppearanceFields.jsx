import {FACE_CONTROLS,FIT_DEFAULTS} from './avatarAppearanceData';
import { Eye, Palette, PersonStanding, Sparkles } from 'lucide-react';
import { AVATAR_STYLE_PRESETS, DEFAULT_AVATAR_APPEARANCE } from '@/components/onboarding/genesisAssets';

const SKIN_PRESETS = ['#f2d4bf', '#d9aa88', '#b97855', '#8a553a', '#5c3828', '#3a241c'];
const EYE_PRESETS = ['#6f8f55', '#5ca9c9', '#6c78c9', '#8a6845', '#5a4438', '#9d7ac7'];

export default function GenesisAppearanceFields({ config, setConfig, capabilities = {} }) {
  const update = (patch) => setConfig((current) => ({ ...current, ...patch }));
  const body = { width: 1, depth: 1, ...(config.body_proportions || {}) };
  const mats = capabilities.materials || [];
  const morphs = capabilities.morphs || [];

  return <section className="genesis-fields genesis-appearance-fields">
    <p className="genesis-kicker">03 / APPEARANCE</p>
    <h1>Build your<br />signature look.</h1>
    <p className="genesis-description">Refine your fitted face, choose a style and customize the body. These settings follow your character throughout the app.</p>

    <div className="genesis-subsection">
      <div className="genesis-subsection-title"><Sparkles size={15}/><span>Art direction</span></div>
      <div className="genesis-style-grid">
        {AVATAR_STYLE_PRESETS.map((style) => <button key={style.id} type="button" className="genesis-style-card" aria-pressed={(config.style_preset || 'heroic_fantasy') === style.id} onClick={() => update({ style_preset: style.id })}>
          <span className={`genesis-style-swatch genesis-style-${style.id}`} />
          <strong>{style.name}</strong><small>{style.short}</small><p>{style.description}</p>
        </button>)}
      </div>
    </div>

    <div className="genesis-subsection">
      <div className="genesis-subsection-title"><PersonStanding size={15}/><span>Body proportions</span></div>
      <label>Height <small>{Math.round((config.height_scale || 1) * 100)}%</small><input aria-label="Height proportion" type="range" min="0.84" max="1.18" step="0.01" value={config.height_scale || 1} onChange={e => update({ height_scale: Number(e.target.value) })} /></label>
      <label>Frame width <small>{Math.round(body.width * 100)}%</small><input aria-label="Body frame width" type="range" min="0.88" max="1.12" step="0.01" value={body.width} onChange={e => update({ body_proportions: { ...body, width: Number(e.target.value) } })} /></label>
      <label>Body depth <small>{Math.round(body.depth * 100)}%</small><input aria-label="Body depth" type="range" min="0.90" max="1.10" step="0.01" value={body.depth} onChange={e => update({ body_proportions: { ...body, depth: Number(e.target.value) } })} /></label>
    </div>

    <div className="genesis-subsection">
      <div className="genesis-subsection-title"><Palette size={15}/><span>Complexion & color</span></div>
      <div className="genesis-color-row">
        <label><span>Skin complexion</span><input type="color" aria-label="Skin complexion" value={config.skin_tone || DEFAULT_AVATAR_APPEARANCE.skin_tone} onChange={e => update({ skin_tint_enabled: true, skin_tone: e.target.value })} /></label>
        <div className="genesis-color-presets" aria-label="Skin complexion presets">{SKIN_PRESETS.map(color => <button key={color} type="button" aria-label={`Skin tone ${color}`} style={{background:color}} onClick={() => update({ skin_tint_enabled: true, skin_tone: color })} />)}</div>
      </div>
      {capabilities.eyes && <div className="genesis-color-row">
        <label><span>Eye color</span><input type="color" aria-label="Eye color" value={config.eye_color || DEFAULT_AVATAR_APPEARANCE.eye_color} onChange={e => update({eye_tint_enabled:true, eye_color: e.target.value })} /></label>
        <div className="genesis-color-presets" aria-label="Eye color presets">{EYE_PRESETS.map(color => <button key={color} type="button" aria-label={`Eye color ${color}`} style={{background:color}} onClick={() => update({eye_tint_enabled:true, eye_color: color })} />)}</div>
      </div>
      }<div className="genesis-field-pair">
        <label>Hair color<input type="color" aria-label="Hair color" value={config.hair_color || DEFAULT_AVATAR_APPEARANCE.hair_color} onChange={e => update({ hair_tint_enabled: true, hair_color: e.target.value })} /></label>
        <label>Eyelashes<select aria-label="Eyelash style" value={config.eyelash_style || 'natural'} onChange={e => update({ eyelash_style: e.target.value })}><option value="soft">Soft</option><option value="natural">Natural</option><option value="bold">Bold</option></select></label>
      </div>
    </div>

    {capabilities.faceFit && <div className="genesis-subsection"><h3>Face proportions</h3>{FACE_CONTROLS.map(([key,label])=><label key={key}>{label}<input type="range" aria-label={label} min="-1" max="1" step=".02" value={config.face_shape?.[key]||0} onChange={e=>setConfig(c=>({...c,face_shape:{...c.face_shape,[key]:Number(e.target.value)}}))}/></label>)}</div>}
    {capabilities.hi3d && <div className="genesis-subsection">
      <label>Complexion<select value={config.complexion||'natural'} onChange={e=>update({complexion:e.target.value})}><option value="natural">Natural</option><option value="freckles">Freckles</option><option value="rosy">Rosy cheeks</option></select></label>
      <label>Mustache<select value={config.facial_hair||'none'} onChange={e=>update({facial_hair:e.target.value})}><option value="none">None</option><option value="fine">Fine</option><option value="trimmed">Trimmed</option></select></label>
      <label>Mustache color<input type="color" value={config.facial_hair_color||'#30241e'} onChange={e=>update({facial_hair_color:e.target.value})}/></label>
      <label>Tattoo<select value={config.tattoo_style||'none'} onChange={e=>update({tattoo_style:e.target.value})}><option value="none">None</option><option value="bands">Forearm bands</option><option value="botanical">Botanical line</option></select></label>
      <label>Tattoo arm<select value={config.tattoo_placement||'left'} onChange={e=>update({tattoo_placement:e.target.value})}><option value="left">Left</option><option value="right">Right</option></select></label>
      <label>Tattoo color<input type="color" value={config.tattoo_color||'#263b42'} onChange={e=>update({tattoo_color:e.target.value})}/></label>
      <label>Hair length<input type="range" min=".35" max="1.35" step=".01" value={config.hair_length||1} onChange={e=>update({hair_length:Number(e.target.value)})}/></label>
      <label>Hair volume<input type="range" min=".8" max="1.2" step=".01" value={config.hair_volume||1} onChange={e=>update({hair_volume:Number(e.target.value)})}/></label>
    </div>}
    {(capabilities.hood || capabilities.weapon) && <div className="genesis-subsection">
      <div className="genesis-subsection-title"><Eye size={15}/><span>Wearables</span></div>
      <div className="genesis-toggle-grid">
        {capabilities.hood && <button type="button" aria-pressed={config.hood_enabled !== false} onClick={() => update({ hood_enabled: config.hood_enabled === false })}><span>Hood</span><small>{config.hood_enabled === false ? 'Off' : 'On'}</small></button>}
        {capabilities.weapon && <button type="button" aria-pressed={config.weapon_visible !== false} onClick={() => update({ weapon_visible: config.weapon_visible === false })}><span>Bow / weapon</span><small>{config.weapon_visible === false ? 'Hidden' : 'Visible'}</small></button>}
      </div>
    </div>}

    {mats.length > 0 && <div className="genesis-subsection"><div className="genesis-subsection-title"><Palette size={15}/><span>Material tuning</span></div><div className="genesis-materials">{mats.map(m => <label key={m.key}><input type="color" aria-label={`${m.label} tint`} value={config.material_colors?.[m.key] || m.color} onChange={e => setConfig(c => ({ ...c, material_colors: { ...(c.material_colors || {}), [m.key]: e.target.value } }))} /><span>{m.label}<small>Material tint</small></span></label>)}</div></div>}

    {morphs.length > 0 && <div className="genesis-subsection"><div className="genesis-subsection-title"><PersonStanding size={15}/><span>Face & shape controls</span></div>{morphs.map(m => <label key={m.key}>{m.label}<input aria-label={m.label} type="range" min="0" max="1" step="0.05" value={config.morph_targets?.[m.key] || 0} onChange={e => setConfig(c => ({ ...c, morph_targets: { ...(c.morph_targets || {}), [m.key]: Number(e.target.value) } }))} /></label>)}</div>}

    <button type="button" className="genesis-link" onClick={() => setConfig(c => ({
      ...c, ...FIT_DEFAULTS,
      style_preset: DEFAULT_AVATAR_APPEARANCE.style_preset,
      skin_tone: DEFAULT_AVATAR_APPEARANCE.skin_tone,
      eye_color: DEFAULT_AVATAR_APPEARANCE.eye_color,
      hair_color: DEFAULT_AVATAR_APPEARANCE.hair_color,
      eyelash_style: DEFAULT_AVATAR_APPEARANCE.eyelash_style,
      hood_enabled: DEFAULT_AVATAR_APPEARANCE.hood_enabled,
      weapon_visible: DEFAULT_AVATAR_APPEARANCE.weapon_visible,
      height_scale: 1,
      material_colors: {},
      morph_targets: {},
      body_proportions: { width: 1, depth: 1 },
    }))}>Restore original appearance</button>
    <p className="genesis-note">Controls are capability-aware. Erika's current clothing is largely one combined mesh, so a true removable hood appears only when a model contains a separate hood/cowl mesh. Generated and future modular avatars can expose that control automatically.</p>
  </section>;
}
