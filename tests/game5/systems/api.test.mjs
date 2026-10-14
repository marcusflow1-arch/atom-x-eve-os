import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSystemsRepository } from "../../../src/game5/systems/repository.mjs";
import { createSystemsHandler } from "../../../src/game5/systems/api.mjs";
const origin = "https://game.example";
function setup(t, overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), "g5-"));
  const path = join(dir, "systems.sqlite");
  const repository = createSystemsRepository(path);
  t.after(() => {
    repository.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const handler = createSystemsHandler({
    repository,
    allowedOrigins: [origin],
    authenticate: async () => ({
      authenticated: true,
      playerId: "base44:test",
    }),
    clock: () => 10000,
    random: () => 0.5,
    ...overrides,
  });
  const get = () => handler(new Request(`${origin}/api/game5/systems`));
  const send = (body, headers = {}) =>
    handler(
      new Request(`${origin}/api/game5/systems`, {
        method: "POST",
        headers: { origin, "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      }),
    );
  return { get, send, repository, path };
}
const envelope = (command, extra = {}) => ({
  id: "request_0001",
  sequence: 1,
  expectedRevision: 0,
  command,
  ...extra,
});
test("authenticated reads persist initial state but exclude idempotency receipts", async (t) => {
  const s = setup(t);
  const result = await (await s.get()).json();
  assert.equal(result.player.wallet.cp, 0);
  assert.equal(result.player.level, 1);
  assert.equal(result.player.receipts, undefined);
  const second = createSystemsRepository(s.path);
  try {
    assert.equal(
      second.transaction("base44:test", (player) => ({ player })).player.wallet
        .silver,
      5000,
    );
  } finally {
    second.close();
  }
});
test("unauthenticated requests and forged player IDs are refused", async (t) => {
  const s = setup(t, {
    authenticate: async () => ({
      playerId: "base44:test",
      authenticated: false,
    }),
  });
  assert.equal((await s.get()).status, 401);
});
test("cross-origin writes and client-supplied state are refused without spending", async (t) => {
  const s = setup(t);
  const body = envelope({ type: "buy", itemId: "feed", quantity: 1 });
  assert.equal(
    (await s.send(body, { origin: "https://evil.example" })).status,
    403,
  );
  assert.equal(
    (await s.send({ ...body, playerId: "base44:other" })).status,
    400,
  );
  assert.equal((await (await s.get()).json()).player.wallet.silver, 5000);
});
test("duplicate commands are charged once; changed payload cannot reuse request ID", async (t) => {
  const s = setup(t),
    command = { type: "buy", itemId: "feed", quantity: 1 },
    body = envelope(command);
  assert.equal((await s.send(body)).status, 200);
  const repeated = await (await s.send(body)).json();
  assert.equal(repeated.replayed, true);
  assert.equal(repeated.player.wallet.silver, 4000);
  assert.equal(repeated.player.materials.feed, 1);
  assert.equal(
    (await s.send({ ...body, command: { ...command, quantity: 2 } })).status,
    409,
  );
});
test("two writes using the same revision cannot both spend", async (t) => {
  const s = setup(t),
    command = { type: "buy", itemId: "feed", quantity: 1 };
  const responses = await Promise.all([
    s.send(envelope(command)),
    s.send(envelope(command, { id: "request_0002" })),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await (await s.get()).json()).player.wallet.silver, 4000);
});
test("failed command leaves revision, sequence, money and inventory unchanged", async (t) => {
  const s = setup(t),
    before = await (await s.get()).json();
  const failed = await s.send(
    envelope({ type: "buy", itemId: "feed", quantity: 99 }),
  );
  assert.equal(failed.status, 400);
  assert.deepEqual((await (await s.get()).json()).player, before.player);
});
test("combat requires fresh server-owned position, not supplied client coordinates", async (t) => {
  const s = setup(t, {
    getPosition: async () => ({
      authoritative: true,
      observedAt: 100,
      position: { x: 0, z: 0 },
    }),
    lineOfSight: () => true,
  });
  const result = await s.send(
    envelope({ type: "encounter", encounter: "sparring" }),
  );
  assert.equal(result.status, 400);
  assert.equal((await result.json()).code, "POSITION_REQUIRED");
});
test("fresh trusted position permits combat initialization", async (t) => {
  const s = setup(t, {
    getPosition: async () => ({
      authoritative: true,
      observedAt: 9900,
      position: { x: 0, z: 0 },
    }),
    lineOfSight: () => true,
  });
  const result = await s.send(
    envelope({ type: "encounter", encounter: "sparring" }),
  );
  assert.equal(result.status, 200);
  assert.equal((await result.json()).player.encounter.type, "sparring");
});
test("request size is bounded before parsing", async (t) => {
  const s = setup(t);
  assert.equal((await s.send({ data: "x".repeat(5000) })).status, 413);
});
