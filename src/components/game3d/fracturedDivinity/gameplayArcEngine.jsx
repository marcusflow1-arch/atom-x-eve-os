// ─────────────────────────────────────────────────────────────────────────────
// DIVIDED: RECLAMATION — Arc Progression Engine
// Arc triggers, loop mechanic, final split, ending resolution
// ─────────────────────────────────────────────────────────────────────────────

import {
  GameState, advanceArc, setFlag, getFlag, modifyControl,
  setCopyState, setArtemisState, unlockAbility, recordHistory, notify,
} from './gameplayState';

// ── Loop Mechanic (Arc 7) ─────────────────────────────────────────────────────

let loopCount = 0;
let loopPatternHistory = [];

export function startLoopMechanic(onDialogue) {
  loopCount = 0;
  loopPatternHistory = [];
  runLoop(onDialogue);
}

function runLoop(onDialogue) {
  loopCount++;

  if (loopCount > 3 || getFlag('loop_broken')) {
    onDialogue({
      text: '[You broke the loop. The cycle is open.]',
      speaker: 'Inner Voice',
      choices: [],
      isEnd: true,
      outcome: 'loop_broken',
    });
    setFlag('loop_broken');
    modifyControl(+15);
    return;
  }

  onDialogue({
    text: `ARTEMIS: "…We made it out." [Loop iteration ${loopCount}]`,
    speaker: 'Artemis',
    choices: [
      {
        text: 'Change action — do something different',
        tone: 'AWAKENING',
        action: () => {
          modifyControl(+5);
          loopPatternHistory.push('changed');
          // Break after 2 changes
          if (loopPatternHistory.filter(p => p === 'changed').length >= 2) {
            setFlag('loop_broken');
          }
          runLoop(onDialogue);
        },
      },
      {
        text: 'Repeat the same action',
        tone: 'DREAD',
        action: () => {
          modifyControl(-10);
          loopPatternHistory.push('repeated');
          runLoop(onDialogue);
        },
      },
    ],
  });
}

// ── Final Split (Arc 9) ───────────────────────────────────────────────────────

export function triggerFinalSplit(onDialogue) {
  onDialogue({
    text: 'COPY: "No more hiding behind each other." ARTEMIS: "Stop—this isn\'t helping!" Choose your identity.',
    speaker: 'System',
    choices: [
      {
        text: 'Integrate — merge with the Copy',
        tone: 'RESOLVE',
        action: () => {
          setCopyState('INTEGRATED');
          unlockAbility('split_action');
          modifyControl(+10);
          setFlag('arc9_integrated');
          recordHistory({ event: 'final_split', choice: 'INTEGRATED' });
        },
      },
      {
        text: 'Control — keep the Copy at distance',
        tone: 'AUTHORITY',
        action: () => {
          setCopyState('CONTROLLED');
          modifyControl(+5);
          setFlag('arc9_controlled');
          recordHistory({ event: 'final_split', choice: 'CONTROLLED' });
        },
      },
      {
        text: 'Surrender — let the Copy lead',
        tone: 'FRACTURE',
        action: () => {
          setCopyState('DOMINATED');
          modifyControl(-10);
          setFlag('arc9_dominated');
          recordHistory({ event: 'final_split', choice: 'DOMINATED' });
        },
      },
      {
        text: 'Separate — the Copy is its own entity',
        tone: 'IDENTITY',
        action: () => {
          setCopyState('SEPARATED');
          setFlag('arc9_separated');
          recordHistory({ event: 'final_split', choice: 'SEPARATED' });
        },
      },
    ],
  });
}

// ── Divine Encounter (Arc 8) ──────────────────────────────────────────────────

export function triggerDivineEncounter(onDialogue) {
  onDialogue({
    text: 'PRESENCE: "You endured." ARTEMIS: "That\'s not an answer!" PRESENCE: "You seek certainty where there is none."',
    speaker: 'The Presence',
    choices: [
      {
        text: '"You failed me." — Hold the judgment.',
        tone: 'CONFLICT',
        action: () => {
          setFlag('verdict_failed');
          modifyControl(-5);
          recordHistory({ event: 'divine_verdict', choice: 'FAILED' });
        },
      },
      {
        text: '"I accept the purpose." — Partial understanding.',
        tone: 'RESOLVE',
        action: () => {
          setFlag('verdict_purpose');
          modifyControl(+5);
          recordHistory({ event: 'divine_verdict', choice: 'PURPOSE' });
        },
      },
      {
        text: '"My experience is mine alone." — Autonomy.',
        tone: 'AUTHORITY',
        action: () => {
          setFlag('verdict_autonomy');
          modifyControl(+10);
          recordHistory({ event: 'divine_verdict', choice: 'AUTONOMY' });
        },
      },
      {
        text: '"I don\'t know." — Hold the uncertainty.',
        tone: 'PHILOSOPHICAL',
        action: () => {
          setFlag('verdict_honest');
          modifyControl(+8);
          recordHistory({ event: 'divine_verdict', choice: 'HONEST' });
        },
      },
    ],
  });
}

// ── Fake Kingdom (Arc 6) ──────────────────────────────────────────────────────

export function triggerFakeKingdom(onDialogue) {
  onDialogue({
    text: 'FIGURE: "You\'ve suffered enough." ARTEMIS: "…It feels wrong." COPY: "Because it is."',
    speaker: 'Welcoming Figure',
    choices: [
      {
        text: '"I\'ll stay." — Accept the peace.',
        tone: 'OPPRESSION',
        action: () => {
          setFlag('accepted_peace');
          modifyControl(-20);
          recordHistory({ event: 'fake_kingdom', choice: 'ACCEPTED' });
        },
      },
      {
        text: '"This is wrong." — Reject and push through.',
        tone: 'RESOLVE',
        action: () => {
          setFlag('rejected_peace');
          modifyControl(+10);
          recordHistory({ event: 'fake_kingdom', choice: 'REJECTED' });
        },
      },
      {
        text: '"I need more time." — Stay longer.',
        tone: 'DREAD',
        action: () => {
          setFlag('delayed_peace');
          modifyControl(-10);
          setArtemisState('FADING');
          recordHistory({ event: 'fake_kingdom', choice: 'DELAYED' });
        },
      },
    ],
  });
}

// ── Final Ending (Arc 10) ─────────────────────────────────────────────────────

export function triggerEnding(onDialogue) {
  onDialogue({
    text: 'PLAYER: "What defines my reality?" ARTEMIS: "…Just you." COPY: "Us."',
    speaker: 'Player',
    choices: [
      {
        text: '"I decide what happens next." — Self-Mastery',
        tone: 'AUTHORITY',
        action: () => {
          setFlag('ending_mastery');
          setFlag('ending_final_word_MINE');
          recordHistory({ event: 'final_ending', choice: 'MASTERY' });
        },
      },
      {
        text: '"I don\'t need to hold onto any of it." — Release',
        tone: 'RESOLVE',
        action: () => {
          setFlag('ending_release');
          setFlag('ending_final_word_FREE');
          recordHistory({ event: 'final_ending', choice: 'RELEASE' });
        },
      },
      {
        text: '"There\'s more out there." — Continuation',
        tone: 'RESOLVE',
        action: () => {
          setFlag('ending_continue');
          setFlag('ending_final_word_DECIDED');
          recordHistory({ event: 'final_ending', choice: 'CONTINUATION' });
        },
      },
      {
        text: '"This isn\'t the end. It\'s a beginning." — Create',
        tone: 'CLARITY',
        action: () => {
          setFlag('ending_create');
          setFlag('ending_final_word_WHOLE');
          recordHistory({ event: 'final_ending', choice: 'CREATION' });
        },
      },
    ],
  });
}

// ── Arc Gate: fires the right trigger per arc ─────────────────────────────────

export function onArcAdvance(newArc, onDialogue) {
  switch (newArc) {
    case 4:  unlockAbility('split_action');  break;
    case 3:  unlockAbility('anchor');        break;
    case 3:  unlockAbility('see_through');   break;
    case 5:  unlockAbility('override');      break;
    case 6:  triggerFakeKingdom(onDialogue); break;
    case 7:  startLoopMechanic(onDialogue);  break;
    case 8:  triggerDivineEncounter(onDialogue); break;
    case 9:  triggerFinalSplit(onDialogue);  break;
    case 10: triggerEnding(onDialogue);      break;
  }
}

// ── Virus Event (mid-arc trigger) ─────────────────────────────────────────────

export function virusEvent(onDialogue) {
  onDialogue({
    text: 'SYSTEM: "Correction applied." — Controls invert. Reality destabilized.',
    speaker: 'System Voice',
    mechanicEffect: 'invert_controls',
    choices: [
      {
        text: 'Resist — stay calm, regain control',
        tone: 'RESOLVE',
        action: () => {
          modifyControl(+10);
          setFlag('virus_resisted');
          recordHistory({ event: 'virus_event', choice: 'RESISTED' });
        },
      },
      {
        text: 'Submit — let the correction happen',
        tone: 'OPPRESSION',
        action: () => {
          modifyControl(-15);
          setFlag('virus_submitted');
          recordHistory({ event: 'virus_event', choice: 'SUBMITTED' });
        },
      },
    ],
  });
}

// ── Active Mechanics per Control Level ────────────────────────────────────────

export function getActiveMechanics() {
  const control = GameState.control;
  return {
    inputDelay:        control < 30,
    cameraDistortion:  control < 40,
    abilityMisfire:    control < 20,
    dialogueCorrupt:   control < 15,
    fullControl:       control >= 80,
    preciseMovement:   control >= 60,
  };
}