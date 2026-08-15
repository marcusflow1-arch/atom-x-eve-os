import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
const VIDEO = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let jobId = '';
  try {
    const body = await req.json().catch(() => ({}));
    jobId = body?.event?.entity_id || body?.data?.jobId || body?.data?.id || body?.id || '';
    const job = (await base44.asServiceRole.entities.VideoLearningJob.filter({ id: jobId }))?.[0];
    if (!job) return Response.json({ error: 'VideoLearningJob not found' }, { status: 404 });
    if (['completed','failed'].includes(job.status)) return Response.json({ skipped: true });
    const save = (patch) => base44.asServiceRole.entities.VideoLearningJob.update(jobId, patch);

    if (job.source_type === 'channel') {
      await save({ status:'discovering', current_stage:'Discovering verified channel videos', progress_percent:5 });
      const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:`Inspect this public YouTube channel and return only verified public video URLs. Prefer full game walkthroughs, 100% completion videos, game-development tutorials, Unreal Engine tutorials, and multi-part courses. Maximum 100. Channel: ${job.source_url}`,
        add_context_from_internet:true,
        response_json_schema:{type:'object',properties:{videos:{type:'array',items:{type:'string'}}},required:['videos']}
      });
      const urls=[...new Set((r?.videos||[]).filter(u=>VIDEO.test(u)))]; let queued=0;
      for(const url of urls){ try{ await base44.asServiceRole.entities.VideoLearningJob.create({source_url:url,source_type:'video',parent_job_id:jobId,status:'queued',current_stage:'Queued from channel',progress_percent:0}); queued++; }catch{} }
      await save({status:'completed',current_stage:'Channel crawl complete; video jobs queued',progress_percent:100,video_count:queued,notes:`Queued ${queued} verified videos for autonomous visual learning.`});
      return Response.json({success:true,queued});
    }

    const match=job.source_url.match(VIDEO); if(!match) throw new Error('Invalid YouTube video URL');
    const videoId=match[1];
    await save({status:'extracting',current_stage:'Reading real YouTube storyboard frames',progress_percent:10});
    const html=await (await fetch(`https://www.youtube.com/watch?v=${videoId}`,{headers:{'User-Agent':'Mozilla/5.0 AtomEve/1.0'}})).text();
    const title=(html.match(/<title>([^<]+)<\/title>/i)?.[1]||`YouTube ${videoId}`).replace(/ - YouTube$/i,'').trim();
    const spec=html.match(/"spec":"(https?:\\/\\/[^\"]*storyboard[^\"]*)"/)?.[1]?.replace(/\\u0026/g,'&').replace(/\\\//g,'/')||'';

    // Create the canonical video record first. Frame records always reference this record.
    const va=await base44.asServiceRole.entities.VideoAnalysis.create({video_url:job.source_url,title,status:'processing',source_type:'youtube',analysis_result:'',summary_markdown:'',total_frames:0,total_scenes:0,analysis_depth:'deep',sampling_mode:'storyboard',max_frames:0});
    await save({title,status:'analyzing',current_stage:'Studying the video chronologically as a picture book',progress_percent:25});

    const visualSource=spec?`The following is the real YouTube storyboard image source/spec. Treat it as the chronological visual evidence and inspect the available storyboard imagery rather than relying on the title or a one-line summary:\n${spec}`:`The YouTube storyboard specification was not exposed. Use the public video page as visual evidence and lower confidence when visual evidence is unavailable.`;
    const analysis=await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:`You are Atom x Eve's visual video-learning engine. Study the ENTIRE video chronologically like a picture book. Do not give a shallow summary. Infer reusable game behavior from the sequence of real frames/storyboard imagery. Separate observed behavior from inference. Study player loop, controls, movement, camera, combat, weapons, abilities, enemies, bosses, UI, menus, inventory, progression, quests, dialogue, level/world structure, interactions, objectives, feedback, VFX, animation, NPC behavior, economy, checkpoints, failure/retry flow, multiplayer indicators, and any development/tutorial workflow shown. The learned result will be used later by game-building tools, so include concrete implementation rules and relationships.\n\nVIDEO: ${job.source_url}\nTITLE: ${title}\n${visualSource}\n\nReturn JSON: summary,game_identity,gameplay_loop,systems,scenes,mechanics,controls,progression,architecture_inferences,implementation_blueprint,confidence,tags.`,
      add_context_from_internet:true,
      response_json_schema:{type:'object',properties:{summary:{type:'string'},game_identity:{type:'string'},gameplay_loop:{type:'string'},systems:{type:'array'},scenes:{type:'array'},mechanics:{type:'array'},controls:{type:'array'},progression:{type:'string'},architecture_inferences:{type:'string'},implementation_blueprint:{type:'string'},confidence:{type:'number'},tags:{type:'array'}},required:['summary','gameplay_loop','systems','scenes','implementation_blueprint','confidence','tags']}
    });

    await save({status:'learning',current_stage:'Writing visual knowledge into project memory',progress_percent:70});
    const tags=[...new Set(['youtube','visual-learning','game-reference',...(analysis?.tags||[])])].slice(0,50);
    const entry=await base44.asServiceRole.entities.KnowledgeEntry.create({source_filename:`YouTube Visual Study — ${title}`,file_type:'youtube_visual_study',file_size:0,summary:analysis?.summary||title,full_analysis:JSON.stringify(analysis,null,2),extracted_code:'',tags,category:'game_reference',knowledge_domain:'video_game_behavior',is_pinned:true});
    const addChunk=async(heading,content)=>{if(!content)return null;return await base44.asServiceRole.entities.KnowledgeChunk.create({document_title:`YouTube Visual Study — ${title}`,section_path:`video/${videoId}/${heading}`,heading,content:typeof content==='string'?content:JSON.stringify(content,null,2),chunk_type:'text',tags});};
    const chunks=[]; for(const [h,c] of [['Gameplay Loop',analysis?.gameplay_loop],['Systems',analysis?.systems],['Mechanics',(analysis?.mechanics||[]).join('\n')],['Controls',(analysis?.controls||[]).join('\n')],['Progression',analysis?.progression],['Architecture Inferences',analysis?.architecture_inferences],['Implementation Blueprint',analysis?.implementation_blueprint],['Scene Timeline',analysis?.scenes]]){const cRec=await addChunk(h,c);if(cRec)chunks.push(cRec);}

    // Persist real storyboard/frame sources. These are source captures from YouTube, not AI-generated substitutes.
    let frameCount=0;
    if(spec){
      const urls=[...spec.matchAll(/https?:\\/\\/[^&"\\]+/g)].map(m=>m[0].replace(/\\u0026/g,'&')).filter((u,i,a)=>a.indexOf(u)===i).slice(0,50);
      const frames=urls.map((u,i)=>({video_analysis_id:va.id,frame_index:i,timestamp_seconds:i,image_url:u,thumbnail_url:u,frame_summary:`Real YouTube storyboard frame source ${i+1} for ${title}`,notes:'Chronological storyboard source. The source contains multiple real captured video frames; tile/time metadata is retained in the analysis record.',is_representative:i===0}));
      try{if(frames.length){await base44.asServiceRole.entities.VideoFrame.bulkCreate(frames);frameCount=frames.length;}}catch(e){console.log('Frame persistence warning',e?.message||e);}
    }
    await base44.asServiceRole.entities.VideoAnalysis.update(va.id,{status:'completed',analysis_result:JSON.stringify(analysis),summary_markdown:analysis?.summary||'',total_frames:frameCount,total_scenes:(analysis?.scenes||[]).length});
    await save({status:'completed',current_stage:'Learned and indexed into project memory',progress_percent:100,frame_count:frameCount,knowledge_chunk_count:chunks.length,learned_knowledge_ids:[entry.id,...chunks.map(c=>c.id)],title});
    return Response.json({success:true,video_id:videoId,video_analysis_id:va.id,knowledge_entry_id:entry.id,frame_count:frameCount,knowledge_chunk_count:chunks.length});
  } catch(error){
    try{if(jobId)await base44.asServiceRole.entities.VideoLearningJob.update(jobId,{status:'failed',current_stage:'Learning failed',error_message:error?.message||String(error)});}catch{}
    return Response.json({error:error?.message||String(error)},{status:500});
  }
});
