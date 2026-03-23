import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reactor_id, attacker_id, target_id, attacker_level } = await req.json();
    if (!reactor_id) {
      return Response.json({ error: 'reactor_id required' }, { status: 400 });
    }

    // 1. Fetch reactor config
    const reactors = await base44.asServiceRole.entities.DamageReactor.filter({ id: reactor_id });
    const reactor = reactors?.[0];
    if (!reactor || !reactor.is_active) {
      return Response.json({ error: 'Reactor not found or inactive' }, { status: 404 });
    }

    // 2. Calculate damage
    const level = attacker_level || 1;
    let damage = reactor.base_damage + (reactor.scaled_damage_per_level * (level - 1));

    // Critical hit check
    const isCrit = Math.random() < (reactor.critical_chance || 0);
    if (isCrit) {
      damage = Math.round(damage * (reactor.critical_multiplier || 2.0));
    }

    // 3. Build damage event
    const damageEvent = {
      reactor_id: reactor.id,
      attacker_id: attacker_id || null,
      target_id: target_id || null,
      bone: reactor.bone_name,
      animation: reactor.animation_name,
      damage_type: reactor.damage_type,
      damage: Math.round(damage),
      is_critical: isCrit,
      knockback: reactor.knockback_force || 0,
      status_effect: reactor.status_effect !== 'none' ? reactor.status_effect : null,
      status_duration: reactor.status_duration || 0,
      xp_awarded: reactor.xp_reward || 0,
      fx_id: reactor.fx_id || null,
      timestamp: Date.now(),
    };

    // 4. Apply XP to attacker if we have a model reference
    if (attacker_id && reactor.xp_reward > 0) {
      try {
        const attackerModels = await base44.asServiceRole.entities.Model3D.filter({ id: attacker_id });
        const attackerModel = attackerModels?.[0];
        if (attackerModel) {
          let currentExp = (attackerModel.current_exp || 0) + reactor.xp_reward;
          let currentLevel = attackerModel.level || 1;
          let expToNext = attackerModel.exp_to_next_level || 100;

          // Level up check
          let leveledUp = false;
          while (currentExp >= expToNext) {
            currentExp -= expToNext;
            currentLevel += 1;
            leveledUp = true;
            // Exponential scaling
            expToNext = Math.round(expToNext * 1.5);

            // Apply stat gains per level
            const spl = attackerModel.stats_per_level || {};
            const stats = { ...(attackerModel.stats || {}) };
            stats.max_hp = (stats.max_hp || 100) + (spl.hp || 10);
            stats.hp = stats.max_hp;
            stats.attack = (stats.attack || 10) + (spl.attack || 2);
            stats.defense = (stats.defense || 5) + (spl.defense || 1);
            stats.speed = (stats.speed || 1.0) + (spl.speed || 0.05);
            stats.stamina = (stats.stamina || 100) + (spl.stamina || 5);

            await base44.asServiceRole.entities.Model3D.update(attacker_id, {
              level: currentLevel,
              current_exp: currentExp,
              exp_to_next_level: expToNext,
              stats,
            });
          }

          if (!leveledUp) {
            await base44.asServiceRole.entities.Model3D.update(attacker_id, {
              current_exp: currentExp,
            });
          }

          damageEvent.attacker_new_exp = currentExp;
          damageEvent.attacker_new_level = currentLevel;
          damageEvent.leveled_up = leveledUp;
        }
      } catch (e) {
        // XP update failed, continue with damage event
        damageEvent.xp_error = e.message;
      }
    }

    // 5. Apply damage to target if provided
    if (target_id) {
      try {
        const targetModels = await base44.asServiceRole.entities.Model3D.filter({ id: target_id });
        const targetModel = targetModels?.[0];
        if (targetModel) {
          const targetStats = { ...(targetModel.stats || { hp: 100, max_hp: 100, defense: 5 }) };
          
          // Apply defense reduction
          const defenseReduction = targetStats.defense || 0;
          let finalDamage = Math.max(1, damageEvent.damage - Math.floor(defenseReduction * 0.5));
          
          // True damage ignores defense
          if (reactor.damage_type === 'true_damage') finalDamage = damageEvent.damage;

          targetStats.hp = Math.max(0, (targetStats.hp || 100) - finalDamage);

          await base44.asServiceRole.entities.Model3D.update(target_id, {
            stats: targetStats,
          });

          damageEvent.final_damage = finalDamage;
          damageEvent.target_hp_remaining = targetStats.hp;
          damageEvent.target_defeated = targetStats.hp <= 0;
        }
      } catch (e) {
        damageEvent.target_error = e.message;
      }
    }

    return Response.json(damageEvent);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});