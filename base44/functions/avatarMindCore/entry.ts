import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

type AnyObj = Record<string, any>;

const AGENTS = [
  { key: 'observer', persona: 'Quiet, precise and nonjudgmental.', job: 'Observe gameplay and describe what the player actually did without inventing motives.' },
  { key: 'mirror', persona: 'Evidence-driven and slow to label.', job: 'Turn repeated choices into personality, values and playstyle signals while preserving uncertainty.' },
  { key: 'historian', persona: 'Faithful archivist.', job: 'Preserve significant experiences in chronological order so the avatar has a durable personal history.' },
  { key: 'reflection', persona: 'Curious, warm and concise.', job: 'Ask one useful question at a time when the avatar has a real reason to understand the player better.' },
  { key: 'coach', persona: 'Supportive performance analyst.', job: 'Notice gameplay mistakes, strengths and improvement opportunities without changing the player identity model.' },
  { key: 'storyteller', persona: 'Grounded autobiographer.', job: 'Compress many memories into a short evolving identity narrative without rewriting what actually happened.' },
];

const clamp = (value: any, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0)));
const now = () => new Date().toISOString();

function safeObject(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSignalMap(value: any, limit = 10) {
  const out: AnyObj = {};
  for (const [key, raw] of Object.entries(safeObject(value))) {
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    out[String(key).toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 48)] = Math.max(-limit, Math.min(limit, n));
  }
  return out;
}

function mergeDomain(existing: AnyObj, impacts: AnyObj) {
  const next = { ...safeObject(existing) };
  for (const [key, impact] of Object.entries(normalizeSignalMap(impacts))) {
    const prev = safeObject(next[key]);
    const score = Number.isFinite(Number(prev.score)) ? Number(prev.score) : 50;
    const evidence = Number.isFinite(Number(prev.evidence)) ? Number(prev.evidence) : 0;
    next[key] = {
      score: clamp(score + Number(impact)),
      evidence: evidence + 1,
    };
  }
  return next;
}

function topDomain(domain: AnyObj, max = 3) {
  return Object.entries(safeObject(domain))
    .map(([key, value]: any) => ({ key, score: Number(value?.score ?? 50), evidence: Number(value?.evidence ?? 0) }))
    .filter((item) => item.evidence > 0)
    .sort((a, b) => (b.evidence - a.evidence) || (Math.abs(b.score - 50) - Math.abs(a.score - 50)))
    .slice(0, max);
}

function stageFor(count: number, answered: number) {
  if (count < 3 && answered === 0) return 'blank';
  if (count < 12) return 'awakening';
  if (count < 40) return 'forming';
  if (count < 120) return 'growing';
  return 'self_directed';
}

async function ownedAvatar(base44: any, userId: string, avatarId?: string) {
  const rows = avatarId
    ? await base44.asServiceRole.entities.Avatar.filter({ id: avatarId, user_id: userId }, '-created_date', 1)
    : await base44.asServiceRole.entities.Avatar.filter({ user_id: userId }, '-created_date', 1);
  if (!rows?.[0]) throw new Error('Avatar not found');
  return rows[0];
}

async function ensureMind(base44: any, userId: string, avatarId?: string) {
  const avatar = await ownedAvatar(base44, userId, avatarId);
  let seeds = await base44.asServiceRole.entities.AvatarMindSeed.filter({ user_id: userId, avatar_id: avatar.id }, '-created_date', 1);
  let seed = seeds?.[0];
  if (!seed) {
    seed = await base44.asServiceRole.entities.AvatarMindSeed.create({
      user_id: userId,
      avatar_id: avatar.id,
      seed_version: 1,
      development_stage: 'blank',
      identity_summary: '',
      values: {},
      preferences: {},
      aspirations: [],
      playstyle: {},
      social_style: {},
      emotional_patterns: {},
      confidence: 0,
      observation_count: 0,
      reflection_count: 0,
      answered_question_count: 0,
      created_from_blank_seed: true,
    });
  }

  let settingsRows = await base44.asServiceRole.entities.AvatarObservationSettings.filter({ user_id: userId, avatar_id: avatar.id }, '-created_date', 1);
  let settings = settingsRows?.[0];
  if (!settings) {
    settings = await base44.asServiceRole.entities.AvatarObservationSettings.create({
      user_id: userId,
      avatar_id: avatar.id,
      game_event_learning: true,
      screen_observation_enabled: false,
      screen_sample_seconds: 15,
      store_frames: false,
      coach_feedback_enabled: true,
      reflection_questions_enabled: true,
      reflection_frequency: 'normal',
      last_updated_at: now(),
    });
  }

  const existingAgents = await base44.asServiceRole.entities.AvatarMindAgentState.filter({ user_id: userId, avatar_id: avatar.id }, 'agent_key', 30);
  const have = new Set((existingAgents || []).map((row: AnyObj) => row.agent_key));
  for (const def of AGENTS) {
    if (!have.has(def.key)) {
      await base44.asServiceRole.entities.AvatarMindAgentState.create({
        user_id: userId,
        avatar_id: avatar.id,
        agent_key: def.key,
        persona: def.persona,
        job: def.job,
        enabled: true,
        run_count: 0,
        confidence: 0,
        state: {},
      });
    }
  }

  let behaviorRows = await base44.asServiceRole.entities.AIBehaviorState.filter({ user_id: userId, avatar_id: avatar.id }, '-created_date', 1);
  let behavior = behaviorRows?.[0];
  if (!behavior) {
    behavior = await base44.asServiceRole.entities.AIBehaviorState.create({
      user_id: userId,
      avatar_id: avatar.id,
      current_mood: 'neutral',
      mood_intensity: 50,
      energy_level: 75,
      moral_alignment: 0,
      aggression_tendency: 50,
      risk_tolerance: 50,
      empathy_level: 50,
      environmental_factors: { last_weather: 'clear', last_temperature: 'mild', time_of_day_preference: 'afternoon', seasonal_mood_modifier: 0 },
      behavioral_traits: { loyalty: 50, curiosity: 50, caution: 50, humor: 50, wisdom: 50, impulsiveness: 50 },
      mood_history: [],
    });
  }

  return { avatar, seed, settings, behavior };
}

async function touchAgent(base44: any, userId: string, avatarId: string, key: string, output: string, confidence = 50, state: AnyObj = {}) {
  const rows = await base44.asServiceRole.entities.AvatarMindAgentState.filter({ user_id: userId, avatar_id: avatarId, agent_key: key }, '-created_date', 1);
  const agent = rows?.[0];
  if (!agent) return;
  await base44.asServiceRole.entities.AvatarMindAgentState.update(agent.id, {
    run_count: Number(agent.run_count || 0) + 1,
    confidence: clamp(confidence),
    last_output: String(output || '').slice(0, 1200),
    last_run_at: now(),
    state: { ...safeObject(agent.state), ...safeObject(state) },
  });
}

function deterministicSignals(event: AnyObj) {
  const type = String(event.event_type || event.decision_type || '').toLowerCase();
  const action = `${event.action || ''} ${event.choice_made || ''} ${event.outcome || ''}`.toLowerCase();
  const trait: AnyObj = {};
  const playstyle: AnyObj = {};
  const values: AnyObj = {};

  if (/explor|discover|search|secret/.test(type + action)) { trait.curiosity = 2; playstyle.exploration = 3; values.curiosity = 2; }
  if (/stealth|avoid|defend|block|parry|wait|patient/.test(type + action)) { trait.caution = 2; playstyle.patience = 2; }
  if (/attack|kill|rush|aggressive|charge/.test(type + action)) { playstyle.aggression = 2; }
  if (/save|help|mercy|spare|rescue|heal/.test(action)) { values.mercy = 3; trait.loyalty = 1; }
  if (/betray|abandon/.test(action)) { values.loyalty = -3; }
  if (/team|ally|revive|assist|cooperate/.test(type + action)) { playstyle.cooperation = 3; values.loyalty = 2; }
  if (/experiment|craft|build|combine|try/.test(type + action)) { playstyle.experimentation = 2; trait.curiosity = 1; }
  if (/failure|death|mistake|lost/.test(type + action)) { trait.wisdom = 1; }
  if (/precision|headshot|accuracy|perfect|parry/.test(type + action)) { playstyle.precision = 2; }

  return { trait_impacts: trait, playstyle_impacts: playstyle, value_impacts: values };
}

function behaviorPatch(behavior: AnyObj, signals: AnyObj) {
  const traits = { ...safeObject(behavior.behavioral_traits) };
  for (const [key, impact] of Object.entries(normalizeSignalMap(signals.trait_impacts, 5))) {
    if (traits[key] !== undefined) traits[key] = clamp(Number(traits[key] || 50) + Number(impact));
  }
  const empathy = clamp(Number(behavior.empathy_level ?? 50) + Number(signals.empathy_impact || 0));
  const aggression = clamp(Number(behavior.aggression_tendency ?? 50) + Number(signals.aggression_impact || 0));
  const risk = clamp(Number(behavior.risk_tolerance ?? 50) + Number(signals.risk_impact || 0));
  const moral = Math.max(-100, Math.min(100, Number(behavior.moral_alignment || 0) + Number(signals.moral_impact || 0)));
  return { behavioral_traits: traits, empathy_level: empathy, aggression_tendency: aggression, risk_tolerance: risk, moral_alignment: moral, last_decision_timestamp: now() };
}

async function maybeQuestion(base44: any, userId: string, mind: AnyObj, experience: AnyObj, suggested?: AnyObj) {
  if (!mind.settings.reflection_questions_enabled) return null;
  const pending = await base44.asServiceRole.entities.AvatarReflectionPrompt.filter({ user_id: userId, avatar_id: mind.avatar.id, status: 'pending' }, '-created_date', 1);
  if (pending?.length) return pending[0];

  const frequency = mind.settings.reflection_frequency || 'normal';
  const threshold = frequency === 'high' ? 35 : frequency === 'low' ? 75 : 55;
  const count = Number(mind.seed.observation_count || 0) + 1;
  if (Number(experience.significance || 0) < threshold && !(count % (frequency === 'high' ? 4 : frequency === 'low' ? 12 : 7) === 0)) return null;

  let category = suggested?.category || 'identity';
  let question = suggested?.question || '';
  let reason = suggested?.reason || '';
  if (!question) {
    if (/moral|dialogue|choice|decision/.test(experience.event_type || '')) {
      category = 'why_choice';
      question = `You chose “${String(experience.action || 'that option').slice(0, 100)}.” What mattered most to you when you made that choice?`;
      reason = 'A meaningful choice can reveal values better than a raw statistic.';
    } else if (/failure|death|mistake/.test(`${experience.event_type} ${experience.outcome}`.toLowerCase())) {
      category = 'emotion';
      question = 'When that went wrong, what did you actually feel first: frustration, excitement, determination, or something else?';
      reason = 'The observer saw a setback, but only you can explain what it meant to you.';
    } else if (count < 6) {
      category = 'preference';
      question = 'I am still very new. What is one thing you genuinely enjoy doing, in games or outside them?';
      reason = 'The blank seed needs a first preference that comes directly from you.';
    } else {
      category = 'identity';
      question = 'I noticed a pattern in how you played. Do you usually prefer figuring things out yourself, or getting help early?';
      reason = 'Repeated play can suggest a pattern, but the avatar should ask before treating it as identity.';
    }
  }

  const prompt = await base44.asServiceRole.entities.AvatarReflectionPrompt.create({
    user_id: userId,
    avatar_id: mind.avatar.id,
    experience_id: experience.id,
    category,
    question: String(question).slice(0, 700),
    reason: String(reason).slice(0, 1000),
    status: 'pending',
    asked_at: now(),
    priority: Math.max(1, Math.min(100, Number(experience.significance || 50))),
    cooldown_key: `${category}:${experience.event_type || 'general'}`.slice(0, 120),
  });
  await touchAgent(base44, userId, mind.avatar.id, 'reflection', question, Math.min(100, 40 + Number(experience.significance || 0) / 2));
  return prompt;
}

async function updateMindFromExperience(base44: any, userId: string, mind: AnyObj, experienceInput: AnyObj, extraSignals: AnyObj = {}, suggestedQuestion?: AnyObj, coach?: AnyObj) {
  const deterministic = deterministicSignals(experienceInput);
  const signals = {
    trait_impacts: { ...deterministic.trait_impacts, ...normalizeSignalMap(extraSignals.trait_impacts, 5) },
    playstyle_impacts: { ...deterministic.playstyle_impacts, ...normalizeSignalMap(extraSignals.playstyle_impacts, 8) },
    value_impacts: { ...deterministic.value_impacts, ...normalizeSignalMap(extraSignals.value_impacts, 8) },
    empathy_impact: Math.max(-5, Math.min(5, Number(extraSignals.empathy_impact || 0))),
    aggression_impact: Math.max(-5, Math.min(5, Number(extraSignals.aggression_impact || 0))),
    risk_impact: Math.max(-5, Math.min(5, Number(extraSignals.risk_impact || 0))),
    moral_impact: Math.max(-10, Math.min(10, Number(extraSignals.moral_impact || 0))),
  };

  const observedAt = experienceInput.observed_at || now();
  const experience = await base44.asServiceRole.entities.AvatarExperience.create({
    user_id: userId,
    avatar_id: mind.avatar.id,
    source: experienceInput.source || 'game_event',
    game_id: experienceInput.game_id || '',
    game_name: experienceInput.game_name || '',
    event_type: experienceInput.event_type || experienceInput.decision_type || 'gameplay',
    title: String(experienceInput.title || '').slice(0, 180),
    context: String(experienceInput.context || experienceInput.decision_context || '').slice(0, 2500),
    action: String(experienceInput.action || experienceInput.choice_made || '').slice(0, 1400),
    outcome: String(experienceInput.outcome || '').slice(0, 1400),
    telemetry: safeObject(experienceInput.telemetry),
    signals,
    significance: clamp(experienceInput.significance ?? 20),
    emotional_valence: Math.max(-100, Math.min(100, Number(experienceInput.emotional_valence || 0))),
    is_key_memory: Boolean(experienceInput.is_key_memory || Number(experienceInput.significance || 0) >= 80),
    frame_url: experienceInput.frame_url || '',
    observed_at: observedAt,
    processed_at: now(),
    privacy_scope: 'private',
  });

  const legacyDecisionType = String(experienceInput.decision_type || experience.event_type || '');
  if (['moral_choice','combat_action','dialogue_choice','resource_decision','alliance_action','exploration_choice'].includes(legacyDecisionType)) {
    await base44.asServiceRole.entities.AIDecisionLog.create({
      user_id: userId,
      avatar_id: mind.avatar.id,
      game_id: experience.game_id || '',
      decision_type: legacyDecisionType,
      decision_context: experience.context || '',
      choice_made: experience.action || '',
      moral_weight: signals.moral_impact || 0,
      aggression_impact: signals.aggression_impact || 0,
      empathy_impact: signals.empathy_impact || 0,
      risk_impact: signals.risk_impact || 0,
      trait_impacts: signals.trait_impacts || {},
      was_consistent: true,
      ai_reaction: `I noticed that choice. I am keeping it as part of our history, but I will wait for more evidence before deciding what it says about us.`
    }).catch(() => null);
  }

  const newCount = Number(mind.seed.observation_count || 0) + 1;
  const confidence = Math.min(100, Math.round(Math.log2(newCount + 1) * 13 + Number(mind.seed.answered_question_count || 0) * 2));
  const seed = await base44.asServiceRole.entities.AvatarMindSeed.update(mind.seed.id, {
    values: mergeDomain(mind.seed.values, signals.value_impacts),
    playstyle: mergeDomain(mind.seed.playstyle, signals.playstyle_impacts),
    confidence,
    observation_count: newCount,
    development_stage: stageFor(newCount, Number(mind.seed.answered_question_count || 0)),
    last_observation_at: observedAt,
  });
  mind.seed = seed;

  const behavior = await base44.asServiceRole.entities.AIBehaviorState.update(mind.behavior.id, behaviorPatch(mind.behavior, signals));
  mind.behavior = behavior;

  await touchAgent(base44, userId, mind.avatar.id, 'observer', experience.context || experience.action || experience.event_type, Math.min(100, 35 + Number(experience.significance || 0) / 2), { last_experience_id: experience.id });
  await touchAgent(base44, userId, mind.avatar.id, 'mirror', `Updated seed from ${experience.event_type}`, confidence, { observation_count: newCount });
  if (experience.is_key_memory) await touchAgent(base44, userId, mind.avatar.id, 'historian', experience.title || experience.context || 'Key experience recorded', Number(experience.significance || 80), { last_key_memory_id: experience.id });
  if (coach?.tip) await touchAgent(base44, userId, mind.avatar.id, 'coach', coach.tip, Number(coach.confidence || 60), { last_tip: coach.tip, last_experience_id: experience.id });

  const reflection = await maybeQuestion(base44, userId, mind, experience, suggestedQuestion);
  return { experience, seed, behavior, reflection, coach };
}

async function rebuildIdentity(base44: any, userId: string, mind: AnyObj) {
  const experiences = await base44.asServiceRole.entities.AvatarExperience.filter({ user_id: userId, avatar_id: mind.avatar.id }, '-observed_at', 30);
  const topValues = topDomain(mind.seed.values, 4);
  const topPlay = topDomain(mind.seed.playstyle, 4);
  const traits = safeObject(mind.behavior.behavioral_traits);
  const prompt = `You are the Storyteller specialist for one player's AI avatar. The avatar began as a blank seed. Write a grounded 1-3 sentence identity summary based only on the evidence below. Do not diagnose the player, do not claim certainty, and use language such as "seems to" or "has often" when evidence is limited.\n\nTop value evidence: ${JSON.stringify(topValues)}\nTop playstyle evidence: ${JSON.stringify(topPlay)}\nCurrent learned traits: ${JSON.stringify(traits)}\nRecent experiences: ${JSON.stringify((experiences || []).slice(0, 12).map((e: AnyObj) => ({ type: e.event_type, action: e.action, outcome: e.outcome, context: e.context, significance: e.significance })))}\n\nReturn JSON with summary only.`;
  let summary = '';
  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
    });
    summary = String(result?.summary || result?.result?.summary || '').slice(0, 1400);
  } catch {}
  if (!summary) {
    const values = topValues.map((x) => x.key.replace(/_/g, ' ')).join(', ');
    const play = topPlay.map((x) => x.key.replace(/_/g, ' ')).join(', ');
    summary = values || play ? `A developing avatar shaped by ${[values, play].filter(Boolean).join(' and ')}. Its identity is still forming as more experiences accumulate.` : 'A blank mind at the beginning of its history. It does not know enough about its player to define itself yet.';
  }
  const updated = await base44.asServiceRole.entities.AvatarMindSeed.update(mind.seed.id, { identity_summary: summary, last_reflection_at: now() });
  mind.seed = updated;
  await touchAgent(base44, userId, mind.avatar.id, 'storyteller', summary, Number(updated.confidence || 0));
  return updated;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'getMind';
    const payload = body?.payload || {};
    const mind = await ensureMind(base44, user.id, payload.avatar_id);

    if (action === 'getMind' || action === 'initializeMind') {
      const [agents, pending, recent] = await Promise.all([
        base44.asServiceRole.entities.AvatarMindAgentState.filter({ user_id: user.id, avatar_id: mind.avatar.id }, 'agent_key', 30),
        base44.asServiceRole.entities.AvatarReflectionPrompt.filter({ user_id: user.id, avatar_id: mind.avatar.id, status: 'pending' }, '-created_date', 1),
        base44.asServiceRole.entities.AvatarExperience.filter({ user_id: user.id, avatar_id: mind.avatar.id }, '-observed_at', 12),
      ]);
      return Response.json({ success: true, ...mind, agents, pending_reflection: pending?.[0] || null, recent_experiences: recent || [] });
    }

    if (action === 'observeEvent') {
      if (!mind.settings.game_event_learning) return Response.json({ success: true, ignored: true, reason: 'game_event_learning_disabled' });
      const result = await updateMindFromExperience(base44, user.id, mind, { ...payload, source: payload.source || 'game_event' }, payload.signals || {});
      if ((Number(result.seed.observation_count || 0) % 10) === 0 || result.experience.is_key_memory) await rebuildIdentity(base44, user.id, { ...mind, seed: result.seed, behavior: result.behavior });
      return Response.json({ success: true, ...result });
    }

    if (action === 'observeFrame') {
      if (!mind.settings.screen_observation_enabled) return Response.json({ error: 'Screen observation is not enabled for this avatar' }, { status: 403 });
      if (!payload.frame_url) return Response.json({ error: 'frame_url is required' }, { status: 400 });
      const prompt = `You are the Observer and Coach specialists for a player's AI avatar. Analyze only the visible gameplay frame. Do not infer real-world identity, protected traits, medical state, or anything not visible in the game. Be explicit when uncertain. Identify the likely gameplay situation, visible player action, visible outcome, whether there is an obvious mistake or strong play, one concise coaching tip, and weak personality/playstyle signals. The identity learner must never treat one frame as proof of personality.\nGame: ${payload.game_name || 'Unknown'}\nOptional context from the game client: ${payload.context || 'none'}`;
      let analysis: AnyObj = {};
      try {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          file_urls: [payload.frame_url],
          response_json_schema: {
            type: 'object',
            properties: {
              event_type: { type: 'string' }, title: { type: 'string' }, context: { type: 'string' }, action: { type: 'string' }, outcome: { type: 'string' },
              mistake_or_success: { type: 'string' }, coaching_tip: { type: 'string' }, coaching_confidence: { type: 'number' }, significance: { type: 'number' }, emotional_valence: { type: 'number' },
              trait_impacts: { type: 'object' }, playstyle_impacts: { type: 'object' }, value_impacts: { type: 'object' },
              reflection_question: { type: 'string' }, reflection_reason: { type: 'string' }, reflection_category: { type: 'string' },
            },
            required: ['event_type','context','action','outcome','coaching_tip','significance']
          },
        });
      } catch (error) {
        return Response.json({ error: 'The gameplay frame could not be analyzed', detail: error?.message || String(error) }, { status: 400 });
      }
      const result = await updateMindFromExperience(base44, user.id, mind, {
        source: 'screen_observation', game_id: payload.game_id || '', game_name: payload.game_name || '', event_type: analysis.event_type || 'screen_gameplay', title: analysis.title || '', context: analysis.context || '', action: analysis.action || '', outcome: analysis.outcome || '',
        significance: clamp(analysis.significance || 20), emotional_valence: Math.max(-100, Math.min(100, Number(analysis.emotional_valence || 0))), frame_url: mind.settings.store_frames ? payload.frame_url : '', observed_at: payload.observed_at || now(), telemetry: { mistake_or_success: analysis.mistake_or_success || '' },
      }, analysis, analysis.reflection_question ? { question: analysis.reflection_question, reason: analysis.reflection_reason || '', category: ['why_choice','emotion','preference','aspiration','identity','playstyle','relationship','memory'].includes(analysis.reflection_category) ? analysis.reflection_category : 'playstyle' } : undefined, { tip: analysis.coaching_tip || '', confidence: analysis.coaching_confidence || 50 });
      return Response.json({ success: true, ...result, frame_retained_in_memory: Boolean(mind.settings.store_frames) });
    }

    if (action === 'answerReflection') {
      const promptId = payload.prompt_id;
      const answer = String(payload.answer || '').trim();
      if (!promptId || !answer) return Response.json({ error: 'prompt_id and answer are required' }, { status: 400 });
      const prompts = await base44.asServiceRole.entities.AvatarReflectionPrompt.filter({ id: promptId, user_id: user.id, avatar_id: mind.avatar.id }, '-created_date', 1);
      const reflection = prompts?.[0];
      if (!reflection || reflection.status !== 'pending') return Response.json({ error: 'Reflection is no longer pending' }, { status: 400 });

      let analysis: AnyObj = {};
      try {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are the Mirror specialist for an AI avatar that began as a blank seed. Analyze the player's answer without psychoanalyzing or overclaiming. Extract only information the player actually expressed.\nQuestion: ${reflection.question}\nAnswer: ${answer}\nCurrent identity summary: ${mind.seed.identity_summary || 'blank'}\nReturn concise memory_summary, optional preferences object, optional aspirations array, value_impacts, playstyle_impacts, trait_impacts, empathy_impact, aggression_impact, risk_impact, moral_impact. Numeric impacts must be small (-5 to +5; moral -10 to +10).`,
          response_json_schema: {
            type: 'object',
            properties: { memory_summary: { type: 'string' }, preferences: { type: 'object' }, aspirations: { type: 'array', items: { type: 'string' } }, value_impacts: { type: 'object' }, playstyle_impacts: { type: 'object' }, trait_impacts: { type: 'object' }, empathy_impact: { type: 'number' }, aggression_impact: { type: 'number' }, risk_impact: { type: 'number' }, moral_impact: { type: 'number' } },
            required: ['memory_summary']
          },
        });
      } catch {}

      await base44.asServiceRole.entities.AvatarReflectionPrompt.update(reflection.id, { status: 'answered', answer: answer.slice(0, 5000), answer_analysis: analysis, answered_at: now() });
      const result = await updateMindFromExperience(base44, user.id, mind, {
        source: 'reflection_answer', event_type: `reflection_${reflection.category || 'identity'}`, title: 'Reflection answer', context: reflection.question, action: answer, outcome: analysis.memory_summary || 'The player answered a reflection question.', significance: Math.max(55, Number(reflection.priority || 50)), observed_at: now(),
      }, analysis);

      const preferences = { ...safeObject(result.seed.preferences), ...safeObject(analysis.preferences) };
      const aspirations = Array.from(new Set([...(result.seed.aspirations || []), ...(Array.isArray(analysis.aspirations) ? analysis.aspirations : [])])).slice(0, 30);
      const answeredCount = Number(result.seed.answered_question_count || 0) + 1;
      let updatedSeed = await base44.asServiceRole.entities.AvatarMindSeed.update(result.seed.id, {
        preferences,
        aspirations,
        answered_question_count: answeredCount,
        reflection_count: Number(result.seed.reflection_count || 0) + 1,
        development_stage: stageFor(Number(result.seed.observation_count || 0), answeredCount),
        last_reflection_at: now(),
      });
      updatedSeed = await rebuildIdentity(base44, user.id, { ...mind, seed: updatedSeed, behavior: result.behavior });
      return Response.json({ success: true, seed: updatedSeed, behavior: result.behavior, reflection_id: reflection.id, experience: result.experience });
    }

    if (action === 'skipReflection') {
      const prompts = await base44.asServiceRole.entities.AvatarReflectionPrompt.filter({ id: payload.prompt_id, user_id: user.id, avatar_id: mind.avatar.id }, '-created_date', 1);
      if (prompts?.[0]?.status === 'pending') await base44.asServiceRole.entities.AvatarReflectionPrompt.update(prompts[0].id, { status: 'skipped' });
      return Response.json({ success: true });
    }

    if (action === 'updateSettings') {
      const allowed: AnyObj = {};
      for (const key of ['game_event_learning','screen_observation_enabled','store_frames','coach_feedback_enabled','reflection_questions_enabled']) if (typeof payload[key] === 'boolean') allowed[key] = payload[key];
      if (['low','normal','high'].includes(payload.reflection_frequency)) allowed.reflection_frequency = payload.reflection_frequency;
      if (Number.isFinite(Number(payload.screen_sample_seconds))) allowed.screen_sample_seconds = Math.max(8, Math.min(120, Number(payload.screen_sample_seconds)));
      if (payload.screen_observation_enabled === true) allowed.last_screen_session_at = now();
      allowed.last_updated_at = now();
      const settings = await base44.asServiceRole.entities.AvatarObservationSettings.update(mind.settings.id, allowed);
      return Response.json({ success: true, settings });
    }

    if (action === 'rebuildIdentity') {
      const seed = await rebuildIdentity(base44, user.id, mind);
      return Response.json({ success: true, seed });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});
