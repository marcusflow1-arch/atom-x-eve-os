import React from 'react';
export default function GenesisAppearanceFields({ config, setConfig, capabilities }) {
  return <section className="genesis-fields">
    <p className="genesis-kicker">03 / APPEARANCE</p><h1>Your signature<br />look.</h1><p className="genesis-description">Adjust the real materials and shapes available on this model. Changes appear on the left.</p>
    <label>Height proportion <small>{Math.round(config.height_scale * 100)}%</small><input aria-label="Height proportion" type="range" min="0.9" max="1.1" step="0.01" value={config.height_scale} onChange={e => setConfig(c => ({...c, height_scale: Number(e.target.value)}))} /></label>
    <div className="genesis-materials">{capabilities.materials.map(m => <label key={m.key}><input type="color" aria-label={`${m.label} tint`} value={config.material_colors[m.key] || m.color} onChange={e => setConfig(c => ({ ...c, material_colors: { ...c.material_colors, [m.key]: e.target.value } }))} /><span>{m.label}<small>Material tint</small></span></label>)}</div>
    {capabilities.morphs.map(m => <label key={m.key}>{m.label}<input aria-label={m.label} type="range" min="0" max="1" step="0.05" value={config.morph_targets[m.key] || 0} onChange={e => setConfig(c => ({ ...c, morph_targets: { ...c.morph_targets, [m.key]: Number(e.target.value) } }))} /></label>)}
    <button type="button" className="genesis-link" onClick={() => setConfig(c => ({...c, material_colors: {}, morph_targets: {}, height_scale: 1}))}>Restore original appearance</button>
    <p className="genesis-note">Hairstyle swaps, new outfits, and facial sculpting need compatible hair, clothing, or face-shape assets. Only supported model controls are shown—not decorative sliders.</p>
  </section>;
}