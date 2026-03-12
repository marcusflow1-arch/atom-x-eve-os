import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Video, Loader2, PlaySquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import ReactMarkdown from 'react-markdown';

export default function VideoAnalyzer() {
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/')) {
        showError('Please upload a valid video file.');
        return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
      showSuccess('Video uploaded successfully!');
    } catch (error) {
      showError(error, 'Upload Video');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!videoUrl) {
      showError('Please provide a video URL or upload a video.');
      return;
    }

    setAnalyzing(true);
    setAnalysisResult('');
    try {
      const prompt = `Analyze this video to understand the environment layout and map structure. Break down the visual aesthetics, architectural style, lighting, key landmarks, and spatial flow. Provide a detailed summary that could be used as a blueprint to recreate this map in a 3D engine.`;
      
      const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt + (isYouTube ? `\n\nVideo Link: ${videoUrl}` : ''),
        add_context_from_internet: isYouTube,
        file_urls: !isYouTube ? [videoUrl] : undefined,
        model: 'gemini_3_pro' // Use Gemini 1.5 Pro which natively supports video processing
      });

      setAnalysisResult(result);
      showSuccess('Video analysis complete!');
    } catch (error) {
      showError(error, 'Analyze Video');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Video className="w-6 h-6 text-cyan-500" />
          Environment Video Analyzer
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload a local video or provide a YouTube link to analyze map structures, layouts, and visual aesthetics frame-by-frame.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-fit">
          <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-slate-400" />
            Provide Video Source
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">YouTube URL or Direct Link</label>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-500">Or</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Upload Local Video</label>
              <label className="relative cursor-pointer block w-full">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all ${uploading ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80'}`}>
                  {uploading ? (
                    <><Loader2 className="w-5 h-5 text-cyan-500 animate-spin" /><span className="text-slate-300">Uploading Video...</span></>
                  ) : (
                    <><Upload className="w-5 h-5 text-slate-400" /><span className="text-slate-300">Choose Video File</span></>
                  )}
                </div>
              </label>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || (!videoUrl && !uploading)}
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-6 rounded-xl"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Video Environment...</>
              ) : (
                <><PlaySquare className="w-5 h-5 mr-2" /> Start Frame-by-Frame Analysis</>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col min-h-[400px]">
          <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Analysis Results
          </h3>
          
          <div className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl p-4 overflow-y-auto custom-scrollbar">
            {analyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="animate-pulse">Processing video frames and analyzing environment layout...</p>
              </div>
            ) : analysisResult ? (
              <div className="prose prose-invert max-w-none text-sm text-slate-300">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <Video className="w-12 h-12 mb-3" />
                <p>Analysis output will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}