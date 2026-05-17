import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Loader2, CheckCircle2, ExternalLink, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { researchEngineTopic, parseContentWithLLM, persistParsedDocument } from './knowledgeIngestService';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { showSuccess, showError } from '@/components/error/ErrorToast';

// Web research layer: structured Unreal-Engine-focused lookups via InvokeLLM
// with add_context_from_internet. Verified results can be saved into the
// databank like any other document.
export default function WebResearchTab({ onIngested }) {
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState(false);
  const [result, setResult] = useState(null);

  const runResearch = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await researchEngineTopic(topic.trim());
      setResult(res);
    } catch (err) {
      showError(err, 'Web Research');
    } finally {
      setBusy(false);
    }
  };

  const saveToDatabank = async () => {
    if (!result) return;
    setSavingId(true);
    try {
      // Re-parse the synthesized research as a structured doc for consistent storage.
      const text = [
        `# ${topic}`,
        '',
        '## Overview',
        result.overview || '',
        '',
        '## Key APIs',
        ...(result.key_apis || []).map((a) => `- ${a}`),
        '',
        '## Usage Notes',
        result.usage_notes || '',
        '',
        '## Sources',
        ...(result.sources || []).map((s) => `- ${s.title}: ${s.url}`),
      ].join('\n');

      const parsed = await parseContentWithLLM(text, { sourceType: 'web_research', fileType: 'md' });
      const saved = await persistParsedDocument({
        documentMeta: {
          title:       `Research: ${topic}`,
          source_type: 'web_research',
          source_url:  result.sources?.[0]?.url || '',
          source_id:   topic,
          file_type:   'md',
          raw_content: text,
          status:      'indexed',
        },
        parsed,
      });
      showSuccess(`Saved research as "${saved.doc.title}".`);
      onIngested && onIngested(saved);
    } catch (err) {
      showError(err, 'Save Research');
    } finally {
      setSavingId(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-6 h-6 text-sky-400" />
          <h2 className="text-2xl font-bold">Engine Knowledge Augmentation</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Look up Unreal Engine topics from official documentation and developer guides. Verified
          findings can be saved into the knowledge databank and cross-referenced with uploaded files.
        </p>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder='e.g. "UAbilitySystemComponent overview" or "GameplayCue replication"'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-slate-800 border-slate-700 flex-1"
            disabled={busy}
          />
          <Button onClick={runResearch} disabled={busy || !topic.trim()} className="bg-sky-600 hover:bg-sky-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
            Research
          </Button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mt-4"
          >
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Overview</div>
              <p className="text-sm text-slate-200 leading-relaxed">{result.overview}</p>
            </div>

            {result.key_apis?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Key APIs / Classes</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.key_apis.map((a) => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded bg-slate-700/70 border border-slate-600/50 text-slate-200">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {result.usage_notes && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Usage Notes</div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{result.usage_notes}</p>
              </div>
            )}

            {result.sources?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Sources</div>
                <div className="space-y-1">
                  {result.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer"
                       className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {s.title || s.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={saveToDatabank} disabled={savingId} className="bg-emerald-600 hover:bg-emerald-700">
              {savingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save to Knowledge Databank
            </Button>
          </motion.div>
        )}

        {!result && !busy && (
          <p className="text-xs text-slate-500 italic">Research runs use the InvokeLLM integration with internet context (Gemini Flash).</p>
        )}
      </section>
    </div>
  );
}