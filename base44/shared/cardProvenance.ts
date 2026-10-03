import {
  acquireCardMutationLock,
  acquireCardMutationLocks,
  refreshCardMutationLock,
  releaseCardMutationLock,
  releaseCardMutationLocks,
} from './cardMutationLock.ts';
import { rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;
type EventOptions = { lock_token?: string; event_key?: string; owner_id?: string };
type PassportOptions = Row & { lock_token?: string };

const now = () => new Date().toISOString();

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

async function eventHash(passportId: string, sequence: number, previousHash: string, eventType: string, payload: Row, timestamp: string) {
  return sha256(JSON.stringify(stable({ passportId, sequence, previousHash, eventType, payload, timestamp })));
}

async function assertProvidedLock(svc: any, cardId: string, token: string) {
  const live = await svc.UserCard.get(String(cardId));
  if (String(live?.mutation_lock_id || '') !== String(token || '')) {
    throw rewardError('Card provenance mutation lost its card lease', 409);
  }
  await refreshCardMutationLock(svc, {
    card_id: String(cardId),
    token: String(token),
    kind: String(live.mutation_lock_kind || 'card_provenance'),
    expires_at: String(live.mutation_lock_until || ''),
  });
  return live;
}

async function withCardLease<T>(
  svc: any,
  cardId: string,
  ownerId: string | null,
  kind: string,
  providedToken: string | undefined,
  fn: (token: string) => Promise<T>,
): Promise<T> {
  if (providedToken) {
    await assertProvidedLock(svc, cardId, providedToken);
    return fn(providedToken);
  }
  const lock = await acquireCardMutationLock(svc, cardId, ownerId, kind);
  try {
    return await fn(lock.token);
  } finally {
    await releaseCardMutationLock(svc, lock);
  }
}

async function findPassport(svc: any, userCardId: string) {
  const rows = await svc.CardPassport.filter({ user_card_id: String(userCardId) }, '-created_date', 2).catch(() => []);
  if ((rows || []).length > 1) throw rewardError('Multiple digital passports exist for this card and require reconciliation', 409);
  return rows?.[0] || null;
}

async function findEventByKey(svc: any, passportId: string, eventKey: string) {
  if (!eventKey) return null;
  const rows = await svc.CardProvenanceEvent.filter({ passport_id: passportId, event_key: eventKey }, '-created_date', 2).catch(() => []);
  if ((rows || []).length > 1) throw rewardError('Duplicate provenance events require reconciliation', 409);
  return rows?.[0] || null;
}

export async function appendProvenanceEvent(
  svc: any,
  passport: Row,
  eventType: string,
  payload: Row = {},
  options: EventOptions = {},
) {
  const cardId = String(passport.user_card_id || '');
  if (!cardId) throw rewardError('Card Passport is missing its card identity', 409);
  return withCardLease(svc, cardId, null, `passport:${eventType}`, options.lock_token, async (lockToken) => {
    const freshPassport = await svc.CardPassport.get(passport.id);
    const eventKey = String(options.event_key || '');
    const existing = await findEventByKey(svc, freshPassport.passport_id, eventKey);
    if (existing) return existing;

    const prior = await svc.CardProvenanceEvent.filter({ passport_id: freshPassport.passport_id }, '-created_date', 1).catch(() => []);
    const previous = prior?.[0] || null;
    const sequence = Math.max(Number(freshPassport.event_count || 0), Number(previous?.sequence || 0)) + 1;
    const timestamp = now();
    const previousHash = String(freshPassport.head_hash || previous?.event_hash || 'GENESIS');
    const hash = await eventHash(freshPassport.passport_id, sequence, previousHash, eventType, payload, timestamp);
    await assertProvidedLock(svc, cardId, lockToken);
    const event = await svc.CardProvenanceEvent.create({
      passport_id: freshPassport.passport_id,
      user_card_id: freshPassport.user_card_id,
      trading_card_id: freshPassport.trading_card_id || '',
      event_key: eventKey,
      sequence,
      event_type: eventType,
      owner_id: options.owner_id ?? freshPassport.current_owner_id ?? '',
      timestamp,
      previous_hash: previousHash,
      event_hash: hash,
      payload,
    });
    await svc.CardPassport.update(freshPassport.id, {
      head_hash: hash,
      event_count: sequence,
      updated_at: timestamp,
    });
    return event;
  });
}

export async function ensureCardPassport(svc: any, card: Row, options: PassportOptions = {}) {
  const cardId = String(card?.id || '');
  if (!cardId) throw rewardError('Cannot register a Passport without a card ID', 409);
  const existing = await findPassport(svc, cardId);
  if (existing) return existing;

  return withCardLease(svc, cardId, card.user_id ? String(card.user_id) : null, 'passport:register', options.lock_token, async (lockToken) => {
    const raced = await findPassport(svc, cardId);
    if (raced) return raced;
    const createdAt = card.acquired_at || card.unlocked_date || now();
    const passportId = String(card.passport_id || '') || `AXE-${crypto.randomUUID()}`;
    let passport = await svc.CardPassport.create({
      passport_id: passportId,
      user_card_id: cardId,
      trading_card_id: String(card.trading_card_id || ''),
      card_name: card.card_name || options.card_name || 'Card',
      current_owner_id: String(card.user_id || ''),
      original_owner_id: String(options.original_owner_id || card.user_id || ''),
      created_at: createdAt,
      updated_at: createdAt,
      status: 'active',
      authenticity_status: 'registered_internal',
      ledger_adapter: 'internal_hash_chain_v1',
      external_ledger_status: 'not_anchored',
      event_count: 0,
      head_hash: '',
    });
    await appendProvenanceEvent(svc, passport, 'minted', {
      owner_id: card.user_id || '',
      acquisition_method: card.acquisition_method || card.source || 'unlocked',
      source: card.source || '',
      acquired_at: createdAt,
    }, {
      lock_token: lockToken,
      event_key: `mint:${cardId}`,
      owner_id: String(card.user_id || ''),
    });
    passport = await svc.CardPassport.get(passport.id);
    return passport;
  });
}

export async function recordOwnershipTransfer(
  svc: any,
  card: Row,
  fromOwnerId: string,
  toOwnerId: string,
  method: string,
  transferId = '',
  options: EventOptions = {},
) {
  const cardId = String(card.id || '');
  return withCardLease(svc, cardId, null, `passport:transfer:${method}`, options.lock_token, async (lockToken) => {
    let passport = await findPassport(svc, cardId);
    if (!passport) {
      passport = await ensureCardPassport(svc, { ...card, user_id: fromOwnerId }, {
        lock_token: lockToken,
        original_owner_id: fromOwnerId,
      });
    }
    const eventKey = String(options.event_key || `ownership:${method}:${transferId || `${fromOwnerId}:${toOwnerId}`}`);
    const previousEvent = await findEventByKey(svc, passport.passport_id, eventKey);
    if (previousEvent && String(passport.current_owner_id || '') === String(toOwnerId)) return passport;
    if (String(passport.current_owner_id || '') !== String(fromOwnerId) && String(passport.current_owner_id || '') !== String(toOwnerId)) {
      throw rewardError('Card Passport owner no longer matches this transfer', 409);
    }
    if (String(passport.current_owner_id || '') !== String(toOwnerId)) {
      passport = await svc.CardPassport.update(passport.id, {
        current_owner_id: String(toOwnerId),
        updated_at: now(),
      });
    }
    await appendProvenanceEvent(svc, passport, 'ownership_transfer', {
      from_owner_id: fromOwnerId,
      to_owner_id: toOwnerId,
      method,
      transfer_id: transferId,
    }, {
      lock_token: lockToken,
      event_key: eventKey,
      owner_id: String(toOwnerId),
    });
    return svc.CardPassport.get(passport.id);
  });
}

export async function recordAscensionMilestone(
  svc: any,
  card: Row,
  progression: Row,
  ascension: number,
  options: EventOptions = {},
) {
  return withCardLease(svc, String(card.id), card.user_id ? String(card.user_id) : null, 'passport:ascension', options.lock_token, async (lockToken) => {
    const passport = await ensureCardPassport(svc, card, { lock_token: lockToken });
    await appendProvenanceEvent(svc, passport, 'ascension', {
      ascension,
      enhancement_percent: Number(progression.enhancement_percent || 0),
      stack_level: Number(progression.stack_level || 1),
      power_score: Number(progression.power_score || 0),
      mastery_visual: progression.mastery_visual || '',
    }, {
      lock_token: lockToken,
      event_key: String(options.event_key || `ascension:${progression.id || card.id}:${ascension}`),
    });
    return svc.CardPassport.get(passport.id);
  });
}

export async function recordStackMilestone(
  svc: any,
  card: Row,
  progression: Row,
  consumedCard: Row,
  options: { target_lock_token?: string; consumed_lock_token?: string; event_key?: string } = {},
) {
  let ownedLocks: any[] = [];
  let targetToken = options.target_lock_token;
  let consumedToken = options.consumed_lock_token;
  if (!targetToken || !consumedToken) {
    ownedLocks = await acquireCardMutationLocks(svc, [
      { id: String(card.id), owner_id: card.user_id || null },
      { id: String(consumedCard.id), owner_id: consumedCard.user_id || null },
    ], 'passport:stack');
    targetToken = ownedLocks.find((lock) => lock.card_id === String(card.id))?.token;
    consumedToken = ownedLocks.find((lock) => lock.card_id === String(consumedCard.id))?.token;
  }
  try {
    const targetPassport = await ensureCardPassport(svc, card, { lock_token: targetToken });
    let consumedPassport = await ensureCardPassport(svc, consumedCard, { lock_token: consumedToken });
    const stackLevel = Number(progression.stack_level || 1);
    const stackKey = String(options.event_key || `stack:${card.id}:${consumedCard.id}:${stackLevel}`);
    await appendProvenanceEvent(svc, targetPassport, 'stack_upgrade', {
      stack_level: stackLevel,
      consumed_passport_id: consumedPassport.passport_id,
      consumed_user_card_id: consumedCard.id,
    }, {
      lock_token: targetToken,
      event_key: stackKey,
    });
    if (consumedPassport.status !== 'consumed') {
      consumedPassport = await svc.CardPassport.update(consumedPassport.id, {
        status: 'consumed',
        current_owner_id: '',
        updated_at: now(),
      });
    }
    await appendProvenanceEvent(svc, consumedPassport, 'consumed_into_stack', {
      target_passport_id: targetPassport.passport_id,
      target_user_card_id: card.id,
    }, {
      lock_token: consumedToken,
      event_key: `consumed:${stackKey}`,
      owner_id: '',
    });
    return svc.CardPassport.get(targetPassport.id);
  } finally {
    if (ownedLocks.length) await releaseCardMutationLocks(svc, ownedLocks);
  }
}

export async function publicPassport(svc: any, card: Row) {
  const passport = await ensureCardPassport(svc, card);
  const events = await svc.CardProvenanceEvent.filter({ passport_id: passport.passport_id }, 'created_date', 250).catch(() => []);
  const liveCard = await svc.UserCard.get(String(card.id)).catch(() => card);
  return {
    passport_id: passport.passport_id,
    authenticity_status: passport.authenticity_status,
    ledger_adapter: passport.ledger_adapter,
    external_ledger_status: passport.external_ledger_status,
    status: passport.status,
    minted_at: passport.created_at,
    current_owner_id: passport.current_owner_id,
    original_owner_id: passport.original_owner_id,
    ownership_consistent: String(passport.current_owner_id || '') === String(liveCard?.user_id || ''),
    event_count: Number(passport.event_count || events.length),
    head_hash: passport.head_hash || '',
    events: (events || []).map((event: Row) => ({
      sequence: event.sequence,
      event_key: event.event_key || '',
      event_type: event.event_type,
      timestamp: event.timestamp,
      event_hash: event.event_hash,
      previous_hash: event.previous_hash,
      payload: event.payload || {},
    })),
  };
}
