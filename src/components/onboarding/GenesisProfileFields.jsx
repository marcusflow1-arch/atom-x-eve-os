import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function GenesisProfileFields({ profile, setProfile, email, config, setConfig }) {
  const field = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const maxBirth = new Date();
  maxBirth.setFullYear(maxBirth.getFullYear() - 13);

  return <section className="genesis-fields genesis-identity-step">
    <p className="genesis-kicker">02 / YOUR IDENTITY</p>
    <h1>Name your character.<br />Make it yours.</h1>
    <p className="genesis-description">Your body and face are chosen on the first screen. Now enter the character and account information that follows you through Atom × Eve.</p>

    <label>Character name<input required autoComplete="off" maxLength={40} value={config.name || ''} placeholder="Name your AI avatar" onChange={(event) => setConfig((current) => ({ ...current, name: event.target.value }))} /><small>This is the name shown for your AI character inside Atom × Eve.</small></label>
    <label>Display username<input required autoComplete="nickname" minLength={3} maxLength={30} value={profile.username} onChange={(event) => field('username', event.target.value)} /></label>
    <label>Your name<input required autoComplete="name" maxLength={80} value={profile.display_name} onChange={(event) => field('display_name', event.target.value)} /><small>Private account identity; separate from your character name.</small></label>
    <label>Account email<input type="email" value={email || ''} readOnly /><small>Managed by your sign-in account.</small></label>

    <div className="genesis-field-pair">
      <label>Date of birth<input type="date" required min="1900-01-01" max={maxBirth.toISOString().slice(0, 10)} value={profile.date_of_birth} onChange={(event) => field('date_of_birth', event.target.value)} /></label>
      <label>Phone · optional<input type="tel" autoComplete="tel" maxLength={30} value={profile.phone} onChange={(event) => field('phone', event.target.value)} /></label>
    </div>

    <p className="genesis-note"><ShieldCheck size={18} />Your date of birth and phone stay in your private setup profile. Ages 13+. Camera capture and face generation are handled on the first character screen and only run after you grant permission and consent.</p>
  </section>;
}
