import React from 'react';
import { Youtube, Sparkles, Package, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function VideoInputPanel({
  url, setUrl, title, setTitle, tags, setTags, notes, setNotes,
  onAnalyze, onPackage, onFull, busy, action, hasAnalysis,
}) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
        <Youtube className="w-5 h-5 text-red-500" /> Video Input
      </h2>
      <p className="text-slate-400 text-sm mb-4">Paste a YouTube URL to begin structured visual analysis.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">YouTube URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-slate-900 border-slate-700"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Custom title (optional)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auto-detected if empty" className="bg-slate-900 border-slate-700" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tags (comma separated)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gameplay, trailer, tutorial" className="bg-slate-900 border-slate-700" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Notes (optional)</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context for this analysis…" className="bg-slate-900 border-slate-700" />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onAnalyze} disabled={busy || !url} className="bg-cyan-600 hover:bg-cyan-700">
            {busy && action === 'analyze' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Video</>}
          </Button>
          <Button onClick={onPackage} disabled={busy || !hasAnalysis} variant="outline" className="border-slate-600 text-slate-200">
            {busy && action === 'package' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Packaging…</> : <><Package className="w-4 h-4 mr-2" /> Generate Frame Package</>}
          </Button>
          <Button onClick={onFull} disabled={busy || !url} className="bg-violet-600 hover:bg-violet-700">
            {busy && action === 'full' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running pipeline…</> : <><Layers className="w-4 h-4 mr-2" /> Run Full Pipeline</>}
          </Button>
        </div>
      </div>
    </section>
  );
}