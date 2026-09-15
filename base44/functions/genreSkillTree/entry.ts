import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const effect = (key: string, value: number, unit: string, scope: string, demo: string, description: string, exclusive = false) => ({ key, value, unit, scope, demo, description, exclusive });

const GENRES: Record<string, any> = {
  shooter: {
    name: 'Shooter', short: 'FPS', aliases: ['shooter', 'shooting', 'fps'], xpName: 'Aim XP',
    branches: [
      ['precision', 'Precision', 'crosshair', [
        ['Ballistic Edge', effect('ranged_damage_pct', 5, '%', 'Rifles, SMGs, pistols and other supported firearms', 'damage', 'Raises weapon damage while preserving the game’s own damage model.')],
        ['Extended Doctrine', effect('magazine_bonus', 10, 'rounds', 'Compatible magazines and automatic weapons', 'ammo', 'Adds reserve-ready magazine capacity where the game exposes a magazine-size hook.')],
        ['Rapid Chamber', effect('reload_speed_pct', 12, '%', 'Supported reloadable firearms', 'reload', 'Shortens reload time without bypassing weapon-specific animation locks.')],
        ['Deadeye Protocol', effect('weakpoint_damage_pct', 15, '%', 'Precision and weak-point hits', 'crit', 'Exclusive keystone that amplifies precision damage when the game exposes weak-point events.', true)],
      ]],
      ['tactics', 'Tactics', 'radar', [
        ['Combat Read', effect('target_reveal_ms', 1200, 'ms', 'Recently damaged enemies', 'reveal', 'Briefly reveals enemies you have damaged when the title supports target telemetry.')],
        ['Quick Swap', effect('weapon_swap_speed_pct', 15, '%', 'Primary/secondary weapon swaps', 'swap', 'Reduces weapon swap time for supported loadout systems.')],
        ['Suppression Control', effect('recoil_reduction_pct', 10, '%', 'Automatic and burst weapons', 'recoil', 'Reduces vertical recoil through the game’s supported recoil modifier.')],
        ['Fireteam Link', effect('team_reload_aura_pct', 8, '%', 'Nearby squadmates', 'team', 'Exclusive squad aura that boosts reload speed for nearby party members.', true)],
      ]],
      ['survival', 'Survival', 'shield', [
        ['Armor Discipline', effect('incoming_ranged_damage_reduction_pct', 4, '%', 'Incoming ranged damage', 'defense', 'Reduces supported ranged damage after the game applies armor rules.')],
        ['Last Magazine', effect('low_ammo_move_speed_pct', 8, '%', 'Movement while ammunition is low', 'movement', 'Adds a small movement bonus when the game reports low-ammo state.')],
        ['Second Wind', effect('kill_heal_flat', 5, 'HP', 'First elimination after taking damage', 'heal', 'Restores a small amount of health after a qualifying elimination.')],
        ['Hold the Line', effect('low_health_damage_reduction_pct', 12, '%', 'Below 30% health', 'defense', 'Exclusive clutch keystone that reduces incoming damage while critically wounded.', true)],
      ]],
    ],
  },
  action: {
    name: 'Action', short: 'ACT', aliases: ['action'], xpName: 'Combat XP',
    branches: [
      ['power', 'Power', 'swords', [
        ['Impact Training', effect('melee_damage_pct', 5, '%', 'Supported melee attacks', 'damage', 'Increases base melee impact after the game’s weapon scaling is calculated.')],
        ['Combo Force', effect('combo_damage_pct', 6, '%', 'Hits after combo step 2', 'combo', 'Rewards sustained combo chains with increasing damage.')],
        ['Finisher Drive', effect('finisher_damage_pct', 10, '%', 'Finishers and execution moves', 'finisher', 'Raises damage dealt by supported finisher events.')],
        ['Overdrive', effect('combo_keystone_pct', 15, '%', 'Max-chain combo state', 'combo', 'Exclusive keystone that temporarily amplifies damage at the end of a full combo chain.', true)],
      ]],
      ['reflex', 'Reflex', 'zap', [
        ['Fast Hands', effect('action_speed_pct', 6, '%', 'Interact, draw and recovery actions', 'speed', 'Speeds supported action windows without skipping required gameplay states.')],
        ['Perfect Step', effect('dodge_iframe_bonus_ms', 80, 'ms', 'Perfect dodge windows', 'dodge', 'Adds a small timing allowance to games exposing a dodge invulnerability hook.')],
        ['Counter Window', effect('counter_window_bonus_ms', 100, 'ms', 'Parry/counter timing', 'parry', 'Slightly widens supported counter timing windows.')],
        ['Flow State', effect('perfect_dodge_haste_pct', 12, '%', 'After a perfect dodge', 'speed', 'Exclusive keystone granting a short action-speed burst after a perfect dodge.', true)],
      ]],
      ['endurance', 'Endurance', 'heart', [
        ['Conditioning', effect('stamina_max_pct', 6, '%', 'Stamina or equivalent action resource', 'stamina', 'Raises maximum stamina when the game exposes a stamina pool.')],
        ['Recovery Rhythm', effect('stamina_regen_pct', 10, '%', 'Out-of-attack stamina recovery', 'stamina', 'Increases stamina recovery between attack sequences.')],
        ['Pain Tolerance', effect('stagger_resistance_pct', 10, '%', 'Hit reaction / stagger checks', 'defense', 'Improves resistance to supported stagger checks.')],
        ['Relentless', effect('low_stamina_damage_pct', 10, '%', 'Below 25% stamina', 'damage', 'Exclusive keystone that rewards aggressive play while nearly exhausted.', true)],
      ]],
    ],
  },
  fighting: {
    name: 'Fighting', short: 'FGT', aliases: ['fighting'], xpName: 'Duel XP',
    branches: [
      ['pressure', 'Pressure', 'flame', [
        ['Opening Strike', effect('opening_hit_damage_pct', 4, '%', 'First confirmed hit in a round', 'damage', 'Adds a modest bonus to the first confirmed hit when the game supports round hooks.')],
        ['String Memory', effect('combo_meter_gain_pct', 8, '%', 'Combo meter / drive resource', 'combo', 'Improves supported combo-resource gain.')],
        ['Wall Control', effect('wall_damage_pct', 8, '%', 'Wall splat and corner sequences', 'impact', 'Increases supported wall/corner conversion damage.')],
        ['No Escape', effect('corner_pressure_pct', 12, '%', 'Opponent cornered state', 'pressure', 'Exclusive keystone improving pressure while the opponent is cornered.', true)],
      ]],
      ['defense', 'Defense', 'shield', [
        ['Guard Discipline', effect('block_chip_reduction_pct', 8, '%', 'Chip damage while blocking', 'defense', 'Reduces supported chip damage while guarding.')],
        ['Break Fall', effect('knockdown_recovery_pct', 10, '%', 'Knockdown recovery', 'recovery', 'Speeds supported wake-up recovery.')],
        ['Read the Throw', effect('throw_escape_window_ms', 80, 'ms', 'Throw-tech window', 'parry', 'Adds a small window to games exposing throw escape timing.')],
        ['Iron Guard', effect('guard_break_resistance_pct', 15, '%', 'Guard meter / break systems', 'defense', 'Exclusive keystone increasing guard-break resistance.', true)],
      ]],
      ['mindgame', 'Mindgame', 'brain', [
        ['Tempo Sense', effect('meter_gain_pct', 5, '%', 'Universal combat meter', 'meter', 'Slightly improves supported combat meter generation.')],
        ['Punish Training', effect('punish_damage_pct', 7, '%', 'Confirmed punish events', 'damage', 'Adds damage to attacks the game explicitly marks as punishes.')],
        ['Momentum Read', effect('counter_hit_damage_pct', 8, '%', 'Counter-hit events', 'crit', 'Raises supported counter-hit damage.')],
        ['Download Complete', effect('round3_adaptation_pct', 10, '%', 'Late-round adaptation state', 'analysis', 'Exclusive keystone granting an adaptation bonus in longer sets.', true)],
      ]],
    ],
  },
  rpg: {
    name: 'RPG', short: 'RPG', aliases: ['rpg', 'fantasy'], xpName: 'Adventure XP',
    branches: [
      ['warfare', 'Warfare', 'swords', [
        ['Veteran Grip', effect('physical_damage_pct', 4, '%', 'Physical weapon attacks', 'damage', 'Raises supported physical weapon damage.')],
        ['Heavy Training', effect('equip_weight_capacity_pct', 8, '%', 'Equipment capacity', 'weight', 'Raises supported carry/equipment thresholds.')],
        ['Armor Mastery', effect('armor_effectiveness_pct', 6, '%', 'Armor mitigation', 'defense', 'Improves armor effectiveness through the game’s integration layer.')],
        ['Weapon Sage', effect('weapon_mastery_bonus_pct', 12, '%', 'Highest weapon mastery category', 'mastery', 'Exclusive keystone amplifying your strongest supported weapon mastery.', true)],
      ]],
      ['arcana', 'Arcana', 'sparkles', [
        ['Deep Well', effect('mana_max_pct', 8, '%', 'Mana / focus / spell resource', 'mana', 'Raises the game’s supported spell-resource maximum.')],
        ['Efficient Casting', effect('spell_cost_reduction_pct', 5, '%', 'Spell and ability resource costs', 'mana', 'Reduces supported spell costs without allowing free casts.')],
        ['Arcane Focus', effect('spell_damage_pct', 7, '%', 'Damage-dealing spells', 'magic', 'Raises supported spell damage.')],
        ['Archmage', effect('ultimate_spell_power_pct', 15, '%', 'Ultimate-tier spells', 'magic', 'Exclusive keystone amplifying top-tier spell casts.', true)],
      ]],
      ['exploration', 'Exploration', 'map', [
        ['Pack Sense', effect('loot_radius_pct', 15, '%', 'Loot pickup / discovery radius', 'loot', 'Expands supported pickup or discovery radius.')],
        ['Pathfinder', effect('out_of_combat_move_speed_pct', 6, '%', 'Out-of-combat traversal', 'movement', 'Improves traversal speed outside combat where supported.')],
        ['Treasure Instinct', effect('rare_loot_weight_pct', 4, '%', 'Eligible loot tables', 'loot', 'Adds a small integration-side weight to rare eligible drops.')],
        ['Legend Hunter', effect('boss_reward_bonus_pct', 10, '%', 'Boss reward rolls', 'loot', 'Exclusive keystone adding a supported bonus to boss reward output.', true)],
      ]],
    ],
  },
  mmorpg: {
    name: 'MMORPG', short: 'MMO', aliases: ['mmo', 'mmorpg'], xpName: 'Social XP',
    branches: [
      ['raid', 'Raid', 'users', [
        ['Raid Discipline', effect('boss_damage_pct', 4, '%', 'Raid and world bosses', 'boss', 'Raises damage against supported boss-class targets.')],
        ['Mechanic Memory', effect('raid_telegraph_time_ms', 120, 'ms', 'Supported raid telegraphs', 'telegraph', 'Provides a small additional telegraph timing allowance.')],
        ['Group Rhythm', effect('party_cooldown_recovery_pct', 5, '%', 'Grouped ability cooldowns', 'team', 'Improves supported cooldown recovery while grouped.')],
        ['Raid Commander', effect('raid_party_aura_pct', 7, '%', 'Full party / raid group', 'team', 'Exclusive keystone providing a small party-wide raid aura.', true)],
      ]],
      ['economy', 'Trade', 'coins', [
        ['Merchant Eye', effect('vendor_sell_bonus_pct', 5, '%', 'Integrated NPC vendors', 'trade', 'Improves supported vendor sale value.')],
        ['Efficient Craft', effect('craft_material_saving_pct', 5, '%', 'Eligible crafting recipes', 'craft', 'Small chance-equivalent material efficiency handled by the game integration.')],
        ['Market Sense', effect('auction_fee_reduction_pct', 8, '%', 'Integrated market fees', 'trade', 'Reduces supported marketplace fees.')],
        ['Guild Magnate', effect('guild_economy_bonus_pct', 10, '%', 'Guild economy events', 'trade', 'Exclusive keystone improving supported guild economic rewards.', true)],
      ]],
      ['support', 'Synergy', 'heart', [
        ['Helpful Hand', effect('healing_done_pct', 4, '%', 'Outgoing healing', 'heal', 'Raises supported outgoing healing.')],
        ['Shared Resolve', effect('party_damage_reduction_pct', 3, '%', 'Nearby party members', 'team', 'Small supported mitigation aura for nearby group members.')],
        ['Revive Training', effect('revive_speed_pct', 12, '%', 'Revive interactions', 'revive', 'Speeds supported revive interactions.')],
        ['Bonded Party', effect('full_party_stat_pct', 8, '%', 'Full premade party', 'team', 'Exclusive keystone granting a supported group bonus to full premades.', true)],
      ]],
    ],
  },
  adventure: {
    name: 'Adventure', short: 'ADV', aliases: ['adventure'], xpName: 'Discovery XP',
    branches: [
      ['navigation', 'Navigation', 'navigation', [
        ['Trail Sense', effect('map_reveal_radius_pct', 12, '%', 'Exploration map reveal', 'map', 'Expands supported map-reveal radius.')],
        ['Climber', effect('climb_stamina_cost_reduction_pct', 8, '%', 'Climbing / traversal stamina', 'stamina', 'Reduces supported climbing resource cost.')],
        ['Long Stride', effect('sprint_duration_pct', 10, '%', 'Exploration sprinting', 'movement', 'Extends supported sprint duration.')],
        ['Worldwalker', effect('fast_travel_cost_reduction_pct', 25, '%', 'Integrated fast-travel costs', 'map', 'Exclusive keystone reducing supported fast-travel cost.', true)],
      ]],
      ['survival', 'Fieldcraft', 'campfire', [
        ['Rationing', effect('consumable_duration_pct', 8, '%', 'Food / survival consumables', 'survival', 'Extends supported consumable duration.')],
        ['Weathered', effect('environment_resistance_pct', 6, '%', 'Weather and biome hazards', 'survival', 'Improves resistance to supported environmental hazards.')],
        ['Makeshift Repair', effect('durability_loss_reduction_pct', 10, '%', 'Durability systems', 'repair', 'Reduces supported equipment durability loss.')],
        ['Master Camper', effect('rest_bonus_pct', 15, '%', 'Camp / rest bonuses', 'camp', 'Exclusive keystone improving supported rest bonuses.', true)],
      ]],
      ['discovery', 'Discovery', 'eye', [
        ['Curious Mind', effect('secret_detection_radius_pct', 10, '%', 'Secrets and hidden objects', 'reveal', 'Expands supported secret detection radius.')],
        ['Lore Hunter', effect('exploration_xp_pct', 5, '%', 'Discovery and lore XP', 'xp', 'Improves supported exploration XP rewards.')],
        ['Collector', effect('collectible_ping_range_pct', 12, '%', 'Collectible proximity pings', 'reveal', 'Extends supported collectible ping range.')],
        ['Cartographer', effect('region_completion_reward_pct', 10, '%', 'Region completion rewards', 'map', 'Exclusive keystone improving supported region-completion rewards.', true)],
      ]],
    ],
  },
  scifi: {
    name: 'Sci-Fi', short: 'SCI', aliases: ['sci-fi', 'scifi', 'sci_fi'], xpName: 'Tech XP',
    branches: [
      ['cybernetics', 'Cybernetics', 'cpu', [
        ['Neural Buffer', effect('ability_cooldown_recovery_pct', 4, '%', 'Tech abilities', 'cooldown', 'Improves supported tech-ability cooldown recovery.')],
        ['Servo Assist', effect('carry_capacity_pct', 8, '%', 'Inventory / carry weight', 'weight', 'Raises supported carry capacity.')],
        ['Reflex Chip', effect('aim_transition_speed_pct', 10, '%', 'Aim / targeting transitions', 'speed', 'Speeds supported targeting transitions.')],
        ['Prototype Core', effect('tech_power_pct', 15, '%', 'High-tier tech abilities', 'tech', 'Exclusive keystone amplifying supported high-tier tech powers.', true)],
      ]],
      ['systems', 'Systems', 'circuit', [
        ['Efficient Cell', effect('energy_capacity_pct', 8, '%', 'Energy shields / tech resource', 'energy', 'Raises supported energy capacity.')],
        ['Fast Compile', effect('hack_speed_pct', 10, '%', 'Hacking / breach actions', 'hack', 'Speeds supported hacking interactions.')],
        ['Shield Routing', effect('shield_regen_pct', 10, '%', 'Regenerating shields', 'shield', 'Improves supported shield regeneration.')],
        ['Singularity Logic', effect('system_overcharge_pct', 12, '%', 'Overcharge windows', 'tech', 'Exclusive keystone amplifying supported system overcharge states.', true)],
      ]],
      ['spaceflight', 'Spaceflight', 'rocket', [
        ['Vector Control', effect('vehicle_handling_pct', 6, '%', 'Integrated spacecraft handling', 'vehicle', 'Improves supported vehicle handling response.')],
        ['Efficient Burn', effect('vehicle_boost_efficiency_pct', 8, '%', 'Boost / fuel resource', 'vehicle', 'Reduces supported boost resource use.')],
        ['Target Lead', effect('vehicle_weapon_accuracy_pct', 8, '%', 'Vehicle / ship weapons', 'vehicle', 'Improves supported vehicle weapon accuracy.')],
        ['Ace Pilot', effect('vehicle_allround_pct', 10, '%', 'Spacecraft combat systems', 'vehicle', 'Exclusive keystone granting a supported all-round flight-combat bonus.', true)],
      ]],
    ],
  },
  strategy: {
    name: 'Strategy', short: 'STR', aliases: ['strategy'], xpName: 'Command XP',
    branches: [
      ['economy', 'Economy', 'coins', [
        ['Lean Production', effect('resource_income_pct', 4, '%', 'Integrated strategic resource income', 'economy', 'Improves supported passive resource income.')],
        ['Efficient Build', effect('build_cost_reduction_pct', 4, '%', 'Eligible construction costs', 'build', 'Reduces supported building costs.')],
        ['Supply Chain', effect('unit_upkeep_reduction_pct', 5, '%', 'Unit upkeep systems', 'economy', 'Reduces supported upkeep costs.')],
        ['Golden Age', effect('economy_keystone_pct', 10, '%', 'Economy during prosperity state', 'economy', 'Exclusive keystone amplifying supported economy during a prosperity window.', true)],
      ]],
      ['command', 'Command', 'crown', [
        ['Drill Orders', effect('unit_training_speed_pct', 5, '%', 'Unit production / training', 'command', 'Speeds supported training queues.')],
        ['Formation Logic', effect('formation_defense_pct', 5, '%', 'Units in formation', 'command', 'Improves supported formation defense.')],
        ['Veteran Corps', effect('unit_xp_gain_pct', 8, '%', 'Unit veterancy XP', 'xp', 'Improves supported unit experience gain.')],
        ['Supreme Command', effect('army_morale_pct', 12, '%', 'Army morale / cohesion', 'command', 'Exclusive keystone improving supported army morale.', true)],
      ]],
      ['intel', 'Intelligence', 'eye', [
        ['Scouting Grid', effect('vision_radius_pct', 8, '%', 'Unit vision / fog of war', 'vision', 'Expands supported vision radius.')],
        ['Signal Read', effect('enemy_info_detail_pct', 10, '%', 'Enemy info / scouting detail', 'intel', 'Improves supported scouting information.')],
        ['Counterplan', effect('ambush_damage_reduction_pct', 8, '%', 'Ambush damage', 'defense', 'Reduces supported ambush damage.')],
        ['Grand Strategist', effect('counter_bonus_pct', 12, '%', 'Hard-counter matchups', 'intel', 'Exclusive keystone improving supported counter-matchup effectiveness.', true)],
      ]],
    ],
  },
  simulation: {
    name: 'Simulation', short: 'SIM', aliases: ['simulation'], xpName: 'Logic XP',
    branches: [
      ['efficiency', 'Efficiency', 'gauge', [
        ['Lean Systems', effect('operating_cost_reduction_pct', 4, '%', 'Integrated management costs', 'efficiency', 'Reduces supported operating costs.')],
        ['Queue Theory', effect('task_throughput_pct', 6, '%', 'Production / task queues', 'efficiency', 'Improves supported queue throughput.')],
        ['Predictive Maintenance', effect('breakdown_chance_reduction_pct', 8, '%', 'Maintenance simulations', 'repair', 'Reduces supported breakdown probability.')],
        ['Perfect Loop', effect('simulation_efficiency_pct', 12, '%', 'Stable optimized systems', 'efficiency', 'Exclusive keystone granting a supported efficiency multiplier to optimized systems.', true)],
      ]],
      ['design', 'Design', 'ruler', [
        ['Blueprint Memory', effect('placement_refund_pct', 5, '%', 'Eligible placement refunds', 'build', 'Improves supported refund rates for moved or replaced objects.')],
        ['Compact Layout', effect('space_efficiency_pct', 5, '%', 'Grid / placement systems', 'build', 'Improves supported space efficiency metrics.')],
        ['Aesthetic Bonus', effect('visitor_satisfaction_pct', 6, '%', 'Visitor / citizen satisfaction', 'design', 'Improves supported satisfaction from design quality.')],
        ['Master Planner', effect('design_synergy_pct', 10, '%', 'Completed design sets', 'design', 'Exclusive keystone increasing supported design synergy bonuses.', true)],
      ]],
      ['control', 'Control', 'settings', [
        ['Fine Input', effect('control_precision_pct', 6, '%', 'Precision simulation controls', 'control', 'Improves supported fine-control sensitivity scaling.')],
        ['Automation', effect('automation_speed_pct', 6, '%', 'Automated processes', 'control', 'Improves supported automation speed.')],
        ['Stable Loop', effect('error_tolerance_pct', 8, '%', 'Failure / error checks', 'control', 'Adds supported tolerance to small control errors.')],
        ['Systems Architect', effect('global_system_bonus_pct', 10, '%', 'Interconnected simulation systems', 'control', 'Exclusive keystone improving supported cross-system performance.', true)],
      ]],
    ],
  },
  sports: {
    name: 'Sports', short: 'SPT', aliases: ['sports'], xpName: 'Athlete XP',
    branches: [
      ['athleticism', 'Athleticism', 'activity', [
        ['Conditioning', effect('athlete_stamina_pct', 5, '%', 'Athlete stamina systems', 'stamina', 'Raises supported athlete stamina capacity.')],
        ['Burst Step', effect('athlete_acceleration_pct', 4, '%', 'Acceleration events', 'movement', 'Improves supported acceleration.')],
        ['Recovery', effect('athlete_recovery_pct', 8, '%', 'Between-play recovery', 'recovery', 'Improves supported fatigue recovery.')],
        ['Prime Form', effect('clutch_athleticism_pct', 10, '%', 'Late-game clutch state', 'movement', 'Exclusive keystone improving supported physical attributes in clutch moments.', true)],
      ]],
      ['skill', 'Technique', 'target', [
        ['Clean Touch', effect('ball_control_pct', 4, '%', 'Ball / puck control systems', 'skill', 'Improves supported control precision.')],
        ['Placement', effect('shot_accuracy_pct', 4, '%', 'Shooting / scoring attempts', 'skill', 'Improves supported shot placement.')],
        ['Vision', effect('pass_accuracy_pct', 5, '%', 'Passing systems', 'skill', 'Improves supported pass accuracy.')],
        ['Playmaker', effect('team_skill_aura_pct', 8, '%', 'Nearby teammates', 'team', 'Exclusive keystone improving supported teammate skill response.', true)],
      ]],
      ['mentality', 'Mentality', 'brain', [
        ['Composure', effect('pressure_error_reduction_pct', 6, '%', 'High-pressure moments', 'focus', 'Reduces supported execution penalties under pressure.')],
        ['Read the Field', effect('reaction_window_ms', 80, 'ms', 'Contextual timing windows', 'focus', 'Adds a small supported reaction window.')],
        ['Momentum', effect('streak_meter_gain_pct', 8, '%', 'Momentum / takeover systems', 'meter', 'Improves supported momentum gain.')],
        ['Closer', effect('final_period_bonus_pct', 10, '%', 'Final period / quarter', 'focus', 'Exclusive keystone improving supported clutch performance late in the match.', true)],
      ]],
    ],
  },
  racing: {
    name: 'Racing', short: 'RAC', aliases: ['racing'], xpName: 'Driver XP',
    branches: [
      ['control', 'Control', 'steering', [
        ['Smooth Input', effect('vehicle_handling_pct', 4, '%', 'Integrated vehicle handling', 'vehicle', 'Improves supported steering response.')],
        ['Trail Brake', effect('brake_control_pct', 5, '%', 'Braking stability', 'vehicle', 'Improves supported braking control.')],
        ['Grip Sense', effect('traction_recovery_pct', 6, '%', 'Traction recovery', 'vehicle', 'Improves supported recovery from traction loss.')],
        ['Apex Master', effect('corner_exit_bonus_pct', 10, '%', 'Clean apex exits', 'vehicle', 'Exclusive keystone improving supported corner-exit acceleration.', true)],
      ]],
      ['speed', 'Speed', 'gauge', [
        ['Launch Control', effect('start_acceleration_pct', 4, '%', 'Race starts', 'vehicle', 'Improves supported launch acceleration.')],
        ['Slipstream', effect('draft_bonus_pct', 6, '%', 'Draft / slipstream state', 'vehicle', 'Improves supported drafting benefit.')],
        ['Boost Economy', effect('boost_efficiency_pct', 8, '%', 'Boost / nitrous resource', 'vehicle', 'Improves supported boost efficiency.')],
        ['Redline', effect('top_speed_window_pct', 8, '%', 'Perfect-condition straightaways', 'vehicle', 'Exclusive keystone granting a supported top-speed window.', true)],
      ]],
      ['racecraft', 'Racecraft', 'flag', [
        ['Clean Pass', effect('overtake_stability_pct', 5, '%', 'Overtake interactions', 'vehicle', 'Improves supported vehicle stability while passing.')],
        ['Tire Whisperer', effect('tire_wear_reduction_pct', 6, '%', 'Tire wear systems', 'vehicle', 'Reduces supported tire wear.')],
        ['Fuel Map', effect('fuel_efficiency_pct', 6, '%', 'Fuel use', 'vehicle', 'Improves supported fuel efficiency.')],
        ['Champion Line', effect('race_consistency_pct', 10, '%', 'Long-form race consistency', 'vehicle', 'Exclusive keystone improving supported consistency over long races.', true)],
      ]],
    ],
  },
  puzzle: {
    name: 'Puzzle', short: 'PUZ', aliases: ['puzzle'], xpName: 'Insight XP',
    branches: [
      ['pattern', 'Pattern', 'grid', [
        ['Pattern Recall', effect('hint_charge_gain_pct', 5, '%', 'Integrated hint systems', 'puzzle', 'Improves supported hint charge gain.')],
        ['Sequence Sense', effect('sequence_preview_ms', 250, 'ms', 'Timed sequence previews', 'puzzle', 'Adds a short supported preview window for sequence puzzles.')],
        ['Error Buffer', effect('mistake_tolerance_count', 1, 'mistake', 'Eligible puzzle failure counters', 'puzzle', 'Adds one supported error buffer where the title explicitly allows it.')],
        ['Intuition', effect('puzzle_insight_bonus_pct', 12, '%', 'Advanced puzzle insight events', 'puzzle', 'Exclusive keystone improving supported puzzle insight rewards.', true)],
      ]],
      ['logic', 'Logic', 'brain', [
        ['Fast Parse', effect('logic_timer_grace_ms', 300, 'ms', 'Timed logic challenges', 'timer', 'Adds a small supported grace window to timed logic checks.')],
        ['Deduction', effect('clue_highlight_duration_pct', 10, '%', 'Clue highlighting', 'reveal', 'Extends supported clue highlights.')],
        ['Constraint Read', effect('invalid_move_warning_ms', 250, 'ms', 'Constraint-based puzzles', 'warning', 'Provides supported warning feedback before an invalid move commits.')],
        ['Proof Complete', effect('logic_reward_bonus_pct', 10, '%', 'Logic challenge rewards', 'xp', 'Exclusive keystone improving supported logic completion rewards.', true)],
      ]],
      ['focus', 'Focus', 'eye', [
        ['Steady Mind', effect('distraction_penalty_reduction_pct', 8, '%', 'Games with distraction / stress layers', 'focus', 'Reduces supported distraction penalties.')],
        ['Memory Palace', effect('memory_preview_ms', 300, 'ms', 'Memory-based puzzles', 'memory', 'Extends supported memory preview windows.')],
        ['Deep Focus', effect('combo_timeout_extension_ms', 250, 'ms', 'Puzzle combo chains', 'focus', 'Extends supported combo timeout windows.')],
        ['Eureka', effect('perfect_chain_reward_pct', 15, '%', 'Perfect puzzle chains', 'puzzle', 'Exclusive keystone improving supported perfect-chain rewards.', true)],
      ]],
    ],
  },
  platformer: {
    name: 'Platformer', short: 'PLT', aliases: ['platformer'], xpName: 'Movement XP',
    branches: [
      ['mobility', 'Mobility', 'wind', [
        ['Long Jump', effect('jump_distance_pct', 4, '%', 'Supported jump physics', 'jump', 'Extends supported horizontal jump distance slightly.')],
        ['Air Control', effect('air_control_pct', 6, '%', 'Mid-air steering', 'jump', 'Improves supported air control.')],
        ['Wall Grip', effect('wall_hold_duration_pct', 10, '%', 'Wall cling / wall-run systems', 'jump', 'Extends supported wall-hold duration.')],
        ['Flow Runner', effect('movement_chain_bonus_pct', 10, '%', 'Unbroken traversal chains', 'movement', 'Exclusive keystone rewarding long supported movement chains.', true)],
      ]],
      ['timing', 'Timing', 'clock', [
        ['Coyote Step', effect('ledge_grace_ms', 80, 'ms', 'Jump grace after leaving a ledge', 'jump', 'Adds a small supported coyote-time window.')],
        ['Landing Buffer', effect('landing_input_buffer_ms', 80, 'ms', 'Landing input queue', 'jump', 'Adds a small supported input buffer on landing.')],
        ['Bounce Read', effect('bounce_timing_window_ms', 90, 'ms', 'Bounce / spring timing', 'jump', 'Widens supported bounce timing windows.')],
        ['Perfect Rhythm', effect('perfect_timing_speed_pct', 10, '%', 'Perfect traversal timing', 'movement', 'Exclusive keystone granting a short supported speed burst after perfect traversal timing.', true)],
      ]],
      ['collection', 'Collection', 'sparkles', [
        ['Magnet Step', effect('pickup_radius_pct', 8, '%', 'Collectible pickup radius', 'pickup', 'Expands supported collectible pickup radius.')],
        ['Secret Sense', effect('secret_ping_range_pct', 8, '%', 'Hidden route / secret pings', 'reveal', 'Extends supported secret ping range.')],
        ['Life Saver', effect('checkpoint_resource_bonus_pct', 8, '%', 'Checkpoint restoration', 'checkpoint', 'Improves supported checkpoint restoration resources.')],
        ['Completionist', effect('perfect_stage_reward_pct', 12, '%', 'Perfect stage completion', 'pickup', 'Exclusive keystone improving supported perfect-stage rewards.', true)],
      ]],
    ],
  },
  horror: {
    name: 'Horror', short: 'HOR', aliases: ['horror'], xpName: 'Nerve XP',
    branches: [
      ['nerve', 'Nerve', 'heart', [
        ['Steady Pulse', effect('fear_buildup_reduction_pct', 6, '%', 'Fear / sanity buildup', 'fear', 'Reduces supported fear or sanity buildup.')],
        ['Breathe', effect('panic_recovery_pct', 8, '%', 'Panic recovery', 'fear', 'Improves supported recovery from panic states.')],
        ['Dark Adaptation', effect('low_light_visibility_pct', 8, '%', 'Integrated low-light visibility', 'vision', 'Improves supported visibility in low-light conditions.')],
        ['Unshaken', effect('fear_keystone_pct', 15, '%', 'Critical fear state', 'fear', 'Exclusive keystone providing a supported resistance bonus near maximum fear.', true)],
      ]],
      ['stealth', 'Stealth', 'ghost', [
        ['Soft Step', effect('footstep_noise_reduction_pct', 8, '%', 'Player movement noise', 'stealth', 'Reduces supported footstep noise.')],
        ['Hide Better', effect('detection_rate_reduction_pct', 6, '%', 'Enemy detection meters', 'stealth', 'Slows supported detection buildup.')],
        ['Door Sense', effect('interaction_noise_reduction_pct', 10, '%', 'Doors / object interactions', 'stealth', 'Reduces supported interaction noise.')],
        ['Vanishing Point', effect('break_line_of_sight_pct', 12, '%', 'Chase line-of-sight loss', 'stealth', 'Exclusive keystone improving supported chase escape once line of sight breaks.', true)],
      ]],
      ['investigation', 'Investigation', 'search', [
        ['Clue Eye', effect('clue_detection_radius_pct', 10, '%', 'Clue detection', 'reveal', 'Expands supported clue detection radius.')],
        ['Forensic Memory', effect('clue_retention_pct', 10, '%', 'Investigation clue UI', 'memory', 'Improves supported clue retention/persistence.')],
        ['Pattern of Fear', effect('threat_hint_duration_ms', 400, 'ms', 'Threat warning events', 'warning', 'Extends supported threat hint visibility.')],
        ['Case Closed', effect('investigation_reward_pct', 12, '%', 'Completed investigation sequences', 'xp', 'Exclusive keystone improving supported investigation rewards.', true)],
      ]],
    ],
  },
  survival: {
    name: 'Survival', short: 'SUR', aliases: ['survival'], xpName: 'Survival XP',
    branches: [
      ['endure', 'Endure', 'shield', [
        ['Hardy', effect('max_health_pct', 4, '%', 'Maximum health', 'health', 'Raises supported maximum health.')],
        ['Cold Blood', effect('temperature_resistance_pct', 8, '%', 'Temperature hazards', 'survival', 'Improves supported temperature resistance.')],
        ['Toxin Filter', effect('status_resistance_pct', 6, '%', 'Environmental status effects', 'survival', 'Improves supported resistance to eligible status effects.')],
        ['Against All Odds', effect('critical_survival_pct', 12, '%', 'Critical survival state', 'survival', 'Exclusive keystone improving supported resistance when multiple survival meters are critical.', true)],
      ]],
      ['craft', 'Craft', 'hammer', [
        ['Scrap Sense', effect('salvage_yield_pct', 5, '%', 'Salvage / dismantle yields', 'craft', 'Improves supported salvage yields.')],
        ['Efficient Hands', effect('craft_cost_reduction_pct', 5, '%', 'Eligible recipes', 'craft', 'Reduces supported recipe costs.')],
        ['Field Repair', effect('repair_efficiency_pct', 8, '%', 'Repair actions', 'repair', 'Improves supported repair efficiency.')],
        ['Master Improviser', effect('rare_craft_bonus_pct', 10, '%', 'Advanced crafting outcomes', 'craft', 'Exclusive keystone improving supported high-tier crafting outcomes.', true)],
      ]],
      ['scavenge', 'Scavenge', 'search', [
        ['Forager', effect('resource_detection_radius_pct', 8, '%', 'Resource node detection', 'reveal', 'Expands supported resource detection radius.')],
        ['Pack Rat', effect('inventory_capacity_pct', 8, '%', 'Inventory capacity', 'weight', 'Raises supported inventory capacity.')],
        ['Rare Find', effect('rare_resource_weight_pct', 4, '%', 'Eligible resource tables', 'loot', 'Adds a small supported rare-resource weighting.')],
        ['Wasteland King', effect('scavenge_cache_bonus_pct', 12, '%', 'Major caches / supply drops', 'loot', 'Exclusive keystone improving supported major-cache rewards.', true)],
      ]],
    ],
  },
  sandbox: {
    name: 'Sandbox / Open World', short: 'SBX', aliases: ['sandbox', 'open_world'], xpName: 'Freedom XP',
    branches: [
      ['builder', 'Builder', 'hammer', [
        ['Efficient Placement', effect('build_cost_reduction_pct', 4, '%', 'Eligible building pieces', 'build', 'Reduces supported build costs.')],
        ['Quick Construct', effect('build_speed_pct', 6, '%', 'Construction timers', 'build', 'Speeds supported construction.')],
        ['Structural Sense', effect('structure_durability_pct', 8, '%', 'Placed structures', 'build', 'Improves supported structure durability.')],
        ['Worldsmith', effect('build_keystone_pct', 12, '%', 'Large construction projects', 'build', 'Exclusive keystone improving supported large-project build performance.', true)],
      ]],
      ['explorer', 'Explorer', 'map', [
        ['Wide Horizon', effect('map_reveal_radius_pct', 10, '%', 'Map reveal radius', 'map', 'Expands supported map reveal radius.')],
        ['Roadrunner', effect('out_of_combat_move_speed_pct', 5, '%', 'Open-world traversal', 'movement', 'Improves supported traversal speed.')],
        ['Resource Eye', effect('resource_detection_radius_pct', 8, '%', 'Open-world resources', 'reveal', 'Expands supported resource detection radius.')],
        ['Frontier Legend', effect('world_event_reward_pct', 10, '%', 'Open-world events', 'world', 'Exclusive keystone improving supported open-world event rewards.', true)],
      ]],
      ['creative', 'Creative', 'sparkles', [
        ['Material Saver', effect('craft_cost_reduction_pct', 4, '%', 'Creative recipes', 'craft', 'Reduces supported creative recipe costs.')],
        ['Tool Master', effect('tool_efficiency_pct', 6, '%', 'Gather/build tools', 'tool', 'Improves supported tool efficiency.')],
        ['Experimenter', effect('recipe_discovery_pct', 6, '%', 'Recipe discovery systems', 'craft', 'Improves supported recipe discovery progress.')],
        ['Limit Breaker', effect('sandbox_cap_bonus_pct', 10, '%', 'Developer-approved sandbox caps', 'world', 'Exclusive keystone extending developer-approved sandbox limits.', true)],
      ]],
    ],
  },
};

const WEB_WIDTH = 2600;
const WEB_HEIGHT = 2400;
const WEB_CENTER = { x: 1300, y: 1200 };
const BRANCH_ANGLES = [-90, 30, 150];
const ABILITY_RADII = [320, 570, 820, 1070];
const ABILITY_LEVELS = [1, 10, 22, 38];
const ABILITY_COSTS = [1, 2, 3, 4];
const PERK_LEVEL_OFFSETS = [1, 2, 3, 5, 7, 9, 12];
const PERK_COSTS = [1, 1, 1, 1, 1, 2, 2];
const PERK_ANGLE_OFFSETS = [-78, -54, -28, 0, 28, 54, 78];
const PERK_RADII = [118, 108, 102, 96, 102, 108, 118];
const PERK_FACTORS = [0.16, 0.2, 0.24, 0.18, 0.22, 0.28, 0.36];
const PERK_TITLES = ['Calibration', 'Efficiency', 'Control', 'Rhythm', 'Synergy', 'Momentum', 'Apex'];

function polarPoint(angleDegrees: number, radius: number) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: Math.round(WEB_CENTER.x + Math.cos(angle) * radius),
    y: Math.round(WEB_CENTER.y + Math.sin(angle) * radius),
  };
}

function scaledEffect(base: any, index: number, abilityName: string) {
  const numeric = Number(base?.value || 0);
  const raw = numeric * PERK_FACTORS[index];
  const wholeUnits = new Set(['rounds', 'ms', 'HP', 'mistake', 'meters', 'm']);
  const value = wholeUnits.has(String(base?.unit || ''))
    ? Math.max(1, Math.round(raw))
    : Math.max(0.5, Math.round(raw * 10) / 10);
  return {
    ...base,
    value,
    exclusive: !!base?.exclusive,
    description: `${PERK_TITLES[index]} further develops ${abilityName}. It stacks through the same Atom x Eve integration key while preserving the supported game's own balance rules.`,
  };
}

function buildCatalog(genreId: string) {
  const genre = GENRES[genreId];
  if (!genre) return null;

  const nodes: any[] = [];
  const rootId = `${genreId}:core`;
  nodes.push({
    id: rootId,
    genre_id: genreId,
    node_type: 'core',
    branch_id: 'core',
    branch_name: 'Core',
    branch_icon: 'sparkles',
    name: `${genre.name} Core`,
    tier: 0,
    cost: 0,
    required_level: 1,
    prerequisite_id: null,
    link_ids: [],
    exclusive: false,
    effect: null,
    x: WEB_CENTER.x,
    y: WEB_CENTER.y,
    description: `The center of the ${genre.name} mastery web. Every specialization grows outward from this core as your genre level rises.`,
    demo: { kind: 'system', title: `${genre.name} mastery core`, before_label: 'Level 1', after_label: 'Choose a path' },
  });

  genre.branches.forEach((branch: any, branchIndex: number) => {
    const [branchId, branchName, branchIcon, abilities] = branch;
    const branchAngle = BRANCH_ANGLES[branchIndex] ?? (branchIndex * 120 - 90);
    const gatewayId = `${genreId}:${branchId}:gateway`;
    const gatewayPoint = polarPoint(branchAngle, 165);
    nodes.push({
      id: gatewayId,
      genre_id: genreId,
      node_type: 'gateway',
      branch_id: branchId,
      branch_name: branchName,
      branch_icon: branchIcon,
      name: `${branchName} Path`,
      tier: 0,
      cost: 0,
      required_level: 1,
      prerequisite_id: rootId,
      link_ids: [rootId],
      exclusive: false,
      effect: null,
      x: gatewayPoint.x,
      y: gatewayPoint.y,
      description: `Gateway into the ${branchName} specialization web.`,
      demo: { kind: 'system', title: `${branchName} path`, before_label: 'Core', after_label: 'Specialize' },
    });

    abilities.forEach((ability: any, index: number) => {
      const tier = index + 1;
      const [name, fx] = ability;
      const id = `${genreId}:${branchId}:t${tier}`; // preserved for existing player unlocks
      const abilityPoint = polarPoint(branchAngle, ABILITY_RADII[index] || ABILITY_RADII[ABILITY_RADII.length - 1]);
      const previousAbilityId = tier === 1 ? gatewayId : `${genreId}:${branchId}:t${tier - 1}`;
      nodes.push({
        id,
        genre_id: genreId,
        node_type: 'ability',
        branch_id: branchId,
        branch_name: branchName,
        branch_icon: branchIcon,
        name,
        tier,
        cost: ABILITY_COSTS[index] || 1,
        required_level: ABILITY_LEVELS[index] || 1,
        prerequisite_id: previousAbilityId,
        link_ids: [previousAbilityId],
        exclusive: !!fx.exclusive,
        effect: fx,
        x: abilityPoint.x,
        y: abilityPoint.y,
        description: fx.description,
        demo: { kind: fx.demo, title: `${name} demonstration`, before_label: 'Base game', after_label: 'With ability' },
        satellite_count: 7,
      });

      const satelliteIds = Array.from({ length: 7 }, (_, perkIndex) => `${id}:p${perkIndex + 1}`);
      satelliteIds.forEach((perkId, perkIndex) => {
        const satelliteAngle = branchAngle + PERK_ANGLE_OFFSETS[perkIndex];
        const radius = PERK_RADII[perkIndex];
        const radians = (satelliteAngle * Math.PI) / 180;
        const x = Math.round(abilityPoint.x + Math.cos(radians) * radius);
        const y = Math.round(abilityPoint.y + Math.sin(radians) * radius);
        const dependencyMap = [null, null, 0, 0, 1, 2, 4];
        const dependencyIndex = dependencyMap[perkIndex];
        const prerequisiteId = dependencyIndex === null ? id : satelliteIds[dependencyIndex];
        const secondaryLinks = [
          [],
          [satelliteIds[0]],
          [satelliteIds[1]],
          [satelliteIds[1]],
          [satelliteIds[2]],
          [satelliteIds[3]],
          [satelliteIds[5]],
        ][perkIndex] || [];
        const perkFx = scaledEffect(fx, perkIndex, name);
        nodes.push({
          id: perkId,
          genre_id: genreId,
          node_type: 'perk',
          ability_id: id,
          ability_name: name,
          branch_id: branchId,
          branch_name: branchName,
          branch_icon: branchIcon,
          name: `${PERK_TITLES[perkIndex]} ${name}`,
          short_name: PERK_TITLES[perkIndex],
          tier,
          perk_index: perkIndex + 1,
          cost: PERK_COSTS[perkIndex],
          required_level: Math.min(50, (ABILITY_LEVELS[index] || 1) + PERK_LEVEL_OFFSETS[perkIndex]),
          prerequisite_id: prerequisiteId,
          link_ids: [prerequisiteId, ...secondaryLinks].filter(Boolean),
          exclusive: !!perkFx.exclusive,
          effect: perkFx,
          x,
          y,
          description: perkFx.description,
          demo: { kind: fx.demo, title: `${PERK_TITLES[perkIndex]} ${name}`, before_label: name, after_label: 'Enhanced' },
        });
      });
    });
  });

  return {
    id: genreId,
    name: genre.name,
    short: genre.short,
    aliases: genre.aliases,
    xp_name: genre.xpName,
    branches: genre.branches.map((b: any, index: number) => ({ id: b[0], name: b[1], icon: b[2], angle: BRANCH_ANGLES[index] })),
    world: {
      width: WEB_WIDTH,
      height: WEB_HEIGHT,
      center_x: WEB_CENTER.x,
      center_y: WEB_CENTER.y,
      level_rings: [
        { level: 1, radius: 320 },
        { level: 10, radius: 570 },
        { level: 22, radius: 820 },
        { level: 38, radius: 1070 },
        { level: 50, radius: 1210 },
      ],
    },
    node_count: nodes.length,
    nodes,
  };
}

function canonicalGenre(raw: string) {
  const value = String(raw || '').toLowerCase().replace(/\s+/g, '_');
  if (GENRES[value]) return value;
  for (const [id, genre] of Object.entries(GENRES)) {
    if ((genre as any).aliases.some((alias: string) => alias.toLowerCase().replace(/\s+/g, '_') === value)) return id;
  }
  return value;
}

function progressionNames(genreId: string) {
  const map: Record<string, string[]> = {
    shooter: ['FPS', 'Shooter'], action: ['Action'], fighting: ['Fighting'], rpg: ['RPG', 'Fantasy'], mmorpg: ['MMO', 'MMORPG'],
    adventure: ['Adventure'], scifi: ['Sci-Fi', 'SciFi'], strategy: ['Strategy'], simulation: ['Simulation'], sports: ['Sports'], racing: ['Racing'],
    puzzle: ['Puzzle'], platformer: ['Platformer'], horror: ['Horror', 'Fear'], survival: ['Survival'], sandbox: ['Sandbox', 'Open World'],
  };
  return map[genreId] || [genreId];
}

async function getGenreLevel(svc: any, userId: string, genreId: string) {
  const rows = await svc.AvatarProgression.filter({ user_id: userId }, '-updated_date', 1).catch(() => []);
  const progression = rows?.[0];
  if (!progression) return 1;
  const names = progressionNames(genreId).map((n) => n.toLowerCase());
  const match = (progression.genres || []).find((g: any) => names.includes(String(g.name || '').toLowerCase()));
  return Math.max(1, Number(match?.level || 1));
}

function pointEntitlement(level: number) {
  // The web is intentionally much larger than the available point pool. Each
  // genre level grants one point, so level 50 means 50 meaningful choices
  // across a 100-node mastery web instead of automatically owning everything.
  return Math.max(1, Math.floor(Math.max(1, level)));
}

async function audit(svc: any, userId: string, genreId: string, action: string, extra: any = {}) {
  try {
    await svc.GenreSkillAudit.create({ user_id: userId, genre_id: genreId, action, node_id: extra.node_id || '', point_delta: Number(extra.point_delta || 0), game_id: extra.game_id || '', metadata: extra.metadata || {} });
  } catch (error) {
    console.warn('[genreSkillTree] audit failed', error);
  }
}

async function syncProgress(svc: any, userId: string, genreId: string) {
  const catalog = buildCatalog(genreId);
  if (!catalog) throw new Error('Unknown genre');
  const level = await getGenreLevel(svc, userId, genreId);
  const entitlement = pointEntitlement(level);
  const rows = await svc.GenreSkillProgress.filter({ user_id: userId, genre_id: genreId }, '-updated_date', 5);
  let record = rows?.[0] || null;
  const structuralIds = catalog.nodes.filter((node: any) => node.node_type === 'core' || node.node_type === 'gateway').map((node: any) => node.id);
  if (!record) {
    record = await svc.GenreSkillProgress.create({ user_id: userId, genre_id: genreId, genre_level_snapshot: level, earned_points: entitlement, spent_points: 0, available_points: entitlement, unlocked_node_ids: structuralIds, revision: 1 });
    await audit(svc, userId, genreId, 'sync_points', { point_delta: entitlement, metadata: { level, initial: true, web_version: 2 } });
    return record;
  }

  const unlocked = new Set((record.unlocked_node_ids || []).filter((id: string) => catalog.nodes.some((n: any) => n.id === id)));
  structuralIds.forEach((id: string) => unlocked.add(id));
  const spent = catalog.nodes.filter((n: any) => unlocked.has(n.id)).reduce((sum: number, n: any) => sum + Number(n.cost || 0), 0);
  const earned = Math.max(Number(record.earned_points || 0), entitlement, spent);
  const available = Math.max(0, earned - spent);
  const needsUpdate = Number(record.genre_level_snapshot || 0) !== level || Number(record.spent_points || 0) !== spent || Number(record.earned_points || 0) !== earned || Number(record.available_points || 0) !== available || (record.unlocked_node_ids || []).length !== unlocked.size;
  if (needsUpdate) {
    const delta = earned - Number(record.earned_points || 0);
    record = await svc.GenreSkillProgress.update(record.id, { genre_level_snapshot: level, earned_points: earned, spent_points: spent, available_points: available, unlocked_node_ids: [...unlocked], revision: Number(record.revision || 0) + 1 });
    if (delta) await audit(svc, userId, genreId, 'sync_points', { point_delta: delta, metadata: { level } });
  }
  return record;
}

function aggregateEffects(nodes: any[]) {
  const result: Record<string, any> = {};
  for (const node of nodes) {
    const fx = node.effect;
    if (!fx?.key) continue;
    if (!result[fx.key]) result[fx.key] = { key: fx.key, value: 0, unit: fx.unit, sources: [] as string[] };
    result[fx.key].value += Number(fx.value || 0);
    result[fx.key].sources.push(node.id);
  }
  return Object.values(result);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || 'get_state');
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities;

    if (action === 'list_genres') {
      return json({ success: true, genres: Object.keys(GENRES).map((id) => { const c = buildCatalog(id)!; return { id, name: c.name, short: c.short, xp_name: c.xp_name, aliases: c.aliases, branches: c.branches }; }) });
    }

    if (action === 'get_state') {
      const genreId = canonicalGenre(data.genre_id);
      const catalog = buildCatalog(genreId);
      if (!catalog) return json({ error: 'Unknown genre' }, 404);
      const progress = await syncProgress(svc, String(user.id), genreId);
      const integrations = await svc.GamePerkIntegration.filter({ enabled: true }, '-updated_date', 250).catch(() => []);
      const compatible = [] as any[];
      for (const integration of integrations || []) {
        if (!(integration.genre_ids || []).map(canonicalGenre).includes(genreId)) continue;
        const game = await svc.Game.get(integration.game_id).catch(() => null);
        compatible.push({ game_id: integration.game_id, title: game?.title || 'Integrated Game', cover_image: game?.cover_image || '', tier: integration.integration_tier || 'supported', supported_effect_keys: integration.supported_effect_keys || [], sdk_version: integration.sdk_version || '1.0' });
      }
      return json({ success: true, catalog, progress, compatible_games: compatible });
    }

    if (action === 'unlock') {
      const genreId = canonicalGenre(data.genre_id);
      const catalog = buildCatalog(genreId);
      if (!catalog) return json({ error: 'Unknown genre' }, 404);
      const nodeId = String(data.node_id || '');
      const node = catalog.nodes.find((n: any) => n.id === nodeId);
      if (!node) return json({ error: 'Perk node not found' }, 404);
      const progress = await syncProgress(svc, String(user.id), genreId);
      const unlocked = new Set(progress.unlocked_node_ids || []);
      if (unlocked.has(node.id)) return json({ success: true, progress, already_unlocked: true, node });
      if (Number(progress.genre_level_snapshot || 1) < Number(node.required_level || 1)) return json({ error: `Genre level ${node.required_level} required`, code: 'LEVEL_REQUIRED' }, 409);
      if (node.prerequisite_id && !unlocked.has(node.prerequisite_id)) return json({ error: 'Previous perk in this branch must be unlocked first', code: 'PREREQUISITE_REQUIRED' }, 409);
      if (Number(progress.available_points || 0) < Number(node.cost || 0)) return json({ error: 'Not enough genre skill points', code: 'POINTS_REQUIRED' }, 409);
      unlocked.add(node.id);
      const spent = catalog.nodes.filter((n: any) => unlocked.has(n.id)).reduce((sum: number, n: any) => sum + Number(n.cost || 0), 0);
      const updated = await svc.GenreSkillProgress.update(progress.id, { unlocked_node_ids: [...unlocked], spent_points: spent, available_points: Math.max(0, Number(progress.earned_points || 0) - spent), revision: Number(progress.revision || 0) + 1 });
      await audit(svc, String(user.id), genreId, 'unlock', { node_id: node.id, point_delta: -Number(node.cost || 0), metadata: { effect_key: node.effect?.key || '', node_type: node.node_type, exclusive: node.exclusive } });
      return json({ success: true, progress: updated, node });
    }

    if (action === 'respec') {
      const genreId = canonicalGenre(data.genre_id);
      const catalog = buildCatalog(genreId);
      if (!catalog) return json({ error: 'Unknown genre' }, 404);
      const progress = await syncProgress(svc, String(user.id), genreId);
      const refunded = Number(progress.spent_points || 0);
      const updated = await svc.GenreSkillProgress.update(progress.id, { unlocked_node_ids: [], spent_points: 0, available_points: Number(progress.earned_points || 0), revision: Number(progress.revision || 0) + 1, last_respec_at: new Date().toISOString() });
      await audit(svc, String(user.id), genreId, 'respec', { point_delta: refunded, metadata: { refunded } });
      return json({ success: true, progress: updated, refunded });
    }

    if (action === 'grant_points') {
      if (user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
      const targetUserId = String(data.user_id || '').trim();
      const genreId = canonicalGenre(data.genre_id);
      const amount = Math.max(1, Math.floor(Number(data.amount || 0)));
      if (!targetUserId || !buildCatalog(genreId)) return json({ error: 'Valid user_id and genre_id are required' }, 400);
      const progress = await syncProgress(svc, targetUserId, genreId);
      const earned = Number(progress.earned_points || 0) + amount;
      const updated = await svc.GenreSkillProgress.update(progress.id, {
        earned_points: earned,
        available_points: Math.max(0, earned - Number(progress.spent_points || 0)),
        revision: Number(progress.revision || 0) + 1,
      });
      await audit(svc, targetUserId, genreId, 'sync_points', { point_delta: amount, metadata: { source: String(data.source || 'admin_reward').slice(0, 120) } });
      return json({ success: true, progress: updated, granted: amount });
    }

    if (action === 'configure_game_integration') {
      if (user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
      const gameId = String(data.game_id || '').trim();
      if (!gameId) return json({ error: 'game_id is required' }, 400);
      const genreIds = [...new Set((data.genre_ids || []).map(canonicalGenre).filter((id: string) => !!GENRES[id]))];
      if (!genreIds.length) return json({ error: 'At least one valid genre_id is required' }, 400);
      const payload = {
        game_id: gameId,
        enabled: data.enabled !== false,
        integration_tier: data.integration_tier === 'exclusive' ? 'exclusive' : 'supported',
        genre_ids: genreIds,
        supported_effect_keys: [...new Set((data.supported_effect_keys || []).map((value: any) => String(value).trim()).filter(Boolean))],
        sdk_version: String(data.sdk_version || '1.0').slice(0, 40),
        build_id: String(data.build_id || '').slice(0, 120),
        notes: String(data.notes || '').slice(0, 1000),
      };
      const existing = await svc.GamePerkIntegration.filter({ game_id: gameId }, '-updated_date', 1).catch(() => []);
      const integration = existing?.length ? await svc.GamePerkIntegration.update(existing[0].id, payload) : await svc.GamePerkIntegration.create(payload);
      return json({ success: true, integration });
    }

    if (action === 'get_game_effects') {
      const gameId = String(data.game_id || '').trim();
      if (!gameId) return json({ error: 'game_id is required' }, 400);
      const rows = await svc.GamePerkIntegration.filter({ game_id: gameId, enabled: true }, '-updated_date', 1).catch(() => []);
      const integration = rows?.[0];
      if (!integration) return json({ success: true, integrated: false, game_id: gameId, effects: [], reason: 'Game has not enabled Atom x Eve genre perks.' });
      const allowedKeys = new Set((integration.supported_effect_keys || []).map(String));
      const allowAll = allowedKeys.has('*');
      const genreIds = (integration.genre_ids || []).map(canonicalGenre).filter((id: string) => !!GENRES[id]);
      const appliedNodes: any[] = [];
      for (const genreId of genreIds) {
        const catalog = buildCatalog(genreId)!;
        const progress = await syncProgress(svc, String(user.id), genreId);
        const unlocked = new Set(progress.unlocked_node_ids || []);
        for (const node of catalog.nodes) {
          if (!unlocked.has(node.id)) continue;
          if (!node.effect?.key) continue;
          if (node.exclusive && integration.integration_tier !== 'exclusive') continue;
          if (!allowAll && !allowedKeys.has(node.effect.key)) continue;
          appliedNodes.push(node);
        }
      }
      const effects = aggregateEffects(appliedNodes);
      for (const genreId of genreIds) await audit(svc, String(user.id), genreId, 'resolve_game_effects', { game_id: gameId, metadata: { integration_tier: integration.integration_tier, node_count: appliedNodes.length, effect_count: effects.length } });
      return json({ success: true, integrated: true, game_id: gameId, integration_tier: integration.integration_tier || 'supported', sdk_version: integration.sdk_version || '1.0', effects, nodes: appliedNodes.map((node) => ({ id: node.id, name: node.name, effect: node.effect, exclusive: node.exclusive })) });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('[genreSkillTree]', error);
    return json({ error: error?.message || 'Genre skill tree service failed' }, 500);
  }
});
