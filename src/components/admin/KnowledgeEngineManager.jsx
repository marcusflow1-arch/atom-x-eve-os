import React from 'react';
import { Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleDocsImportTab from './knowledge/GoogleDocsImportTab';
import EngineFileImportTab from './knowledge/EngineFileImportTab';
import KnowledgeLibraryTab from './knowledge/KnowledgeLibraryTab';
import SystemGraphViewerTab from './knowledge/SystemGraphViewerTab';
import KnowledgeSearchTab from './knowledge/KnowledgeSearchTab';
import WebResearchTab from './knowledge/WebResearchTab';
import UnrealDocsIndexerTab from './knowledge/UnrealDocsIndexerTab';
import VectorMemoryTab from './knowledge/VectorMemoryTab';
import UE5TranslatorTab from './knowledge/UE5TranslatorTab';
import BlueprintGeneratorTab from './knowledge/BlueprintGeneratorTab';
import GASDesignerTab from './knowledge/GASDesignerTab';
import GameDesignOSTab from './knowledge/GameDesignOSTab';
import AutoSystemBuilderTab from './knowledge/AutoSystemBuilderTab';
import LearningLogsTab from './knowledge/LearningLogsTab';

export default function KnowledgeEngineManager() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold">Knowledge Engine</h1><p className="text-slate-400 text-sm">Structured knowledge interpreter, retrieval layer, and game-development learning system.</p></div>
      </div>
      <Tabs defaultValue="auto" className="space-y-4">
        <TabsList className="bg-transparent border-0">
          <TabsTrigger value="auto">⚙️ Auto Builder</TabsTrigger>
          <TabsTrigger value="gdocs">Google Docs Import</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsTrigger value="library">Knowledge Library</TabsTrigger>
          <TabsTrigger value="graph">System Graph</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="web">Web Research</TabsTrigger>
          <TabsTrigger value="unreal">Unreal Docs</TabsTrigger>
          <TabsTrigger value="vector">Vector Memory</TabsTrigger>
          <TabsTrigger value="ue5">UE5 Translator</TabsTrigger>
          <TabsTrigger value="ue5bp">Blueprint Gen</TabsTrigger>
          <TabsTrigger value="gas">GAS Specialist</TabsTrigger>
          <TabsTrigger value="os">OS Kernel</TabsTrigger>
          <TabsTrigger value="logs">Learning Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="auto"><AutoSystemBuilderTab /></TabsContent>
        <TabsContent value="gdocs"><GoogleDocsImportTab /></TabsContent>
        <TabsContent value="file"><EngineFileImportTab /></TabsContent>
        <TabsContent value="library"><KnowledgeLibraryTab /></TabsContent>
        <TabsContent value="graph"><SystemGraphViewerTab /></TabsContent>
        <TabsContent value="search"><KnowledgeSearchTab /></TabsContent>
        <TabsContent value="web"><WebResearchTab /></TabsContent>
        <TabsContent value="unreal"><UnrealDocsIndexerTab /></TabsContent>
        <TabsContent value="vector"><VectorMemoryTab /></TabsContent>
        <TabsContent value="ue5"><UE5TranslatorTab /></TabsContent>
        <TabsContent value="ue5bp"><BlueprintGeneratorTab /></TabsContent>
        <TabsContent value="gas"><GASDesignerTab /></TabsContent>
        <TabsContent value="os"><GameDesignOSTab /></TabsContent>
        <TabsContent value="logs"><LearningLogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
