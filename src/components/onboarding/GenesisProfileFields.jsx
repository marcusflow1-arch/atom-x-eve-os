import React from 'react';
import { ShieldCheck } from 'lucide-react';
export default function GenesisProfileFields({ profile, setProfile, email }) {
  const field = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const maxBirth = new Date(); maxBirth.setFullYear(maxBirth.getFullYear() - 13);
  return <section className="genesis-fields">
    <p className="genesis-kicker">01 / YOUR ACCOUNT</p><h1>Make yourself<br />at home.</h1><p className="genesis-description">A few details, then a companion that is distinctly yours.</p>
    <label>Your name<input required autoComplete="name" maxLength={80} value={profile.display_name} onChange={e => field('display_name', e.target.value)} /></label>
    <label>Display username<input required autoComplete="nickname" minLength={3} maxLength={30} value={profile.username} onChange={e => field('username', e.target.value)} /></label>
    <label>Account email<input type="email" value={email || ''} readOnly /><small>Managed by your sign-in account.</small></label>
    <div className="genesis-field-pair"><label>Date of birth<input type="date" required min="1900-01-01" max={maxBirth.toISOString().slice(0,10)} value={profile.date_of_birth} onChange={e => field('date_of_birth', e.target.value)} /></label><label>Phone · optional<input type="tel" autoComplete="tel" maxLength={30} value={profile.phone} onChange={e => field('phone', e.target.value)} /></label></div>
    <p className="genesis-note"><ShieldCheck size={18} />Your date of birth and phone stay in your private setup profile. Ages 13+. No ID upload or payment details are collected here.</p>
  </section>;
}