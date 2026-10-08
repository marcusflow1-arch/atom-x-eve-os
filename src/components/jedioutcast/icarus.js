// Browser-side reader for Raven's ICARUS .IBI block stream.
// Format and numeric IDs are ported directly from:
//   code/icarus/BlockStream.cpp
//   code/icarus/blockstream.h
//   code/icarus/interpreter.h
// in grayj/Jedi-Outcast at the pinned Raven source commit.

const IBI_VERSION = 1.57;

export const ICARUS_ID = Object.freeze({
  AFFECT: 19,
  SOUND: 20,
  MOVE: 21,
  ROTATE: 22,
  WAIT: 23,
  BLOCK_START: 24,
  BLOCK_END: 25,
  SET: 26,
  LOOP: 27,
  LOOPEND: 28,
  PRINT: 29,
  USE: 30,
  FLUSH: 31,
  RUN: 32,
  KILL: 33,
  REMOVE: 34,
  CAMERA: 35,
  GET: 36,
  RANDOM: 37,
  IF: 38,
  ELSE: 39,
  REM: 40,
  TASK: 41,
  DO: 42,
  DECLARE: 43,
  FREE: 44,
  DOWAIT: 45,
  SIGNAL: 46,
  WAITSIGNAL: 47,
  PLAY: 48,
  TAG: 49,
  EOF: 50,
});

export const ICARUS_TOKEN = Object.freeze({
  STRING: 4,
  INT: 5,
  FLOAT: 6,
  IDENTIFIER: 7,
  VECTOR: 14,
  GREATER_THAN: 15,
  LESS_THAN: 16,
  EQUALS: 17,
  NOT: 18,
});

const decoder = new TextDecoder();

function ensure(view, offset, size, label) {
  if (offset < 0 || size < 0 || offset + size > view.byteLength) {
    throw new Error(`ICARUS ${label} runs outside the .ibi stream.`);
  }
}

function stringValue(bytes) {
  const zero = bytes.indexOf(0);
  return decoder.decode(zero >= 0 ? bytes.subarray(0, zero) : bytes);
}

function decodeMember(id, bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if ((id === ICARUS_TOKEN.STRING || id === ICARUS_TOKEN.IDENTIFIER) && bytes.byteLength) {
    return stringValue(bytes);
  }
  if (id === ICARUS_TOKEN.INT && bytes.byteLength === 4) return view.getInt32(0, true);
  if (id === ICARUS_TOKEN.FLOAT && bytes.byteLength === 4) return view.getFloat32(0, true);
  if (id === ICARUS_TOKEN.VECTOR && bytes.byteLength === 12) {
    return [view.getFloat32(0, true), view.getFloat32(4, true), view.getFloat32(8, true)];
  }
  if (bytes.byteLength === 4) return view.getFloat32(0, true);
  return bytes.slice();
}

export function parseIbi(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  ensure(view, 0, 8, 'header');

  if (bytes[0] !== 0x49 || bytes[1] !== 0x42 || bytes[2] !== 0x49 || bytes[3] !== 0x00) {
    throw new Error('Not a Raven ICARUS IBI stream.');
  }
  const version = view.getFloat32(4, true);
  if (Math.abs(version - IBI_VERSION) > 0.00001) {
    throw new Error(`Unsupported ICARUS IBI version ${version}; expected ${IBI_VERSION}.`);
  }

  const blocks = [];
  let offset = 8;

  while (offset < bytes.byteLength) {
    ensure(view, offset, 9, 'block header');
    const id = view.getInt32(offset, true);
    const memberCount = view.getInt32(offset + 4, true);
    const flags = view.getUint8(offset + 8);
    offset += 9;

    if (memberCount < 0 || memberCount > 100000) throw new Error('Invalid ICARUS member count.');

    const members = [];
    for (let i = 0; i < memberCount; i++) {
      ensure(view, offset, 8, 'member header');
      const memberId = view.getInt32(offset, true);
      const size = view.getInt32(offset + 4, true);
      offset += 8;
      if (size < 0 || size > 64 * 1024 * 1024) throw new Error('Invalid ICARUS member size.');
      ensure(view, offset, size, 'member payload');
      const raw = bytes.slice(offset, offset + size);
      offset += size;
      members.push({ id: memberId, size, value: decodeMember(memberId, raw), raw });
    }

    blocks.push({ id, flags, members });
  }

  return { version, blocks };
}

function firstString(block) {
  return block.members.find(member => member.id === ICARUS_TOKEN.STRING)?.value ?? '';
}

function memberValue(member) {
  if (!member) return null;
  if (member.id === ICARUS_TOKEN.STRING) {
    const text = String(member.value);
    const numeric = Number(text);
    return text.trim() !== '' && Number.isFinite(numeric) ? numeric : text;
  }
  return member.value;
}

function parseCondition(block, state) {
  const property = block.members.find(member => member.id === ICARUS_TOKEN.STRING)?.value;
  const op = block.members.find(member => [
    ICARUS_TOKEN.EQUALS,
    ICARUS_TOKEN.GREATER_THAN,
    ICARUS_TOKEN.LESS_THAN,
    ICARUS_TOKEN.NOT,
  ].includes(member.id));
  const rhsMember = [...block.members].reverse().find(member =>
    member.id === ICARUS_TOKEN.STRING ||
    member.id === ICARUS_TOKEN.FLOAT ||
    member.id === ICARUS_TOKEN.INT
  );
  const rhs = memberValue(rhsMember);

  let lhs;
  if (property === 'SET_SKILL') lhs = state.player.skill;
  else if (Object.prototype.hasOwnProperty.call(state.variables, property)) lhs = state.variables[property];
  else lhs = state.globals[property];

  if (!op) return Boolean(lhs);
  if (op.id === ICARUS_TOKEN.EQUALS) return Number.isFinite(Number(lhs)) && Number.isFinite(Number(rhs))
    ? Number(lhs) === Number(rhs)
    : String(lhs) === String(rhs);
  if (op.id === ICARUS_TOKEN.NOT) return Number.isFinite(Number(lhs)) && Number.isFinite(Number(rhs))
    ? Number(lhs) !== Number(rhs)
    : String(lhs) !== String(rhs);
  if (op.id === ICARUS_TOKEN.GREATER_THAN) return Number(lhs) > Number(rhs);
  if (op.id === ICARUS_TOKEN.LESS_THAN) return Number(lhs) < Number(rhs);
  return false;
}

function findBodyEnd(blocks, start) {
  let depth = 0;
  for (let i = start; i < blocks.length; i++) {
    const id = blocks[i].id;
    if (id === ICARUS_ID.AFFECT || id === ICARUS_ID.IF || id === ICARUS_ID.ELSE || id === ICARUS_ID.LOOP) depth++;
    if (id === ICARUS_ID.BLOCK_END) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return blocks.length;
}

function applySet(state, target, key, value) {
  const normalized = String(key || '');

  if (target === 'kyle') {
    const forceMap = {
      SET_FORCE_JUMP_LEVEL: 'levitation',
      SET_FORCE_PUSH_LEVEL: 'push',
      SET_FORCE_PULL_LEVEL: 'pull',
      SET_FORCE_SPEED_LEVEL: 'speed',
      SET_FORCE_HEAL_LEVEL: 'heal',
      SET_FORCE_GRIP_LEVEL: 'grip',
      SET_FORCE_MINDTRICK_LEVEL: 'telepathy',
      SET_FORCE_LIGHTNING_LEVEL: 'lightning',
      SET_SABER_THROW: 'saber_throw',
      SET_SABER_DEFENSE: 'saber_defense',
      SET_SABER_OFFENSE: 'saber_offense',
    };
    if (forceMap[normalized]) {
      state.player.force[forceMap[normalized]] = Number(value) || 0;
      return;
    }
    if (normalized === 'SET_ARMOR') {
      state.player.armor = Number(value) || 0;
      return;
    }
  }

  if (Object.prototype.hasOwnProperty.call(state.variables, normalized)) {
    state.variables[normalized] = value;
    return;
  }

  const entityName = target || '$global';
  state.entitySettings[entityName] ||= {};
  state.entitySettings[entityName][normalized] = value;
}

function executeRange(blocks, start, end, state, target = null) {
  let i = start;
  while (i < end) {
    const block = blocks[i];

    if (block.id === ICARUS_ID.BLOCK_END) return i + 1;

    if (block.id === ICARUS_ID.AFFECT) {
      const affected = firstString(block);
      const bodyEnd = findBodyEnd(blocks, i + 1);
      executeRange(blocks, i + 1, bodyEnd, state, affected);
      i = bodyEnd + 1;
      continue;
    }

    if (block.id === ICARUS_ID.IF) {
      const bodyEnd = findBodyEnd(blocks, i + 1);
      const passed = parseCondition(block, state);
      if (passed) executeRange(blocks, i + 1, bodyEnd, state, target);
      i = bodyEnd + 1;

      if (i < end && blocks[i].id === ICARUS_ID.ELSE) {
        const elseEnd = findBodyEnd(blocks, i + 1);
        if (!passed) executeRange(blocks, i + 1, elseEnd, state, target);
        i = elseEnd + 1;
      }
      continue;
    }

    if (block.id === ICARUS_ID.ELSE) {
      const bodyEnd = findBodyEnd(blocks, i + 1);
      executeRange(blocks, i + 1, bodyEnd, state, target);
      i = bodyEnd + 1;
      continue;
    }

    if (block.id === ICARUS_ID.DECLARE) {
      const name = firstString(block);
      if (name && !Object.prototype.hasOwnProperty.call(state.variables, name)) state.variables[name] = 0;
      i++;
      continue;
    }

    if (block.id === ICARUS_ID.SET) {
      const stringMembers = block.members.filter(member => member.id === ICARUS_TOKEN.STRING);
      const key = stringMembers[0]?.value ?? '';
      const valueMember = block.members.find((member, index) =>
        index > 0 && [
          ICARUS_TOKEN.STRING,
          ICARUS_TOKEN.FLOAT,
          ICARUS_TOKEN.INT,
          ICARUS_TOKEN.VECTOR,
        ].includes(member.id)
      );
      applySet(state, target, key, memberValue(valueMember));
      i++;
      continue;
    }

    if (block.id === ICARUS_ID.USE) {
      const name = firstString(block);
      if (name) state.events.push({ type: 'use', target: name });
      i++;
      continue;
    }

    if (block.id === ICARUS_ID.RUN) {
      const name = firstString(block);
      if (name) state.events.push({ type: 'run', script: name, target });
      i++;
      continue;
    }

    // Preserve unimplemented original commands for the next execution layer.
    state.pending.push({ target, block });
    i++;
  }
  return i;
}

export function executeIbi(ibi, options = {}) {
  const state = {
    player: {
      skill: Number(options.skill ?? 0),
      armor: 0,
      force: {},
    },
    variables: {},
    globals: {},
    entitySettings: {},
    events: [],
    pending: [],
  };

  executeRange(ibi.blocks, 0, ibi.blocks.length, state, null);
  return state;
}
