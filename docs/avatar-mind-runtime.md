# Atom × Eve Avatar Mind Runtime

## Purpose

Each player has one AI avatar vessel and one long-term mind seed. The vessel can be Erika Archer, Y-Bot, or a future custom model. The model is the body; the mind state is stored independently so changing bodies does not erase identity or history.

Every mind starts neutral. Genesis appearance/personality selections do not pre-write moral alignment, values, playstyle, or learned personality.

## Mind layers

1. **AvatarMindSeed** — compressed long-term identity, values, preferences, aspirations, playstyle, confidence and development stage.
2. **AvatarExperience** — chronological private experience ledger. This is the durable history of what the avatar observed.
3. **AvatarMemoryAnchor** — high-significance moments preserved as durable milestones (firsts, turning points, values, relationships, failures, victories, aspirations and preferences).
4. **AIBehaviorState** — fast-changing state such as mood, energy, risk, empathy, aggression and behavioral traits.
5. **AvatarReflectionPrompt** — questions the avatar asks when evidence is important but ambiguous.
6. **AvatarMindAgentState** — specialist agents with a single job each: Observer, Mirror, Historian, Reflection, Coach and Storyteller.
7. **AvatarObservationSettings** — player controls for event learning, screen observation, frame retention and reflection frequency.

## Specialist agent contract

- **Observer**: describe gameplay facts. Never invent motives.
- **Mirror**: update identity signals only from repeated evidence and player answers.
- **Historian**: preserve significant experiences without rewriting them.
- **Reflection**: ask one useful question instead of guessing intent.
- **Coach**: analyze mistakes/strengths without changing identity directly.
- **Storyteller**: compress accumulated history into a grounded autobiography.

## Native game event API

Any Atom-native game can teach the avatar by dispatching a structured experience:

```js
window.dispatchEvent(new CustomEvent('atom:game-experience', {
  detail: {
    source: 'game_event',
    game_id: 'game-123',
    game_name: 'Example Game',
    event_type: 'exploration_choice',
    title: 'Entered the dangerous route',
    context: 'The player could take a safe road or enter an unexplored ruin.',
    action: 'Entered the unexplored ruin',
    outcome: 'Found a hidden quest',
    significance: 65,
    emotional_valence: 30,
    telemetry: { optional: 'structured game data only' },
    signals: {
      trait_impacts: { curiosity: 2 },
      playstyle_impacts: { exploration: 3 },
      value_impacts: { curiosity: 2 },
      risk_impact: 1
    }
  }
}));
```

For explicit narrative decisions, the compatibility event remains supported:

```js
window.dispatchEvent(new CustomEvent('atom:player-decision', {
  detail: {
    game_id: 'game-123',
    game_name: 'Example Game',
    decision_type: 'moral_choice',
    decision_context: 'A defeated enemy asked for mercy.',
    choice_made: 'Spared the enemy',
    moral_weight: 3,
    empathy_impact: 2,
    significance: 80
  }
}));
```

Supported legacy decision types are `moral_choice`, `combat_action`, `dialogue_choice`, `resource_decision`, `alliance_action`, and `exploration_choice`.

## Screen observation

Screen observation is opt-in and uses the browser `getDisplayMedia` permission flow. The player chooses which screen/window to share. The service samples still frames rather than recording continuous video, reduces them in size, and sends sampled frames to the vision model for gameplay analysis.

The screen observer continues across Atom × Eve route changes until the player presses **Stop**, the browser ends screen sharing, or the tab is closed. A global badge is displayed while observation is active.

A sampled frame must currently be uploaded before vision analysis. When `store_frames` is false, the frame URL is not attached to the AvatarExperience record; however, the uploaded file itself may remain in app file storage until a future cleanup policy removes it.

## Reflection rule

The avatar should ask when evidence is meaningful but insufficient. It must not infer private real-world identity, protected traits, medical state, or motives from gameplay. Questions and answers are the preferred way to learn subjective information such as feelings, aspirations, favorites and reasons for moral decisions.

## Ownership of the mind

The mind belongs to the signed-in user. Backend operations verify that the target Avatar belongs to the authenticated user. Mind entities are private by default and are not intended to be exposed through public friend profiles without an explicit sharing feature.
