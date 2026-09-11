const ROOT = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/';
export function validateGenesis(input) {
  const p = input.profile || {}, c = input.companion || {};
  const display_name = String(p.display_name || '').trim(), username = String(p.username || '').trim();
  if (!display_name || display_name.length > 80 || username.length < 3 || username.length > 30) throw new Error('Enter your name and a username between 3 and 30 characters.');
  const dob = String(p.date_of_birth || ''); const birthday = new Date(dob + 'T00:00:00Z'), cutoff = new Date(); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 13);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(birthday.getTime()) || birthday.toISOString().slice(0,10) !== dob || birthday > cutoff || birthday < new Date('1900-01-01')) throw new Error('Enter a valid date of birth. You must be at least 13.');
  const phone = String(p.phone || '').trim(); if (phone && (!/^[+\d\s().-]{7,30}$/.test(phone) || phone.replace(/\D/g,'').length < 7)) throw new Error('Enter a valid phone number or leave it blank.');
  if (!['male','female'].includes(c.gender) || !String(c.name || '').trim() || String(c.name).length > 40) throw new Error('Choose a companion and enter a name up to 40 characters.');
  if (!['calm','warm','curious'].includes(c.personality)) throw new Error('Choose a personality.');
  const height = Number(c.height_scale), pitch = Number(c.voice?.pitch), rate = Number(c.voice?.rate);
  if (!(height >= .9 && height <= 1.1 && pitch >= .6 && pitch <= 1.4 && rate >= .7 && rate <= 1.3)) throw new Error('Appearance or voice settings are outside the supported range.');
  const colors = Object.entries(c.material_colors || {}), morphs = Object.entries(c.morph_targets || {});
  if (colors.length > 100 || morphs.length > 100 || colors.some(([k,v]) => k.length > 200 || !/^#[0-9a-f]{6}$/i.test(String(v))) || morphs.some(([k,v]) => k.length > 200 || typeof v !== 'number' || v < 0 || v > 1)) throw new Error('Invalid appearance settings.');
  return { profile: {display_name,username,date_of_birth:dob,phone}, companion: { name:String(c.name).trim(),gender:c.gender,model_url:ROOT + (c.gender === 'female' ? '3f915913a_ErikaArcher.fbx' : '608211a0f_YBot1.fbx'),personality:c.personality,height_scale:height,material_colors:Object.fromEntries(colors),morph_targets:Object.fromEntries(morphs),voice:{uri:String(c.voice?.uri || '').slice(0,200),pitch,rate},setup_version:1 } };
}