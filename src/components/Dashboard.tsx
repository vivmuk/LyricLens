'use client';


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LyricSegment, VeniceModel } from '@/types';
import { SegmentCard } from './SegmentCard';
import { Wand2, Music, Settings2, Loader2, AlertCircle, Film, Key, Download } from 'lucide-react';
import JSZip from 'jszip';

const STYLES = [
  'Cinematic',
  'Cyberpunk',
  'Watercolor',
  'Photorealistic',
  'Anime',
  'Noir',
  'Vaporwave',
  '3D Render',
  'Oil Painting'
];

const VIDEO_MODELS = [
  // Image-to-Video Models
  {
    id: 'veo3-fast-image-to-video',
    name: 'Veo 3 Fast',
    durations: ['4s', '8s'],
    resolutions: ['720p', '1080p'],
    defaultDuration: '8s',
    defaultResolution: '720p'
  },
  {
    id: 'veo3-full-image-to-video',
    name: 'Veo 3 Full',
    durations: ['4s', '8s'],
    resolutions: ['720p', '1080p'],
    defaultDuration: '8s',
    defaultResolution: '720p'
  },
  {
    id: 'veo3.1-fast-image-to-video',
    name: 'Veo 3.1 Fast',
    durations: ['4s', '8s'],
    resolutions: ['720p', '1080p'],
    defaultDuration: '8s',
    defaultResolution: '720p'
  },
  {
    id: 'veo3.1-full-image-to-video',
    name: 'Veo 3.1 Full',
    durations: ['4s', '8s'],
    resolutions: ['720p', '1080p'],
    defaultDuration: '8s',
    defaultResolution: '720p'
  },
  {
    id: 'sora-2-image-to-video',
    name: 'Sora 2',
    durations: ['4s', '8s', '12s'],
    resolutions: ['720p'],
    defaultDuration: '4s',
    defaultResolution: '720p'
  },
  {
    id: 'sora-2-pro-image-to-video',
    name: 'Sora 2 Pro',
    durations: ['4s', '8s', '12s'],
    resolutions: ['720p', '1080p'],
    defaultDuration: '4s',
    defaultResolution: '1080p'
  },
  {
    id: 'wan-2.5-preview-image-to-video',
    name: 'Wan 2.5 Preview',
    durations: ['5s'],
    resolutions: ['480p'],
    defaultDuration: '5s',
    defaultResolution: '480p'
  },
  {
    id: 'wan-2.1-pro-image-to-video',
    name: 'Wan 2.1 Pro',
    durations: ['6s'],
    resolutions: ['480p'],
    defaultDuration: '6s',
    defaultResolution: '480p'
  },
  {
    id: 'kling-2.6-pro-image-to-video',
    name: 'Kling 2.6 Pro',
    durations: ['5s', '10s'],
    resolutions: ['720p', '1080p'],
    defaultDuration: '5s',
    defaultResolution: '1080p'
  },
  {
    id: 'ltx-2-fast-image-to-video',
    name: 'LTX 2 Fast',
    durations: ['6s', '10s'],
    resolutions: ['720p'],
    defaultDuration: '6s',
    defaultResolution: '720p'
  },
  {
    id: 'ltx-2-full-image-to-video',
    name: 'LTX 2 Full',
    durations: ['6s', '10s'],
    resolutions: ['720p'],
    defaultDuration: '6s',
    defaultResolution: '720p'
  },
  {
    id: 'longcat-image-to-video',
    name: 'Longcat',
    durations: ['5s'],
    resolutions: ['720p'],
    defaultDuration: '5s',
    defaultResolution: '720p'
  },
  {
    id: 'ovi-image-to-video',
    name: 'Ovi',
    durations: ['5s'],
    resolutions: ['720p'],
    defaultDuration: '5s',
    defaultResolution: '720p'
  },
];

export default function Dashboard() {
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState(STYLES[0]);
  const [segments, setSegments] = useState<LyricSegment[]>([]);
  const [models, setModels] = useState<VeniceModel[]>([]);
  const [textModel, setTextModel] = useState('gemini-3-flash-preview');
  const [imageModel, setImageModel] = useState('nano-banana-pro');
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
  const [videoDuration, setVideoDuration] = useState(VIDEO_MODELS[0].defaultDuration);
  const [videoResolution, setVideoResolution] = useState(VIDEO_MODELS[0].defaultResolution);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('venice_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('venice_api_key', apiKey);
      fetchModels();
    }
  }, [apiKey]);

  // Update defaults when video model changes
  useEffect(() => {
    const model = VIDEO_MODELS.find(m => m.id === videoModel);
    if (model) {
      setVideoDuration(model.defaultDuration);
      setVideoResolution(model.defaultResolution);
    }
  }, [videoModel]);

  const fetchModels = async () => {
    try {
      // Fetch both text and image models
      if (!apiKey) return;

      const config = { headers: { 'x-venice-api-key': apiKey } };

      const [textResponse, imageResponse] = await Promise.all([
        axios.get('/api/models?type=text', config),
        axios.get('/api/models?type=image', config)
      ]);

      const textModelsData = textResponse.data.data || [];
      const imageModelsData = imageResponse.data.data || [];

      setModels([...textModelsData, ...imageModelsData]);
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  };

  const textModels = models.filter(m => m.type === 'text');
  const imageModels = models.filter(m => m.type === 'image');

  const handleOrchestrate = async () => {
    if (!lyrics.trim()) return;
    setIsOrchestrating(true);
    setError(null);
    setSegments([]);

    try {
      const response = await axios.post('/api/orchestrate', {
        lyrics,
        style,
        modelId: textModel
      }, {
        headers: { 'x-venice-api-key': apiKey }
      });

      const newSegments = response.data.segments.map((s: any, i: number) => ({
        id: crypto.randomUUID(),
        text: s.text,
        duration: 10,
        visualPrompt: s.visualPrompt,
        motionPrompt: s.motionPrompt,
        status: 'pending'
      }));

      setSegments(newSegments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process lyrics');
    } finally {
      setIsOrchestrating(false);
    }
  };

  const generateImage = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    updateSegmentStatus(segmentId, 'generating_image');

    try {
      const response = await axios.post('/api/generate-image', {
        prompt: segment.visualPrompt,
        style,
        modelId: imageModel
      }, {
        headers: { 'x-venice-api-key': apiKey }
      });

      updateSegment(segmentId, {
        imageUrl: response.data.imageUrl,
        status: 'image_complete'
      });
    } catch (err) {
      console.error(err);
      updateSegmentStatus(segmentId, 'error');
    }
  };

  const generateVideo = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segment.imageUrl) return;

    updateSegmentStatus(segmentId, 'generating_video');

    try {
      const response = await axios.post('/api/generate-video', {
        imageUrl: segment.imageUrl,
        motionPrompt: segment.motionPrompt,
        modelId: videoModel,
        duration: videoDuration,
        resolution: videoResolution
      }, {
        headers: { 'x-venice-api-key': apiKey }
      });

      updateSegment(segmentId, {
        videoUrl: response.data.videoUrl,
        status: 'complete'
      });
    } catch (err) {
      console.error(err);
      // Don't set error state to 'error' if it's just video failure, keep image
      // But maybe show a toast? For now just log and revert status
      updateSegment(segmentId, { status: 'image_complete', error: 'Video generation failed' });
    }
  };

  const updateSegmentStatus = (id: string, status: LyricSegment['status']) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const updateSegment = (id: string, updates: Partial<LyricSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    const folderName = `lyrics-lens-project-${Date.now()}`;
    const folder = zip.folder(folderName);

    if (!folder) return;

    // 1. Create a text file with all prompts
    const promptText = segments.map((s, i) =>
      `Scene ${i + 1} (${s.duration}s)\n` +
      `Lyrics: "${s.text}"\n` +
      `Visual Prompt: ${s.visualPrompt}\n` +
      `Motion Prompt: ${s.motionPrompt}\n` +
      `----------------------------------------\n`
    ).join('\n');

    folder.file("prompts.txt", promptText);

    // 2. Add Images and Videos
    const promises = segments.map(async (s, i) => {
      const index = i + 1;

      // Save Image
      if (s.imageUrl) {
        try {
          const response = await fetch(s.imageUrl);
          const blob = await response.blob();
          folder.file(`scene-${index}-image.webp`, blob); // Assuming webp from Venice
        } catch (e) {
          console.error(`Failed to download image for scene ${index}`, e);
        }
      }

      // Save Video
      if (s.videoUrl) {
        try {
          // Check if it's a data URL or remote URL
          if (s.videoUrl.startsWith('data:')) {
            const base64Data = s.videoUrl.split(',')[1];
            folder.file(`scene-${index}-video.mp4`, base64Data, { base64: true });
          } else {
            const response = await fetch(s.videoUrl);
            const blob = await response.blob();
            folder.file(`scene-${index}-video.mp4`, blob);
          }
        } catch (e) {
          console.error(`Failed to download video for scene ${index}`, e);
        }
      }
    });

    await Promise.all(promises);

    // 3. Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateAllImages = () => {
    segments.forEach(s => {
      if (!s.imageUrl) generateImage(s.id);
    });
  };

  const handleUpdateVisualPrompt = (id: string, newPrompt: string) => {
    updateSegment(id, { visualPrompt: newPrompt });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar / Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings2 className="text-purple-500" /> Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Venice API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your Venice API Key"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 pl-9 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <Key size={14} className="absolute left-3 top-2.5 text-neutral-500" />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Key is stored locally in your browser.
              </p>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Text Orchestrator Model</label>
              <select
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {textModels.length > 0 ? textModels.map(m => (
                  <option key={m.id} value={m.id}>{m.model_spec?.name || m.id}</option>
                )) : <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Image Generation Model</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {imageModels.length > 0 ? imageModels.map(m => (
                  <option key={m.id} value={m.id}>{m.model_spec?.name || m.id}</option>
                )) : <option value="qwen-image">qwen-image</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Video Generation Model</label>
              <select
                value={videoModel}
                onChange={(e) => setVideoModel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {VIDEO_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Duration</label>
                <select
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {VIDEO_MODELS.find(m => m.id === videoModel)?.durations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  )) || <option value="5s">5s</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Resolution</label>
                <select
                  value={videoResolution}
                  onChange={(e) => setVideoResolution(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {VIDEO_MODELS.find(m => m.id === videoModel)?.resolutions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  )) || <option value="720p">720p</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Visual Style</label>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-2 py-1.5 text-xs rounded-md transition-all ${style === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Music className="text-pink-500" /> Lyrics
          </h2>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste your song lyrics here..."
            className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-neutral-300 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
          />
          <button
            onClick={handleOrchestrate}
            disabled={isOrchestrating || !lyrics.trim()}
            className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {isOrchestrating ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {isOrchestrating ? 'Orchestrating...' : 'Orchestrate Video'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content / Timeline */}
      <div className="lg:col-span-8 space-y-6">
        {segments.length > 0 ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Scene Timeline</h2>
              <button
                onClick={generateAllImages}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
                title="Generate images for all empty segments"
              >
                <Wand2 className="inline w-4 h-4 mr-2" />
                Generate All Images
              </button>
              <button
                onClick={handleDownloadProject}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Download all assets and prompts"
              >
                <Download className="w-4 h-4" />
                Download Project
              </button>
            </div>
            <div className="space-y-4">
              {segments.map((segment, index) => (
                <SegmentCard
                  key={segment.id}
                  segment={segment}
                  index={index}
                  onRegenerateImage={generateImage}
                  onGenerateVideo={generateVideo}
                  onUpdateVisualPrompt={handleUpdateVisualPrompt}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/30 rounded-3xl border-2 border-dashed border-neutral-800">
            <Film size={48} className="mb-4 opacity-20" />
            <p>Enter lyrics and orchestrate to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}


