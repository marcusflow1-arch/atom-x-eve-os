// AI Achievements Data - Fighting Styles, Movement, Combat Techniques
// Each game teaches the AI specific combat behaviors, personality traits, and tactical approaches

export const aiAchievementsData = {
  'monster_hunter_wilds': {
    aiXP: 2500,
    achievementPoints: 1800,
    holographicPreview: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'mhw_1',
        name: 'Weapon Specialization Mastery',
        icon: '⚔️',
        description: 'AI learns to adapt combat style based on 14 different weapon types - from fast dual blades to powerful great swords.',
        image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=400&h=600&fit=crop',
        behaviorImpact: 'Adaptive weapon switching, fluid combat transitions',
        combatStyle: 'Versatile Hunter - Switches tactics based on enemy patterns'
      },
      {
        id: 'mhw_2',
        name: 'Monster Pattern Recognition',
        icon: '🎯',
        description: 'Tracks and analyzes creature behavior patterns, telegraphed attacks, and weak points for strategic positioning.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Predictive dodging, weak point targeting',
        combatStyle: 'Tactical Observer - Studies enemy patterns before engaging'
      },
      {
        id: 'mhw_3',
        name: 'Environmental Combat Awareness',
        icon: '🌍',
        description: 'Uses terrain, traps, and environmental hazards as part of hunting strategy.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Environmental exploitation, trap placement',
        combatStyle: 'Strategic Hunter - Leverages surroundings for advantage'
      },
      {
        id: 'mhw_4',
        name: 'Cooperative Team Tactics',
        icon: '🤝',
        description: 'Learns coordinated assault patterns and support roles in multiplayer hunts.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Team synchronization, support positioning',
        combatStyle: 'Pack Hunter - Coordinates with team for maximum efficiency'
      },
      {
        id: 'mhw_5',
        name: 'Hit-and-Run Precision',
        icon: '⚡',
        description: 'Masters timing windows for high-damage strikes followed by evasive repositioning.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'Burst damage windows, safe retreat timing',
        combatStyle: 'Surgical Striker - Precise attacks with minimal risk exposure'
      }
    ]
  },

  'black_myth_wukong': {
    aiXP: 3000,
    achievementPoints: 2200,
    holographicPreview: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'bmw_1',
        name: 'Staff Martial Arts Mastery',
        icon: '🥋',
        description: 'Chinese martial arts staff techniques including spinning strikes, sweep attacks, and aerial combos.',
        image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=600&fit=crop',
        behaviorImpact: 'Fluid staff combos, spinning momentum attacks',
        combatStyle: 'Wushu Master - Flowing martial arts with staff emphasis'
      },
      {
        id: 'bmw_2',
        name: 'Shape-Shifting Combat',
        icon: '🦍',
        description: 'Learns transformation techniques and adaptive combat forms based on enemy types.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Form-based adaptability, transformation timing',
        combatStyle: 'Shapeshifter - Adapts physical form to combat needs'
      },
      {
        id: 'bmw_3',
        name: 'Acrobatic Evasion',
        icon: '🎭',
        description: 'Monkey King agility - somersaults, wall-running, and nimble dodging patterns.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Enhanced mobility, aerial superiority',
        combatStyle: 'Nimble Trickster - Uses agility to outmaneuver opponents'
      },
      {
        id: 'bmw_4',
        name: 'Mystical Spell Integration',
        icon: '✨',
        description: 'Blends martial prowess with magical abilities for devastating combo chains.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        behaviorImpact: 'Magic-melee fusion, spell-enhanced strikes',
        combatStyle: 'Mystic Warrior - Combines physical and magical attacks'
      },
      {
        id: 'bmw_5',
        name: 'Trickster Combat Psychology',
        icon: '😈',
        description: 'Deceptive tactics, feints, and unpredictable attack patterns that confuse enemies.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'Unpredictability, psychological warfare',
        combatStyle: 'Clever Deceiver - Misdirection and surprise attacks'
      }
    ]
  },

  'elden_ring_nightreign': {
    aiXP: 2800,
    achievementPoints: 2000,
    holographicPreview: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'ern_1',
        name: 'Souls-Like Precision Combat',
        icon: '⚔️',
        description: 'Mastery of stamina management, precise roll timing, and punishing counterattacks.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'Stamina optimization, perfect dodge timing',
        combatStyle: 'Patient Duelist - Waits for openings to deliver powerful strikes'
      },
      {
        id: 'ern_2',
        name: 'Dual Weapon Synergy',
        icon: '🗡️',
        description: 'Coordination between weapons in both hands for fluid combo chains and stance shifts.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Dual-wield mastery, weapon-switching combos',
        combatStyle: 'Ambidextrous Warrior - Seamlessly combines dual weapon attacks'
      },
      {
        id: 'ern_3',
        name: 'Guard Counter Expertise',
        icon: '🛡️',
        description: 'Defensive blocking followed by devastating ripostes and critical strikes.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Defensive aggression, counterattack timing',
        combatStyle: 'Shield Brawler - Blocks then punishes with heavy counters'
      },
      {
        id: 'ern_4',
        name: 'Cooperative Roguelike Adaptation',
        icon: '🔄',
        description: 'Learns from death, adapts strategies in procedural challenges, coordinates with allies.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Failure-based learning, adaptive tactics',
        combatStyle: 'Persistent Learner - Improves strategy with each attempt'
      },
      {
        id: 'ern_5',
        name: 'Magic-Melee Hybrid Combat',
        icon: '🔮',
        description: 'Integrates sorceries and incantations into close-quarters weapon combat.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        behaviorImpact: 'Spell-weaving melee, range flexibility',
        combatStyle: 'Spellblade - Mixes magic with physical attacks'
      }
    ]
  },

  'assassins_creed_shadows': {
    aiXP: 2400,
    achievementPoints: 1900,
    holographicPreview: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'acs_1',
        name: 'Samurai Katana Mastery',
        icon: '⚔️',
        description: 'Precise katana strikes, stance-based combat, and honorable dueling techniques.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Precision strikes, stance transitions',
        combatStyle: 'Honor-Bound Warrior - Disciplined frontal combat'
      },
      {
        id: 'acs_2',
        name: 'Shinobi Stealth Tactics',
        icon: '🥷',
        description: 'Silent movement, assassination techniques, shadow blending, and misdirection.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Stealth priority, silent takedowns',
        combatStyle: 'Shadow Assassin - Eliminates targets without detection'
      },
      {
        id: 'acs_3',
        name: 'Dual Character Adaptability',
        icon: '⚡',
        description: 'Switches between aggressive samurai and stealthy ninja approaches based on situation.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'Role-based flexibility, tactical switching',
        combatStyle: 'Dual Persona - Adapts combat identity to mission needs'
      },
      {
        id: 'acs_4',
        name: 'Parkour Assassination',
        icon: '🏃',
        description: 'Vertical mobility, rooftop traversal, and aerial assassinations from above.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Vertical combat advantage, aerial strikes',
        combatStyle: 'Urban Predator - Uses architecture for assassination angles'
      },
      {
        id: 'acs_5',
        name: 'Social Stealth Infiltration',
        icon: '🎭',
        description: 'Blends into crowds, disguises, and manipulates social environments for stealth kills.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        behaviorImpact: 'Crowd manipulation, disguise tactics',
        combatStyle: 'Hidden Blade - Strikes from plain sight'
      }
    ]
  },

  'helldivers_2': {
    aiXP: 2100,
    achievementPoints: 1700,
    holographicPreview: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'hd2_1',
        name: 'Tactical Squad Coordination',
        icon: '🎯',
        description: 'Team positioning, covering fire, synchronized assaults, and revive prioritization.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Squad synergy, role awareness',
        combatStyle: 'Team Operative - Prioritizes group success over individual glory'
      },
      {
        id: 'hd2_2',
        name: 'Stratagem Loadout Optimization',
        icon: '📡',
        description: 'Strategic deployment of orbital strikes, resupplies, and support stratagems.',
        image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop',
        behaviorImpact: 'Resource management, strategic support',
        combatStyle: 'Support Specialist - Provides tactical advantages through stratagems'
      },
      {
        id: 'hd2_3',
        name: 'Suppressive Fire Doctrine',
        icon: '🔫',
        description: 'Continuous fire to control enemy movement, create safe zones for allies.',
        image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=600&fit=crop',
        behaviorImpact: 'Area denial, covering fire patterns',
        combatStyle: 'Heavy Gunner - Pins down enemies with sustained firepower'
      },
      {
        id: 'hd2_4',
        name: 'Friendly Fire Avoidance',
        icon: '⚠️',
        description: 'Spatial awareness to avoid hitting teammates in chaotic third-person firefights.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Precision targeting, teammate tracking',
        combatStyle: 'Careful Marksman - Never sacrifices allies for kills'
      },
      {
        id: 'hd2_5',
        name: 'Objective-Focused Aggression',
        icon: '🎖️',
        description: 'Balances combat engagement with mission completion priority.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Mission priority, tactical disengagement',
        combatStyle: 'Mission-Driven - Completes objectives over pursuing kills'
      }
    ]
  },

  'cyberpunk_2077': {
    aiXP: 2600,
    achievementPoints: 1950,
    holographicPreview: 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'cp77_1',
        name: 'Netrunner Hacking',
        icon: '💻',
        description: 'Remote enemy neutralization, camera hacking, and battlefield control through cybernetics.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        behaviorImpact: 'Tech warfare, system exploitation',
        combatStyle: 'Digital Infiltrator - Controls battlefield through hacking'
      },
      {
        id: 'cp77_2',
        name: 'Mantis Blade Melee',
        icon: '🦾',
        description: 'Cybernetic blade combat with rapid slashes, lunge attacks, and close-quarters dominance.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Aggressive melee, cyber-augmented speed',
        combatStyle: 'Cyber Samurai - Augmented blade specialist'
      },
      {
        id: 'cp77_3',
        name: 'Sandevistan Time Dilation',
        icon: '⚡',
        description: 'Slowed time perception for precise targeting and rapid multi-target elimination.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Time manipulation, surgical strikes',
        combatStyle: 'Speed Demon - Moves faster than enemies can react'
      },
      {
        id: 'cp77_4',
        name: 'Street Brawler Techniques',
        icon: '🥊',
        description: 'Hand-to-hand combat, grappling, and street-fighting brutality.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'CQC dominance, raw physicality',
        combatStyle: 'Bare-Knuckle Brawler - Relies on fists and brutality'
      },
      {
        id: 'cp77_5',
        name: 'Stealth Netrunner Hybrid',
        icon: '🕵️',
        description: 'Combines stealth approaches with quickhacking for silent, non-lethal takedowns.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Ghost protocol, zero detection',
        combatStyle: 'Phantom Operative - Never seen, never heard'
      }
    ]
  },

  'baldurs_gate_3': {
    aiXP: 2700,
    achievementPoints: 2100,
    holographicPreview: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'bg3_1',
        name: 'Tactical Turn-Based Positioning',
        icon: '🎲',
        description: 'D&D 5e combat tactics - high ground advantage, flanking, and action economy optimization.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'Strategic positioning, battlefield control',
        combatStyle: 'Chess Master - Plans several moves ahead'
      },
      {
        id: 'bg3_2',
        name: 'Spell Slot Management',
        icon: '🔮',
        description: 'Resource conservation, knowing when to use powerful spells vs cantrips.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Resource efficiency, burst damage timing',
        combatStyle: 'Calculating Caster - Reserves power for critical moments'
      },
      {
        id: 'bg3_3',
        name: 'Party Synergy Composition',
        icon: '⚔️',
        description: 'Builds complementary party roles - tank, healer, DPS, crowd control.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Team composition, role fulfillment',
        combatStyle: 'Balanced Leader - Creates effective party dynamics'
      },
      {
        id: 'bg3_4',
        name: 'Environmental Hazard Exploitation',
        icon: '💥',
        description: 'Uses explosive barrels, water surfaces, high ledges for tactical advantages.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Creative problem solving, environmental kills',
        combatStyle: 'Creative Tactician - Turns environment into weapon'
      },
      {
        id: 'bg3_5',
        name: 'Moral Choice Consequence Awareness',
        icon: '⚖️',
        description: 'Factors long-term story consequences into combat decisions and dialogue choices.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        behaviorImpact: 'Ethical combat decisions, diplomacy priority',
        combatStyle: 'Thoughtful Warrior - Considers consequences beyond battle'
      }
    ]
  },

  'sample_1': { // Elder Scrolls: Reborn
    aiXP: 2500,
    achievementPoints: 1850,
    holographicPreview: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'es_1',
        name: 'Dragonborn Shout Mastery',
        icon: '🐉',
        description: 'Thu\'um combat integration - uses dragon shouts to control battlefield and devastate enemies.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        behaviorImpact: 'Voice-based crowd control, area devastation',
        combatStyle: 'Dragonborn Warrior - Channels ancient dragon power'
      },
      {
        id: 'es_2',
        name: 'Stealth Archer Dominance',
        icon: '🏹',
        description: 'Long-range stealth kills with precision archery and sneak attack multipliers.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Range dominance, stealth priority',
        combatStyle: 'Shadow Marksman - Eliminates before detection'
      },
      {
        id: 'es_3',
        name: 'Dual-Wield Spell Combat',
        icon: '✨',
        description: 'Casts different spells from each hand simultaneously for devastating magical combos.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        behaviorImpact: 'Spell combination, elemental synergy',
        combatStyle: 'Dual Mage - Weaves complex spell patterns'
      },
      {
        id: 'es_4',
        name: 'Heavy Armor Berserker',
        icon: '🛡️',
        description: 'Frontal assault with two-handed weapons, absorbs damage while dealing massive hits.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Aggressive tanking, damage absorption',
        combatStyle: 'Juggernaut - Unstoppable frontal force'
      },
      {
        id: 'es_5',
        name: 'Conjuration Summoner',
        icon: '👻',
        description: 'Summons creatures to fight alongside, using minions as distraction and support.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Summoning tactics, minion management',
        combatStyle: 'Necromancer - Commands undead army'
      }
    ]
  }
};

// Helper function to get AI achievements for any game
export const getAIAchievements = (gameId) => {
  return aiAchievementsData[gameId] || {
    aiXP: 1500,
    achievementPoints: 1200,
    holographicPreview: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=600&fit=crop',
    perks: [
      {
        id: 'default_1',
        name: 'Combat Fundamentals',
        icon: '⚔️',
        description: 'Basic attack patterns, defense techniques, and movement control.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
        behaviorImpact: 'Foundation combat skills',
        combatStyle: 'Balanced Fighter - Learns core mechanics'
      },
      {
        id: 'default_2',
        name: 'Strategic Positioning',
        icon: '🎯',
        description: 'Learns optimal positioning for both offense and defense.',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
        behaviorImpact: 'Spatial awareness',
        combatStyle: 'Tactical Thinker - Uses positioning advantage'
      },
      {
        id: 'default_3',
        name: 'Resource Management',
        icon: '💎',
        description: 'Manages health, stamina, ammo, and abilities efficiently.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
        behaviorImpact: 'Resource conservation',
        combatStyle: 'Efficient Fighter - Never wastes resources'
      }
    ]
  };
};