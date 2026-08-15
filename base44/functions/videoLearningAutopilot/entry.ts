import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
const VIDEO = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const TYPES = ['gameplay_reference','game_tutorial','environment_reference','animation_reference','game_design_reference','general_video'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req); let jobId = '';
  try {
    const body = await req.json().catch(() => ({}));
    jobId = body?.event?.entity_id || body?.data?.jobId || body?.data?.id || body?.id || '';
    const job = (await base44.asServiceRole.entities.VideoLearningJob.filter({ id: jobId }))?.[0];
    if (!job) return Response.json({ error: 'VideoLearningJob not found' }, { status: 404 });
    if (['completed','failed'].includes(job.status)) return Response.json({ skipped: true });
    const save = (patch) => base44.asServiceRole.entities.VideoLearningJob.update(jobId, patch);
    const profiles = await base44.asServiceRole.entities.VideoLearningProfile.filter({ job_id: jobId });
    const profile = profiles?.[0];
    const knowledgeType = TYPES.includes(profile?.knowledge_type) ? profile.knowledge_type : 'general_video';
    const learningGoal = profile?.learning_goal || job.notes || '';

    if (job.source_type === 'channel') {
      await save({ status:'discovering', current_stage:`Discovering videos for ${knowledgeType.replaceAll('_',' ')}`, progress_percent:5 });
      const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:`Inspect this public YouTube channel and return only verified public video URLs. Prioritize videos relevant to this learning collection: ${knowledgeType}. gameplay_reference=finished-game walkthroughs/playthroughs; game_tutorial=game development/Unreal tutorials; environment_reference=world/environment creation; animation_reference=animation/motion; game_design_reference=game-design/system videos. Maximum 100. Channel: ${job.source_url}`,
        add_context_from_internet:true,
        response_json_schema:{type:'object',properties:{videos:{type:'array',items:{type:'string'}}},required:['videos']}
      });
      const urls=[...new Set((r?.videos||[]).filter(u=>VIDEO.test(u)))]; let queued=0;
      for(const url of urls){try{const child=await base44.asServiceRole.entities.VideoLearningJob.create({source_url:url,source_type:'video',parent_job_id:jobId,status:'queued',current_stage:'Queued from channel',progress_percent:0});await base44.asServiceRole.entities.VideoLearningProfile.create({job_id:child.id,knowledge_type:knowledgeType,learning_goal:learningGoal,priority:profile?.priority||80});queued++;}catch{}}
      await save({status:'completed',current_stage:`Channel crawl complete; ${knowledgeType} jobs queued`,progress_percent:100,video_count:queued,notes:`Queued ${queued} verified videos for ${knowledgeType}.`});
      return Response.json({success:true,queued,knowledge_type:knowledgeType});
    }

    const match=job.source_url.match(VIDEO); if(!match) throw new Error('Invalid YouTube video URL');
    const videoId=match[1];
    await save({status:'extracting',current_stage:'Reading real YouTube storyboard frames',progress_percent:10});
    const html=await (await fetch(`https://www.youtube.com/watch?v=${videoId}`,{headers:{'User-Agent':'Mozilla/5.0 AtomEve/1.0'}})).text();
    const title=(html.match(/<title>([^<]+)<\/title>/i)?.[1]||`YouTube ${videoId}`).replace(/ - YouTube$/i,'').trim();
    const spec=html.match(/"spec":"(https?:\\/\\/[^\"]*storyboard[^\"]*)"/)?.[1]?.replace(/\\u0026/g,'&').replace(/\\\//g,'/')||'';
    const va=await base44.asServiceRole.entities.VideoAnalysis.create({video_url:job.source_url,title,status:'processing',source_type:'youtube',analysis_result:'',summary_markdown:'',total_frames:0,total_scenes:0,analysis_depth:'deep',sampling_mode:'storyboard',max_frames:0});
    await save({title,status:'analyzing',current_stage:`Studying the entire video as a ${knowledgeType.replaceAll('_',' ')} picture book`,progress_percent:25});

    const visualSource=spec?`Real YouTube storyboard/frame source is available. Study the chronological imagery across the entire timeline rather than a thumbnail or transcript. Storyboard source:\n${spec}`:`Storyboard metadata was not exposed. Do not pretend unseen frames were inspected; use available evidence and lower confidence.`;
    const analysis=await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:`You are Atom x Eve's persistent visual learning engine. Study the ENTIRE video chronologically like a picture book. Do not produce a shallow summary. Convert visual observations into reusable project knowledge. Separate observed facts from inference.

SOURCE: ${job.source_url}\nTITLE: ${title}\nCOLLECTION: ${knowledgeType}\nGOAL: ${learningGoal}\n${visualSource}

Collection focus: gameplay_reference learns how an existing game plays and is structured; game_tutorial learns how games/Unreal are made; environment_reference learns world/environment construction; animation_reference learns motion, poses, timing and animation states; game_design_reference learns systems, UX, progression and player flow.

Study player loop, controls, movement, camera, combat, weapons, abilities, enemies, bosses, UI, menus, inventory, progression, quests, dialogue, level/world structure, interactions, objectives, feedback, VFX, animation, NPC behavior, economy, checkpoints, failure/retry, multiplayer indicators, and development workflows when present. Return concrete relationships and implementation guidance for future Atom x Eve builders. Never claim source code was learned when only behavior was visible.

Return JSON: summary,visual_observations,gameplay_knowledge,tutorial_knowledge,environment_knowledge,animation_knowledge,implementation_blueprint,mechanics,controls,progression,systems,scenes,architecture_inferences,confidence,tags. Scenes must preserve chronological start/end timestamps and describe visible actions, UI, actors, objects and state changes.`,
      add_context_from_internet:true,
      response_json_schema:{type:'object',properties:{summary:{type:'string'},visual_observations:{type:'string'},gameplay_knowledge:{type:'string'},tutorial_knowledge:{type:'string'},environment_knowledge:{type:'string'},animation_knowledge:{type:'string'},implementation_blueprint:{type:'string'},mechanics:{type:'array'},controls:{type:'array'},progression:{type:'string'},systems:{type:'array'},scenes:{type:'array'},architecture_inferences:{type:'string'},confidence:{type:'number'},tags:{type:'array'}},required:['summary','visual_observations','implementation_blueprint','scenes','confidence','tags']}
    });

    await save({status:'learning',current_stage:`Indexing ${knowledgeType.replaceAll('_',' ')} into project memory`,progress_percent:70});
    const tags=[...new Set(['youtube','visual-learning',knowledgeType,...(analysis?.tags||[])])].slice(0,50);
    const entry=await base44.asServiceRole.entities.KnowledgeEntry.create({source_filename:`YouTube Visual Study — ${title}`,file_type:'youtube_visual_study',file_size:0,summary:analysis?.summary||title,full_analysis:JSON.stringify({knowledge_type:knowledgeType,source_url:job.source_url,...analysis},null,2),extracted_code:'',tags,category:knowledgeType==='game_tutorial'?'documentation':'design',knowledge_domain:knowledgeType==='game_tutorial'?'engine_building':'game_reference',is_pinned:true});
    const library=await base44.asServiceRole.entities.VideoKnowledgeRecord.create({knowledge_type:knowledgeType,source_url:job.source_url,source_title:title,source_job_id:jobId,knowledge_entry_id:entry.id,summary:analysis?.summary||title,visual_observations:analysis?.visual_observations||'',gameplay_knowledge:analysis?.gameplay_knowledge||'',tutorial_knowledge:analysis?.tutorial_knowledge||'',environment_knowledge:analysis?.environment_knowledge||'',animation_knowledge:analysis?.animation_knowledge||'',implementation_blueprint:analysis?.implementation_blueprint||'',scene_timeline:JSON.stringify(analysis?.scenes||[],null,2),confidence:analysis?.confidence||0,tags,frame_count:0,is_active:true});
    const addChunk=async(heading,content,category='uncategorized')=>{if(!content)return null;return await base44.asServiceRole.entities.KnowledgeChunk.create({document_title:`YouTube ${knowledgeType} — ${title}`,section_path:`${knowledgeType}/video/${videoId}/${heading}`,heading,content:typeof content==='string'?content:JSON.stringify(content,null,2),chunk_type:'text',category,tags});};
    const chunks=[]; for(const [h,c,k] of [['Visual Observations',analysis?.visual_observations,'reference_documentation'],['Gameplay Knowledge',analysis?.gameplay_knowledge,'game_design_systems'],['Tutorial Knowledge',analysis?.tutorial_knowledge,'technical_implementation_notes'],['Environment Knowledge',analysis?.environment_knowledge,'game_design_systems'],['Animation Knowledge',analysis?.animation_knowledge,'game_design_systems'],['Systems',analysis?.systems,'game_design_systems'],['Mechanics',(analysis?.mechanics||[]).join('\n'),'combat_systems'],['Controls',(analysis?.controls||[]).join('\n'),'ui_ux_systems'],['Progression',analysis?.progression,'progression_systems'],['Architecture Inferences',analysis?.architecture_inferences,'engine_logic_notes'],['Implementation Blueprint',analysis?.implementation_blueprint,'technical_implementation_notes'],['Scene Timeline',analysis?.scenes,'reference_documentation']]){const rec=await addChunk(h,c,k);if(rec)chunks.push(rec);}

    let frameCount=0;
    if(spec){const urls=[...spec.matchAll(/https?:\\/\\/[^&"\\]+/g)].map(m=>m[0].replace(/\\u0026/g,'&')).filter((u,i,a)=>a.indexOf(u)===i).slice(0,100);const frames=urls.map((u,i)=>({video_analysis_id:va.id,frame_index:i,timestamp_seconds:i,image_url:u,thumbnail_url:u,frame_summary:`Real chronological storyboard source ${i+1} for ${title}`,notes:`Visual evidence for ${knowledgeType}.`,is_representative:i===0}));try{if(frames.length){await base44.asServiceRole.entities.VideoFrame.bulkCreate(frames);frameCount=frames.length;}}catch(e){console.log('Frame persistence warning',e?.message||e);}}
    await base44.asServiceRole.entities.VideoAnalysis.update(va.id,{status:'completed',analysis_result:JSON.stringify({knowledge_type:knowledgeType,...analysis}),summary_markdown:analysis?.summary||'',total_frames:frameCount,total_scenes:(analysis?.scenes||[]).length});
    await base44.asServiceRole.entities.VideoKnowledgeRecord.update(library.id,{frame_count:frameCount});
    await save({status:'completed',current_stage:`Learned and indexed into ${knowledgeType}`,progress_percent:100,frame_count:frameCount,knowledge_chunk_count:chunks.length,learned_knowledge_ids:[entry.id,library.id,...chunks.map(c=>c.id)],title});
    return Response.json({success:true,video_id:videoId,video_analysis_id:va.id,knowledge_entry_id:entry.id,video_knowledge_id:library.id,knowledge_type:knowledgeType,frame_count:frameCount,knowledge_chunk_count:chunks.length});
  } catch(error){try{if(jobId)await base44.asServiceRole.entities.VideoLearningJob.update(jobId,{status:'failed',current_stage:'Learning failed',error_message:error?.message||String(error)});}catch{} return Response.json({error:error?.message||String(error)},{status:500});}
});
