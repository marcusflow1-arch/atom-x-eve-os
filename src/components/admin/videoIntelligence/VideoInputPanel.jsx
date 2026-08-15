import React from 'react';
import { Youtube, Sparkles, Package, Layers, Loader2, Brain, Database } from 'lucide-react';
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
        <Brain className="w-5 h-5 text-cyan-400" /> Video Learning Input
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Give the knowledge engine a YouTube walkthrough, game tutorial, or Unreal Engine lesson. The pipeline analyzes the visual timeline, scenes, actions, on-screen text, captions, and entities, then stores the structured knowledge in the project database.
      </p>
      <div className="mb-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
          <Database className="w-4 h-4" /> Persistent Learning Memory
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Every completed analysis is stored as reusable project knowledge with scenes, frame records, transcript data, OCR, detected objects/entities, actions, summaries, and exported artifacts.
        </p>
      </div>
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
            <label className="block text-sm text-slate-400 mb-1">Knowledge title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unreal Engine 5 Character Tutorial" className="bg-slate-900 border-slate-700" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Knowledge tags</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gameplay, walkthrough, Unreal Engine" className="bg-slate-900 border-slate-700" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Learning context (optional)</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What should the knowledge engine pay special attention to? Example: combat loop, inventory, quest flow, character controller, level creation…" className="bg-slate-900 border-slate-700" />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onAnalyze} disabled={busy || !url} className="bg-cyan-600 hover:bg-cyan-700">
            {busy && action === 'analyze' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Learning…</> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze & Learn</>}
          </Button>
          <Button onClick={onPackage} disabled={busy || !hasAnalysis} variant="outline" className="border-slate-600 text-slate-200">
            {busy && action === 'package' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Packaging…</> : <><Package className="w-4 h-4 mr-2" /> Build Frame Package</>}
          </Button>
          <Button onClick={onFull} disabled={busy || !url} className="bg-violet-600 hover:bg-violet-700">
            {busy && action === 'full' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Learning pipeline…</> : <><Layers className="w-4 h-4 mr-2" /> Full Learn + Frame Pipeline</>}
          </Button>
        </div>
      </div>
    </section>
  );
}
