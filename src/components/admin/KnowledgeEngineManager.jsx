import React from 'react';
import { Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleDocsImportTab   from './knowledge/GoogleDocsImportTab';
import EngineFileImportTab   from './knowledge/EngineFileImportTab';
import KnowledgeLibraryTab   from './knowledge/KnowledgeLibraryTab';
import SystemGraphViewerTab  from './knowledge/SystemGraphViewerTab';
import KnowledgeSearchTab    from './knowledge/KnowledgeSearchTab';
import WebResearchTab        from './knowledge/WebResearchTab';
import LearningLogsTab       from './knowledge/LearningLogsTab';

// ─── Knowledge Engine ─────────────────────────────────────────────────────
// Top-level admin section. Hosts six functional tabs:
//   • Google Docs Import
//   • File Upload (Engine Data)
//   • Knowledge Library
//   • System Graph Viewer
//   • Search Knowledge Base
//   • Web Research
//   • AI Learning Logs
//
// Philosophy: this is a structured knowledge interpreter and assistant layer.
// It does NOT replicate or replace any external engine.
export default function KnowledgeEngineManager() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Knowledge Engine</h1>
          <p className="text-slate-400 text-sm">Structured knowledge interpreter and assistant layer for game development.</p>
        </div>
      </div>

      <Tabs defaultValue="gdocs" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800 flex-wrap h-auto">
          <TabsTrigger value="gdocs">Google Docs Import</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsTrigger value="library">Knowledge Library</TabsTrigger>
          <TabsTrigger value="graph">System Graph</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="web">Web Research</TabsTrigger>
          <TabsTrigger value="logs">Learning Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="gdocs">   <GoogleDocsImportTab />   </TabsContent>
        <TabsContent value="file">    <EngineFileImportTab />   </TabsContent>
        <TabsContent value="library"> <KnowledgeLibraryTab />   </TabsContent>
        <TabsContent value="graph">   <SystemGraphViewerTab />  </TabsContent>
        <TabsContent value="search">  <KnowledgeSearchTab />    </TabsContent>
        <TabsContent value="web">     <WebResearchTab />        </TabsContent>
        <TabsContent value="logs">    <LearningLogsTab />       </TabsContent>
      </Tabs>
    </div>
  );
}