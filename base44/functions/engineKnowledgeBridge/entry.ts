import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function score(entry: any, terms: string[]) {
  const haystack = [entry.source_filename, entry.summary, entry.full_analysis, entry.extracted_code, ...(entry.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
  let value = 0;
  for (const term of terms) {
    if (!term) continue;
    const count = haystack.split(term).length - 1;
    value += Math.min(count, 12);
  }
  if ((entry.knowledge_domain || '') === 'engine_building') value += 5;
  if (entry.is_pinned) value += 3;
  return value;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || '').trim();
    const limit = Math.min(Math.max(Number(body?.limit || 8), 1), 20);
    if (!query) return Response.json({ error: 'query is required' }, { status: 400 });

    const terms = query.toLowerCase().split(/[^a-z0-9_.-]+/).filter(x => x.length > 2).slice(0, 20);
    const entries = await base44.asServiceRole.entities.KnowledgeEntry.list('-created_date', 500);
    const ranked = entries
      .map((entry: any) => ({ entry, score: score(entry, terms) }))
      .filter((x: any) => x.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)
      .map((x: any) => ({
        id: x.entry.id,
        source: x.entry.source_filename,
        score: x.score,
        summary: x.entry.summary,
        analysis: x.entry.full_analysis,
        extracted_code: x.entry.extracted_code,
        tags: x.entry.tags || [],
        domain: x.entry.knowledge_domain
      }));

    return Response.json({
      success: true,
      query,
      source: 'Atom XE project knowledge bridge',
      results: ranked,
      instruction: 'Use these results as project-specific engineering context. Do not claim that reference assets are executable code. Combine them with the current Atom XE implementation and validate changes before applying them.'
    });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});
