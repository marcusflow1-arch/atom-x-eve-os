import { createSystemsRepository } from "./repository.mjs";
import { createSystemsHandler } from "./api.mjs";
import { createGame5MovementAuthority } from "../gameplay/authoritativeMovement.mjs";
import { createGame5MovementApi } from "../gameplay/movementApi.mjs";

/**
 * Same-origin host adapter, not a deployment. The host supplies its verified
 * account authenticator and world visibility implementation. Do not instantiate
 * once per request: the movement authority is shared across these two routes.
 */
export function createGame5SystemsService({
  filename,
  authenticate,
  allowedOrigins,
  lineOfSight,
  clock = Date.now,
}) {
  if (!filename || filename === ":memory:")
    throw new TypeError("Persistent SQLite path required");
  if (typeof authenticate !== "function" || typeof lineOfSight !== "function")
    throw new TypeError(
      "Trusted account authentication and world visibility are required",
    );
  const authority = createGame5MovementAuthority({ now: clock });
  const movement = createGame5MovementApi({
    authority,
    authenticate,
    allowedOrigins,
  });
  const repository = createSystemsRepository(filename);
  let systems;
  try {
    systems = createSystemsHandler({
      repository,
      authenticate,
      allowedOrigins,
      clock,
      getPosition: movement.getAuthoritativePosition,
      lineOfSight,
    });
  } catch (error) {
    repository.close();
    throw error;
  }
  return {
    async handle(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname.startsWith("/api/game5/movement/"))
        return movement.handleMovementRequest(request);
      return systems(request);
    },
    close: () => repository.close(),
  };
}
