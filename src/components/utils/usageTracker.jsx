import { base44 } from '@/api/base44Client';

export async function trackPageUsage(pageName, filePath) {
  if (!pageName) return;
  const name = String(pageName);
  const type = 'page';
  const fp = filePath || `pages/${name}`;
  const existing = await base44.entities.UIUsage.filter({ name, type }, '-updated_date', 1);
  if (existing && existing.length) {
    const rec = existing[0];
    await base44.entities.UIUsage.update(rec.id, {
      use_count: (rec.use_count || 0) + 1,
      last_used_date: new Date().toISOString(),
      file_path: rec.file_path || fp,
    });
  } else {
    await base44.entities.UIUsage.create({
      name,
      type,
      file_path: fp,
      use_count: 1,
      last_used_date: new Date().toISOString(),
    });
  }
}

export async function trackComponentUsage(componentName, filePath) {
  if (!componentName || !filePath) return;
  const name = String(componentName);
  const type = 'component';
  const existing = await base44.entities.UIUsage.filter({ name, type }, '-updated_date', 1);
  if (existing && existing.length) {
    const rec = existing[0];
    await base44.entities.UIUsage.update(rec.id, {
      use_count: (rec.use_count || 0) + 1,
      last_used_date: new Date().toISOString(),
      file_path,
    });
  } else {
    await base44.entities.UIUsage.create({
      name,
      type,
      file_path,
      use_count: 1,
      last_used_date: new Date().toISOString(),
    });
  }
}