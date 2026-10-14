import { DatabaseSync } from "node:sqlite";
import { createPlayer, migratePlayer } from "./state.mjs";
/** One process/SQLite file. Use a shared transactional datastore before scaling replicas. */
export function createSystemsRepository(filename) {
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS game5_systems(player_id TEXT PRIMARY KEY, state TEXT NOT NULL)",
  );
  const read = db.prepare("SELECT state FROM game5_systems WHERE player_id=?");
  const write = db.prepare(
    "INSERT INTO game5_systems VALUES (?,?) ON CONFLICT(player_id) DO UPDATE SET state=excluded.state",
  );
  return {
    transaction(playerId, action) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const row = read.get(playerId);
        const state = row
          ? migratePlayer(JSON.parse(row.state))
          : createPlayer(playerId);
        const result = action(state);
        if (result?.then) throw new Error("Transactions must be synchronous");
        if (!result?.player || result.player.playerId !== playerId)
          throw new Error("Invalid transaction result");
        write.run(playerId, JSON.stringify(result.player));
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    close() {
      db.close();
    },
  };
}
