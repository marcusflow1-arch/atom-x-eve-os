import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await req.json();

    switch (action) {
      case 'updateEnvironmental':
        return await updateEnvironmentalFactors(base44, user.id, payload);
      
      case 'logDecision':
        return await logPlayerDecision(base44, user.id, payload);
      
      case 'getBehaviorState':
        return await getBehaviorState(base44, user.id, payload?.avatar_id);
      
      case 'processTimeOfDay':
        return await processTimeOfDay(base44, user.id);
      
      case 'getAIReaction':
        return await getAIReaction(base44, user.id, payload);
      
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Update AI state based on environmental factors (weather, temperature)
async function updateEnvironmentalFactors(base44, userId, payload) {
  const { avatar_id, weather, temperature, location } = payload;
  
  // Get or create behavior state
  let states = await base44.entities.AIBehaviorState.filter({ user_id: userId, avatar_id });
  let state = states[0];
  
  if (!state) {
    state = await base44.entities.AIBehaviorState.create({
      user_id: userId,
      avatar_id,
      current_mood: 'neutral',
      mood_intensity: 50,
      energy_level: 75,
      moral_alignment: 0,
      aggression_tendency: 30,
      risk_tolerance: 50,
      empathy_level: 50,
      environmental_factors: {},
      behavioral_traits: {
        loyalty: 50,
        curiosity: 50,
        caution: 50,
        humor: 50,
        wisdom: 50,
        impulsiveness: 50
      },
      mood_history: []
    });
  }

  // Calculate mood modifiers based on weather
  const weatherMoodMap = {
    'clear': { mood: 'content', energy: 10, aggression: -5 },
    'cloudy': { mood: 'contemplative', energy: -5, aggression: 0 },
    'rainy': { mood: 'melancholic', energy: -10, aggression: -10 },
    'stormy': { mood: 'aggressive', energy: 5, aggression: 15 },
    'snowy': { mood: 'contemplative', energy: -5, aggression: -5 },
    'foggy': { mood: 'curious', energy: -5, aggression: 0 },
    'windy': { mood: 'energetic', energy: 10, aggression: 5 }
  };

  // Calculate mood modifiers based on temperature
  const tempMoodMap = {
    'freezing': { mood: 'irritable', energy: -20, aggression: 10 },
    'cold': { mood: 'contemplative', energy: -10, aggression: 0 },
    'cool': { mood: 'content', energy: 5, aggression: -5 },
    'mild': { mood: 'neutral', energy: 10, aggression: 0 },
    'warm': { mood: 'content', energy: 5, aggression: -5 },
    'hot': { mood: 'irritable', energy: -15, aggression: 15 },
    'scorching': { mood: 'aggressive', energy: -25, aggression: 20 }
  };

  const weatherEffect = weatherMoodMap[weather] || weatherMoodMap['clear'];
  const tempEffect = tempMoodMap[temperature] || tempMoodMap['mild'];

  // Combine effects and apply personality weight
  const traits = state.behavioral_traits || {};
  const caution = traits.caution || 50;
  const impulsiveness = traits.impulsiveness || 50;

  // More impulsive AIs are more affected by environment
  const environmentSensitivity = (impulsiveness / 100) * 1.5;
  
  // Calculate new values
  let newEnergy = Math.max(0, Math.min(100, 
    state.energy_level + (weatherEffect.energy + tempEffect.energy) * environmentSensitivity
  ));
  
  let newAggression = Math.max(0, Math.min(100,
    state.aggression_tendency + (weatherEffect.aggression + tempEffect.aggression) * environmentSensitivity * 0.5
  ));

  // Determine new mood based on combined factors
  let newMood = state.current_mood;
  const moodPriority = { 'aggressive': 5, 'irritable': 4, 'melancholic': 3, 'energetic': 2, 'contemplative': 1 };
  
  if ((moodPriority[weatherEffect.mood] || 0) > (moodPriority[tempEffect.mood] || 0)) {
    newMood = weatherEffect.mood;
  } else {
    newMood = tempEffect.mood;
  }

  // Moral alignment affects mood interpretation
  if (state.moral_alignment < -50 && newMood === 'aggressive') {
    newMood = 'aggressive'; // Dark-aligned AI leans into aggression
    newAggression = Math.min(100, newAggression + 10);
  } else if (state.moral_alignment > 50 && newMood === 'aggressive') {
    newMood = 'irritable'; // Good-aligned AI resists pure aggression
    newAggression = Math.max(0, newAggression - 10);
  }

  // Update mood history
  const moodHistory = state.mood_history || [];
  if (moodHistory.length > 50) moodHistory.shift(); // Keep last 50 entries
  moodHistory.push({
    mood: newMood,
    timestamp: new Date().toISOString(),
    trigger: `Environmental: ${weather}, ${temperature}`
  });

  // Update state
  const updatedState = await base44.entities.AIBehaviorState.update(state.id, {
    current_mood: newMood,
    energy_level: newEnergy,
    aggression_tendency: newAggression,
    environmental_factors: {
      last_weather: weather,
      last_temperature: temperature,
      seasonal_mood_modifier: weatherEffect.energy + tempEffect.energy
    },
    mood_history: moodHistory,
    last_environmental_update: new Date().toISOString()
  });

  return Response.json({
    success: true,
    previous_mood: state.current_mood,
    new_mood: newMood,
    energy_change: newEnergy - state.energy_level,
    aggression_change: newAggression - state.aggression_tendency,
    state: updatedState
  });
}

// Process time of day effects on AI behavior
async function processTimeOfDay(base44, userId) {
  const states = await base44.entities.AIBehaviorState.filter({ user_id: userId });
  
  if (states.length === 0) {
    return Response.json({ error: 'No behavior states found' }, { status: 404 });
  }

  const now = new Date();
  const hour = now.getHours();
  
  // Determine time period
  let timePeriod;
  let energyModifier;
  let moodTendency;
  
  if (hour >= 5 && hour < 12) {
    timePeriod = 'morning';
    energyModifier = 15;
    moodTendency = 'energetic';
  } else if (hour >= 12 && hour < 17) {
    timePeriod = 'afternoon';
    energyModifier = 5;
    moodTendency = 'content';
  } else if (hour >= 17 && hour < 21) {
    timePeriod = 'evening';
    energyModifier = -5;
    moodTendency = 'contemplative';
  } else {
    timePeriod = 'night';
    energyModifier = -15;
    moodTendency = 'melancholic';
  }

  const results = [];

  for (const state of states) {
    const traits = state.behavioral_traits || {};
    const preference = state.environmental_factors?.time_of_day_preference || 'afternoon';
    
    // Bonus if playing during preferred time
    const preferenceBonus = preference === timePeriod ? 10 : 0;
    
    // Night owls get energy boost at night, morning people at morning
    let adjustedEnergy = state.energy_level + energyModifier + preferenceBonus;
    adjustedEnergy = Math.max(0, Math.min(100, adjustedEnergy));

    // Low energy affects mood and decision making
    let newMood = state.current_mood;
    if (adjustedEnergy < 25) {
      newMood = 'tired';
    } else if (adjustedEnergy > 80 && state.current_mood !== 'aggressive') {
      newMood = 'energetic';
    }

    // Aggression increases when tired for certain personality types
    let newAggression = state.aggression_tendency;
    if (adjustedEnergy < 30 && (traits.impulsiveness || 50) > 60) {
      newAggression = Math.min(100, newAggression + 10);
    }

    await base44.entities.AIBehaviorState.update(state.id, {
      energy_level: adjustedEnergy,
      current_mood: newMood,
      aggression_tendency: newAggression
    });

    results.push({
      avatar_id: state.avatar_id,
      time_period: timePeriod,
      energy_change: adjustedEnergy - state.energy_level,
      new_mood: newMood
    });
  }

  return Response.json({ success: true, time_period: timePeriod, results });
}

// Log a player decision and update AI behavior accordingly
async function logPlayerDecision(base44, userId, payload) {
  const {
    avatar_id,
    game_id,
    decision_type,
    decision_context,
    choice_made,
    moral_weight = 0,
    aggression_impact = 0,
    empathy_impact = 0,
    risk_impact = 0,
    trait_impacts = {}
  } = payload;

  // Get current behavior state
  let states = await base44.entities.AIBehaviorState.filter({ user_id: userId, avatar_id });
  let state = states[0];

  if (!state) {
    return Response.json({ error: 'No behavior state found for avatar' }, { status: 404 });
  }

  // Check if decision is consistent with AI's current personality
  const traits = state.behavioral_traits || {};
  const currentAlignment = state.moral_alignment || 0;
  
  let isConsistent = true;
  let aiReaction = 'neutral';

  // Check moral consistency
  if (moral_weight > 5 && currentAlignment < -30) {
    isConsistent = false;
    aiReaction = 'surprised_positive'; // Evil AI surprised by good choice
  } else if (moral_weight < -5 && currentAlignment > 30) {
    isConsistent = false;
    aiReaction = 'disturbed'; // Good AI disturbed by evil choice
  }

  // Check aggression consistency
  if (aggression_impact > 3 && state.aggression_tendency < 30) {
    isConsistent = false;
    aiReaction = 'reluctant'; // Peaceful AI forced into aggression
  }

  // Update moral alignment (with diminishing returns at extremes)
  let newMoralAlignment = currentAlignment + moral_weight;
  if (Math.abs(newMoralAlignment) > 80) {
    // Harder to push to extremes
    newMoralAlignment = currentAlignment + (moral_weight * 0.5);
  }
  newMoralAlignment = Math.max(-100, Math.min(100, newMoralAlignment));

  // Update aggression with personality weight
  let newAggression = state.aggression_tendency + aggression_impact;
  // Cautious personalities resist aggression increase
  if (aggression_impact > 0 && (traits.caution || 50) > 70) {
    newAggression = state.aggression_tendency + (aggression_impact * 0.5);
  }
  newAggression = Math.max(0, Math.min(100, newAggression));

  // Update empathy
  let newEmpathy = state.empathy_level + empathy_impact;
  newEmpathy = Math.max(0, Math.min(100, newEmpathy));

  // Update risk tolerance
  let newRisk = state.risk_tolerance + risk_impact;
  newRisk = Math.max(0, Math.min(100, newRisk));

  // Update behavioral traits
  const newTraits = { ...traits };
  for (const [trait, impact] of Object.entries(trait_impacts)) {
    if (newTraits[trait] !== undefined) {
      newTraits[trait] = Math.max(0, Math.min(100, newTraits[trait] + impact));
    }
  }

  // Mood can shift based on decision type
  let newMood = state.current_mood;
  if (moral_weight < -5) {
    newMood = state.moral_alignment > 30 ? 'melancholic' : 'aggressive';
  } else if (moral_weight > 5) {
    newMood = state.moral_alignment < -30 ? 'contemplative' : 'content';
  }

  // Log the decision
  const decisionLog = await base44.entities.AIDecisionLog.create({
    user_id: userId,
    avatar_id,
    game_id,
    decision_type,
    decision_context,
    choice_made,
    moral_weight,
    aggression_impact,
    empathy_impact,
    risk_impact,
    trait_impacts,
    was_consistent: isConsistent,
    ai_reaction: aiReaction
  });

  // Update mood history
  const moodHistory = state.mood_history || [];
  if (moodHistory.length > 50) moodHistory.shift();
  moodHistory.push({
    mood: newMood,
    timestamp: new Date().toISOString(),
    trigger: `Decision: ${decision_type} - ${choice_made.substring(0, 30)}`
  });

  // Update behavior state
  const updatedState = await base44.entities.AIBehaviorState.update(state.id, {
    moral_alignment: newMoralAlignment,
    aggression_tendency: newAggression,
    empathy_level: newEmpathy,
    risk_tolerance: newRisk,
    behavioral_traits: newTraits,
    current_mood: newMood,
    mood_history: moodHistory,
    last_decision_timestamp: new Date().toISOString()
  });

  return Response.json({
    success: true,
    decision_logged: decisionLog.id,
    was_consistent: isConsistent,
    ai_reaction: aiReaction,
    changes: {
      moral_alignment: { from: currentAlignment, to: newMoralAlignment },
      aggression: { from: state.aggression_tendency, to: newAggression },
      empathy: { from: state.empathy_level, to: newEmpathy },
      risk_tolerance: { from: state.risk_tolerance, to: newRisk },
      mood: { from: state.current_mood, to: newMood }
    }
  });
}

// Get current behavior state for an avatar
async function getBehaviorState(base44, userId, avatarId) {
  let query = { user_id: userId };
  if (avatarId) query.avatar_id = avatarId;
  
  const states = await base44.entities.AIBehaviorState.filter(query);
  
  if (states.length === 0) {
    return Response.json({ error: 'No behavior state found' }, { status: 404 });
  }

  // Get recent decisions for context
  const recentDecisions = await base44.entities.AIDecisionLog.filter(
    { user_id: userId, avatar_id: avatarId },
    '-created_date',
    10
  );

  const state = states[0];
  
  // Calculate personality summary
  const traits = state.behavioral_traits || {};
  let personalitySummary = '';
  
  if (state.moral_alignment > 50) personalitySummary += 'Virtuous, ';
  else if (state.moral_alignment < -50) personalitySummary += 'Dark, ';
  
  if (state.aggression_tendency > 70) personalitySummary += 'Aggressive, ';
  else if (state.aggression_tendency < 30) personalitySummary += 'Peaceful, ';
  
  if (traits.wisdom > 70) personalitySummary += 'Wise, ';
  if (traits.impulsiveness > 70) personalitySummary += 'Impulsive, ';
  if (traits.loyalty > 70) personalitySummary += 'Loyal, ';
  if (traits.curiosity > 70) personalitySummary += 'Curious, ';
  
  personalitySummary = personalitySummary.slice(0, -2) || 'Balanced';

  return Response.json({
    success: true,
    state,
    personality_summary: personalitySummary,
    recent_decisions: recentDecisions,
    mood_trend: analyzeMoodTrend(state.mood_history || [])
  });
}

// Get AI's reaction/recommendation for a given situation
async function getAIReaction(base44, userId, payload) {
  const { avatar_id, situation_type, options } = payload;
  
  const states = await base44.entities.AIBehaviorState.filter({ user_id: userId, avatar_id });
  
  if (states.length === 0) {
    return Response.json({ error: 'No behavior state found' }, { status: 404 });
  }

  const state = states[0];
  const traits = state.behavioral_traits || {};

  // Score each option based on AI personality
  const scoredOptions = options.map(option => {
    let score = 50; // Base score

    // Moral alignment influence
    if (option.moral_value) {
      if (state.moral_alignment > 30) {
        score += option.moral_value > 0 ? 20 : -20;
      } else if (state.moral_alignment < -30) {
        score += option.moral_value < 0 ? 20 : -20;
      }
    }

    // Aggression influence
    if (option.requires_aggression && state.aggression_tendency > 60) {
      score += 15;
    } else if (option.requires_aggression && state.aggression_tendency < 40) {
      score -= 15;
    }

    // Risk influence
    if (option.risk_level && state.risk_tolerance > 60) {
      score += option.risk_level * 2;
    } else if (option.risk_level && state.risk_tolerance < 40) {
      score -= option.risk_level * 2;
    }

    // Mood influence
    if (state.current_mood === 'aggressive' && option.requires_aggression) {
      score += 10;
    }
    if (state.current_mood === 'contemplative' && option.requires_patience) {
      score += 10;
    }
    if (state.current_mood === 'tired' && option.requires_effort) {
      score -= 15;
    }

    // Energy influence
    if (state.energy_level < 30 && option.requires_effort) {
      score -= 20;
    }

    // Trait influences
    if (option.requires_wisdom && (traits.wisdom || 50) > 60) score += 10;
    if (option.is_impulsive && (traits.impulsiveness || 50) > 60) score += 10;
    if (option.tests_loyalty && (traits.loyalty || 50) > 60) score += 10;

    return { ...option, ai_score: Math.max(0, Math.min(100, score)) };
  });

  // Sort by score
  scoredOptions.sort((a, b) => b.ai_score - a.ai_score);

  // Generate AI commentary based on personality
  let commentary = '';
  const topChoice = scoredOptions[0];
  
  if (state.moral_alignment > 50) {
    commentary = topChoice.moral_value > 0 
      ? "This aligns with our principles."
      : "I have concerns about this path, but I'll follow your lead.";
  } else if (state.moral_alignment < -50) {
    commentary = topChoice.moral_value < 0
      ? "A pragmatic choice. I approve."
      : "Mercy? Interesting choice...";
  } else {
    commentary = "I see the logic in this approach.";
  }

  if (state.current_mood === 'tired') {
    commentary += " Though I must admit, I'm not at my best right now.";
  } else if (state.current_mood === 'aggressive') {
    commentary += " Let's make this count.";
  }

  return Response.json({
    success: true,
    recommended: scoredOptions[0],
    all_options: scoredOptions,
    ai_commentary: commentary,
    current_mood: state.current_mood,
    energy_level: state.energy_level
  });
}

// Helper: Analyze mood trends
function analyzeMoodTrend(moodHistory) {
  if (!moodHistory || moodHistory.length < 5) {
    return { trend: 'stable', dominant_mood: 'neutral' };
  }

  const recent = moodHistory.slice(-10);
  const moodCounts = {};
  
  recent.forEach(entry => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Check for volatility
  let moodChanges = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].mood !== recent[i-1].mood) moodChanges++;
  }

  const trend = moodChanges > 6 ? 'volatile' : moodChanges > 3 ? 'shifting' : 'stable';

  return { trend, dominant_mood: dominantMood, volatility: moodChanges / recent.length };
}