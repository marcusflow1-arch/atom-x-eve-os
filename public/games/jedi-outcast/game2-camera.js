// SPDX-License-Identifier: GPL-2.0
// Game 2 / Retribution camera profile.
//
// Raven's SP third-person camera collision is solved inside cg_view.cpp before
// cg_thirdPersonHorzOffset is applied. A non-zero horizontal offset can therefore
// move an already-safe camera back into level geometry. Keep the final camera on
// Raven's collision-tested centerline.
//
// Source defaults from code/cgame/cg_main.cpp:
//   range 80, max range 150, angle 0, pitch offset 0, vertical offset 16,
//   camera damp 0.3, target damp 0.5.
//
// Retribution keeps the player visible by forcing third person and disabling the
// original gun-auto-first behavior, but otherwise uses the source-grounded camera
// geometry instead of the previous 165 / 260 / -22 custom profile.
(function attachAtomJediCameraProfile(global) {
  const RAVEN_SP_DEFAULTS = Object.freeze({
    fov: 80,
    thirdPerson: 0,
    gunAutoFirst: 1,
    saberAutoThird: 1,
    range: 80,
    maxRange: 150,
    angle: 0,
    pitchOffset: 0,
    verticalOffset: 16,
    horizontalOffset: 0,
    cameraDamp: 0.3,
    targetDamp: 0.5,
    freelook: 1,
    mousePitch: 0.022,
    mouseYaw: 0.022,
  });

  const RETRIBUTION_THIRD_PERSON = Object.freeze({
    ...RAVEN_SP_DEFAULTS,
    thirdPerson: 1,
    gunAutoFirst: 0,
  });

  const CVARS = Object.freeze([
    ['cg_fov', 'fov'],
    ['cg_thirdPerson', 'thirdPerson'],
    ['cg_gunAutoFirst', 'gunAutoFirst'],
    ['cg_saberAutoThird', 'saberAutoThird'],
    ['cl_freelook', 'freelook'],
    ['m_pitch', 'mousePitch'],
    ['m_yaw', 'mouseYaw'],
    ['cg_thirdPersonRange', 'range'],
    ['cg_thirdPersonMaxRange', 'maxRange'],
    ['cg_thirdPersonAngle', 'angle'],
    ['cg_thirdPersonPitchOffset', 'pitchOffset'],
    ['cg_thirdPersonVertOffset', 'verticalOffset'],
    ['cg_thirdPersonHorzOffset', 'horizontalOffset'],
    ['cg_thirdPersonCameraDamp', 'cameraDamp'],
    ['cg_thirdPersonTargetDamp', 'targetDamp'],
  ]);

  function appendArgs(args, mode) {
    if (!Array.isArray(args)) throw new TypeError('camera args target must be an array');
    // Game 2 and the current Retribution player view intentionally share the same
    // safe third-person geometry. The mode argument stays explicit so Game 2 can
    // diverge later without touching the campaign.
    const profile = RETRIBUTION_THIRD_PERSON;
    for (const [cvar, key] of CVARS) {
      args.push('+set', cvar, String(profile[key]));
    }
    return args;
  }

  global.__ATOM_JEDI_CAMERA_PROFILE = Object.freeze({
    ravenDefaults: RAVEN_SP_DEFAULTS,
    game2: RETRIBUTION_THIRD_PERSON,
    campaign: RETRIBUTION_THIRD_PERSON,
    appendArgs,
  });
})(window);
