type Row = Record<string, any>;

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

export async function appendProvenanceEvent(svc: any, passport: Row, eventType: string, payload: Row = {}) {
  const prior = await svc.CardProvenanceEvent.filter({ passport_id: passport.passport_id }, '-created_date', 1).catch(() => []);
  const previous = prior?.[0] || null;
  const sequence = Number(previous?.sequence || 0) + 1;
  const timestamp = now();
  const previousHash = String(previous?.event_hash || 'GENESIS');
  const hash = await eventHash(passport.passport_id, sequence, previousHash, eventType, payload, timestamp);
  const event = await svc.CardProvenanceEvent.create({
    passport_id: passport.passport_id,
    user_card_id: passport.user_card_id,
    trading_card_id: passport.trading_card_id || '',
    sequence,
    event_type: eventType,
    owner_id: passport.current_owner_id || '',
    timestamp,
    previous_hash: previousHash,
    event_hash: hash,
    payload,
  });
  await svc.CardPassport.update(passport.id, {
    head_hash: hash,
    event_count: sequence,
    updated_at: timestamp,
  });
  return event;
}

export async function ensureCardPassport(svc: any, card: Row, options: Row = {}) {
  const existing = await svc.CardPassport.filter({ user_card_id: String(card.id) }, '-created_date', 2).catch(() => []);
  if ((existing || []).length > 1) throw new Error('Multiple digital passports exist for this card');
  if (existing?.[0]) {
    const passport = existing[0];
    if (String(passport.current_owner_id || '') !== String(card.user_id || '')) {
      const updated = await svc.CardPassport.update(passport.id, { current_owner_id: card.user_id || '', updated_at: now() });
      return updated;
    }
    return passport;
  }
  const createdAt = card.acquired_at || card.unlocked_date || now();
  const passportId = `AXE-${crypto.randomUUID()}`;
  let passport = await svc.CardPassport.create({
    passport_id: passportId,
    user_card_id: String(card.id),
    trading_card_id: String(card.trading_card_id || ''),
    card_name: card.card_name || options.card_name || 'Card',
    current_owner_id: String(card.user_id || ''),
    original_owner_id: String(card.user_id || ''),
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
  });
  passport = await svc.CardPassport.get(passport.id);
  return passport;
}

export async function recordOwnershipTransfer(svc: any, card: Row, fromOwnerId: string, toOwnerId: string, method: string, transferId = '') {
  let passport = await ensureCardPassport(svc, { ...card, user_id: fromOwnerId });
  passport = await svc.CardPassport.update(passport.id, {
    current_owner_id: toOwnerId,
    updated_at: now(),
  });
  await appendProvenanceEvent(svc, passport, 'ownership_transfer', {
    from_owner_id: fromOwnerId,
    to_owner_id: toOwnerId,
    method,
    transfer_id: transferId,
  });
  return svc.CardPassport.get(passport.id);
}

export async function recordAscensionMilestone(svc: any, card: Row, progression: Row, ascension: number) {
  const passport = await ensureCardPassport(svc, card);
  await appendProvenanceEvent(svc, passport, 'ascension', {
    ascension,
    enhancement_percent: Number(progression.enhancement_percent || 0),
    stack_level: Number(progression.stack_level || 1),
    power_score: Number(progression.power_score || 0),
    mastery_visual: progression.mastery_visual || '',
  });
  return svc.CardPassport.get(passport.id);
}

export async function recordStackMilestone(svc: any, card: Row, progression: Row, consumedCard: Row) {
  const targetPassport = await ensureCardPassport(svc, card);
  const consumedPassport = await ensureCardPassport(svc, consumedCard);
  await appendProvenanceEvent(svc, targetPassport, 'stack_upgrade', {
    stack_level: Number(progression.stack_level || 1),
    consumed_passport_id: consumedPassport.passport_id,
    consumed_user_card_id: consumedCard.id,
  });
  const retired = await svc.CardPassport.update(consumedPassport.id, {
    status: 'consumed',
    current_owner_id: '',
    updated_at: now(),
  });
  await appendProvenanceEvent(svc, retired, 'consumed_into_stack', {
    target_passport_id: targetPassport.passport_id,
    target_user_card_id: card.id,
  });
  return svc.CardPassport.get(targetPassport.id);
}

export async function publicPassport(svc: any, card: Row) {
  const passport = await ensureCardPassport(svc, card);
  const events = await svc.CardProvenanceEvent.filter({ passport_id: passport.passport_id }, 'created_date', 250).catch(() => []);
  return {
    passport_id: passport.passport_id,
    authenticity_status: passport.authenticity_status,
    ledger_adapter: passport.ledger_adapter,
    external_ledger_status: passport.external_ledger_status,
    status: passport.status,
    minted_at: passport.created_at,
    current_owner_id: passport.current_owner_id,
    original_owner_id: passport.original_owner_id,
    event_count: Number(passport.event_count || events.length),
    head_hash: passport.head_hash || '',
    events: (events || []).map((event: Row) => ({
      sequence: event.sequence,
      event_type: event.event_type,
      timestamp: event.timestamp,
      event_hash: event.event_hash,
      previous_hash: event.previous_hash,
      payload: event.payload || {},
    })),
  };
}
