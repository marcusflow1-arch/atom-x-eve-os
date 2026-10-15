import { createDemo, migratePlayer } from "../systems/state.mjs";
import { applyCommand, snapshot } from "../systems/engine.mjs";
const STORAGE_KEY = "game5.systems.sandbox.v2";
/** Local admin workbench only: never supplies state to an authenticated endpoint. */
export function createSandboxTransport(storage = globalThis.localStorage) {
  let player = createDemo();
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    if (
      saved?.playerId === "demo:systems" &&
      [1, 2].includes(saved.schemaVersion)
    ) {
      const candidate = migratePlayer(saved);
      snapshot(candidate, Date.now());
      player = candidate;
    }
  } catch {
    /* Invalid local fixture is replaced; production state is never read here. */
  }
  const save = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(player));
      return true;
    } catch {
      return false;
    }
  };
  return {
    async load() {
      return snapshot(player, Date.now());
    },
    async execute(command) {
      const result = applyCommand(player, command, {
        now: Date.now(),
        random: Math.random,
        position: { x: 0, z: 0 },
        lineOfSight: () => true,
      });
      player = result.player;
      const persisted = save();
      return {
        ...snapshot(player, Date.now()),
        message:
          result.message +
          (persisted
            ? ""
            : " Browser storage is unavailable; changes last only this session."),
      };
    },
    async reset() {
      player = createDemo();
      save();
      return snapshot(player, Date.now());
    },
  };
}
/** Cookie/Bearer credentials are host supplied. A failed request never switches to demo mode. */
export function createConnectedSystemsTransport({
  fetchImpl = fetch,
  headers = () => ({}),
} = {}) {
  let current, pending;
  async function request(options = {}) {
    const response = await fetchImpl("/api/game5/systems", {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: { ...(await headers()), ...options.headers },
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Systems backend returned an invalid response.");
    }
    if (!response.ok) {
      if (response.status < 500) pending = null;
      const error = new Error(result.message || "Systems backend unavailable");
      error.status = response.status;
      throw error;
    }
    if (
      !result.player?.playerId?.startsWith("base44:") ||
      !Number.isSafeInteger(result.player.revision) ||
      !result.stats
    )
      throw new Error("Unverified systems snapshot");
    if (!current || result.player.revision >= current.player.revision)
      current = result;
    return current;
  }
  return {
    load: () => request(),
    async execute(command) {
      if (!current) await request();
      if (
        pending &&
        JSON.stringify(pending.command) !== JSON.stringify(command)
      )
        throw new Error(
          "Retry the previous action before starting a new one; its outcome is unknown.",
        );
      pending ||= {
        id: crypto.randomUUID(),
        sequence: current.player.sequence + 1,
        expectedRevision: current.player.revision,
        command,
      };
      const result = await request({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      pending = null;
      return result;
    },
    hasPending: () => !!pending,
    async retry() {
      if (!pending) throw new Error("No uncertain action to retry");
      return this.execute(pending.command);
    },
  };
}
