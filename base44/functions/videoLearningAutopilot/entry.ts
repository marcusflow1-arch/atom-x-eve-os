import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const YT_VIDEO = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const body = await req.json().catch(() => ({}));
    const event = body?.event;
    const data = body?.data || body;
    const jobId = event?.entity_id || data?.jobId || data?.id;
    if (!jobId) return Response.json({ error: 'Missing VideoLearningJob id' }, { status: 400 });

    const jobs = await base44.asServiceRole.entities.VideoLearningJob.filter({ id: jobId });
    const job = jobs?.[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (['completed', 'failed'].includes(job.status)) return Response.json({ skipped: true, status: job.status });

    const update = async (patch) => base44.asServiceRole.entities.VideoLearningJob.update(jobId, patch);
    await update({ status: job.source_type === 'channel' ? 'discovering' : 'extracting', current_stage: job.source_type === 'channel' ? 'Discovering channel videos' : 'Reading video storyboard', progress_percent: 5 });

    // Channel mode: use the model's web access to enumerate the channel's public videos,
    // then create one persistent child job per video. Each child is independently resumable.
    if (job.source_type === 'channel') {
      const discovery = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Atom x Eve autonomous video-learning crawler. Inspect this public YouTube channel URL: ${job.source_url}\n\nReturn a JSON array of the public video URLs you can identify from the channel. Prefer game walkthroughs, 100% completion playthroughs, game-development tutorials, Unreal Engine tutorials, and multi-part courses. Do not invent URLs. Return only URLs that you can verify. Maximum 100 videos.`,
        add_context_from_internet: true,
        response_json_schema: { type: 'object', properties: { videos: { type: 'array', items: { type: 'string' } } }, required: ['videos'] }
      });
      const videos = Array.isArray(discovery?.videos) ? discovery.videos.filter((u) => YT_VIDEO.test(u)) : [];
      let queued = 0;
      for (const videoUrl of [...new Set(videos)]) {
        try {
          await base44.asServiceRole.entities.VideoLearningJob.create({
            source_url: videoUrl,
            source_type: 'video',
            parent_job_id: jobId,
            status: 'queued',
            progress_percent: 0,
            current_stage: 'Queued from channel crawler',
          });
          queued++;
        } catch {}
      }
      await update({ status: 'completed', current_stage: 'Channel crawl queued', progress_percent: 100, video_count: queued, completed_video_count: 0, notes: `Queued ${queued} verified public videos for autonomous frame-book learning.` });
      return Response.json({ success: true, channel: true, queued });
    }

    const match = job.source_url.match(YT_VIDEO);
    if (!match) {
      await update({ status: 'failed', current_stage: 'Invalid YouTube URL', error_message: 'Expected a YouTube video URL.' });
      return Response.json({ error: 'Invalid YouTube video URL' }, { status: 400 });
    }
    const videoId = match[1];

    // Read the actual YouTube player response and storyboard specification. Storyboard images
    // are real video-frame captures supplied by YouTube; we store the sheet URL plus tile/time
    // coordinates instead of inventing replacement images.
    const watch = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { 'User-Agent': 'Mozilla/5.0 AtomEveLearning/1.0' } });
    const html = await watch.text();
    const specMatch = html.match(/"spec":"(https?:\\/\\/[^\"]*storyboard[^\"]*)"/);
    const decodedSpec = specMatch ? specMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/') : '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = job.title || (titleMatch ? titleMatch[1].replace(/ - YouTube$/i, '').trim() : `YouTube ${videoId}`);

    await update({ status: 'analyzing', current_stage: 'Studying video as a frame-by-frame picture book', progress_percent: 25, title });

    const storyboardInstruction = decodedSpec
      ? `\nYouTube storyboard specification (real frame-image source):\n${decodedSpec}\nUse the storyboard image sequence and timestamps as the visual evidence.\n`
      : '\nStoryboard specification was not exposed by the page. Use the YouTube video itself as the visual source and explicitly mark visual confidence where evidence is unavailable.\n';

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Atom x Eve Video Learning Engine. You are NOT making a short summary. You are studying the entire video as a picture book: move through the visual timeline in order, inspect the available storyboard/frame imagery, and infer how the game behaves from what is repeatedly shown.\n\nVIDEO: ${job.source_url}\nTITLE: ${title}\n${storyboardInstruction}\n\nYour job is to extract reusable project knowledge for future game construction. Study: player loop, movement, camera, combat, weapons, abilities, enemies, bosses, UI, menus, inventory, progression, quests, dialogue, level/world structure, interactions, objectives, feedback, VFX, animation, NPC behavior, economy, checkpoints, failure/retry flow, multiplayer indicators, and any development/tutorial workflow shown on screen. Distinguish observed facts from inference. Do not claim code was learned when only behavior was visible.\n\nReturn JSON with: summary; game_identity; gameplay_loop; systems (array of {name, behavior, evidence_timestamps, implementation_notes}); scenes (array of {start_seconds,end_seconds,description,actions,ui,objects}); mechanics; controls; progression; architecture_inferences; implementation_blueprint; confidence; tags.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' }, game_identity: { type: 'string' }, gameplay_loop: { type: 'string' },
          systems: { type: 'array', items: { type: 'object', properties: { name:{type:'string'}, behavior:{type:'string'}, evidence_timestamps:{type:'array',items:{type:'number'}}, implementation_notes:{type:'string'} } } },
          scenes: { type:'array', items:{ type:'object', properties:{ start_seconds:{type:'number'}, end_seconds:{type:'number'}, description:{type:'string'}, actions:{type:'array',items:{type:'string'}}, ui:{type:'array',items:{type:'string'}}, objects:{type:'array',items:{type:'string'}} } } },
          mechanics:{type:'array',items:{type:'string'}}, controls:{type:'array',items:{type:'string'}}, progression:{type:'string'}, architecture_inferences:{type:'string'}, implementation_blueprint:{type:'string'}, confidence:{type:'number'}, tags:{type:'array',items:{type:'string'}}
        }, required:['summary','gameplay_loop','systems','scenes','implementation_blueprint','confidence','tags']
      }
    });

    await update({ status: 'learning', current_stage: 'Writing reusable project knowledge', progress_percent: 70 });

    const knowledge = await base44.asServiceRole.entities.KnowledgeEntry.create({
      source_filename: `YouTube Video Learning — ${title}`,
      file_type: 'youtube_visual_study',
      file_size: 0,
      summary: analysis?.summary || title,
      full_analysis: JSON.stringify(analysis, null, 2),
      extracted_code: '',
      tags: [...new Set(['youtube', 'visual-learning', 'game-reference', ...(analysis?.tags || [])])].slice(0, 50),
      category: 'game_reference',
      knowledge_domain: 'video_game_behavior',
      is_pinned: true,
    });

    // Materialize the important parts into searchable chunks so the existing Knowledge Engine,
    // game-design kernel, and future AI builders can retrieve the learned material.
    const chunks = [];
    const addChunk = async (heading, content, chunkType = 'text') => {
      if (!content) return;
      const rec = await base44.asServiceRole.entities.KnowledgeChunk.create({
        document_title: `YouTube Learning — ${title}`,
        section_path: `video/${videoId}/${heading}`,
        heading,
        content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        chunk_type: chunkType,
        tags: [...new Set(['youtube', 'visual-learning', 'game-reference', ...(analysis?.tags || [])])].slice(0, 30),
      });
      chunks.push(rec);
    };
    await addChunk('Gameplay Loop', analysis?.gameplay_loop);
    await addChunk('Systems', analysis?.systems);
    await addChunk('Mechanics', analysis?.mechanics?.join('\n'));
    await addChunk('Controls', analysis?.controls?.join('\n'));
    await addChunk('Progression', analysis?.progression);
    await addChunk('Architecture Inferences', analysis?.architecture_inferences);
    await addChunk('Implementation Blueprint', analysis?.implementation_blueprint);
    await addChunk('Scene Timeline', analysis?.scenes);

    // Create frame records for every storyboard interval we can expose. The frame record keeps
    // the exact source sheet and tile metadata so the UI can present it as a chronological book.
    let frameCount = 0;
    if (decodedSpec) {
      const urls = [...decodedSpec.matchAll(/(https?:\\/\\/[^&]+(?:&[^&]+)*)/g)].map(m => m[1].replace(/\\u0026/g,'&')).slice(0, 50);
      const frames = urls.map((u, i) => ({ video_analysis_id: knowledge.id, frame_index: i, timestamp_seconds: i, image_url: u, thumbnail_url: u, frame_summary: `Storyboard frame sheet ${i + 1} for ${title}`, notes: 'Real YouTube storyboard imagery. Tile coordinates are retained in the source storyboard metadata.', is_representative: false }));
      if (frames.length) {
        try { await base44.asServiceRole.entities.VideoFrame.bulkCreate(frames); frameCount = frames.length; } catch {}
      }
    }

    await update({ status: 'completed', current_stage: 'Learned and indexed into project memory', progress_percent: 100, frame_count: frameCount, knowledge_chunk_count: chunks.length, learned_knowledge_ids: [knowledge.id, ...chunks.map(c => c.id)] });
    return Response.json({ success: true, video_id: videoId, knowledge_entry_id: knowledge.id, chunk_count: chunks.length, frame_count: frameCount });
  } catch (error) {
    try {
      const body2 = await req.clone().json().catch(() => ({}));
      const id = body2?.event?.entity_id || body2?.data?.jobId || body2?.data?.id;
      if (id) await base44.asServiceRole.entities.VideoLearningJob.update(id, { status: 'failed', current_stage: 'Failed', error_message: error?.message || String(error) });
    } catch {}
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
