import React from 'react';
import { Info } from 'lucide-react';

// Shared banner explaining the knowledge ingestion model + current plan caveats.
export default function KnowledgeStatusBanner() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 flex gap-3">
      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-100/85 leading-relaxed">
        <span className="font-semibold text-blue-200">Knowledge Engine</span> — Base44 ingests external docs
        (Google Docs, files, engine references) into a structured databank used as a contextual
        knowledge layer for game development assistance. This system <em>does not replicate</em> any
        external engine; it acts as a structured knowledge interpreter and assistant layer.
        <div className="mt-1 text-xs text-blue-200/60">
          Google Docs must be shared as <em>"Anyone with the link can view"</em> for ingestion.
        </div>
      </div>
    </div>
  );
}