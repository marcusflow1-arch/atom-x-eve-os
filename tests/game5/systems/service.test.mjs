import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGame5SystemsService } from "../../../src/game5/systems/service.mjs";
test("service shares verified identity and authoritative movement with combat", async () => {
  const dir = mkdtempSync(join(tmpdir(), "g5-service-"));
  const origin = "https://game.example";
  let now = 10000;
  const service = createGame5SystemsService({
    filename: join(dir, "state.sqlite"),
    allowedOrigins: [origin],
    authenticate: async () => ({
      authenticated: true,
      playerId: "base44:test",
    }),
    lineOfSight: () => true,
    clock: () => now,
  });
  const send = (path, body) =>
    service.handle(
      new Request(origin + path, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  try {
    const session = await (
      await send("/api/game5/movement/connect", {})
    ).json();
    now += 100;
    const ack = await send("/api/game5/movement/input", {
      sessionId: session.sessionId,
      seq: 1,
      moveX: 0,
      moveZ: 0,
      sprint: false,
    });
    assert.equal(ack.status, 200);
    const body = {
      id: "service_test_1",
      sequence: 1,
      expectedRevision: 0,
      command: { type: "encounter", encounter: "sparring" },
    };
    const started = await send("/api/game5/systems", body);
    assert.equal(started.status, 200);
    const p = (await started.json()).player;
    assert.equal(p.encounter.targets[0].position.z, session.position.z - 2);
    await send("/api/game5/movement/disconnect", {
      sessionId: session.sessionId,
    });
    const attack = await send("/api/game5/systems", {
      id: "service_test_2",
      sequence: 2,
      expectedRevision: 1,
      command: { type: "attack", targetId: "enemy-0", skillId: "strike" },
    });
    assert.equal(attack.status, 400);
    assert.equal((await attack.json()).code, "POSITION_REQUIRED");
  } finally {
    service.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
