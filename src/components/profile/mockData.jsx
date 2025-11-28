export const profileData = {
    id: "user_123",
    name: "Marcus",
    level: 12,
    xp: 3450,
    xpRequired: 5000,
    genres: ["MMO", "Shooter"],
    aspects: ["aspect_1", "aspect_2", null],
    attributes: { "str": 0, "dex": 0, "int": 0, "will": 0 },
    equipped: {
        weapons: ["item_501", "item_502", null],
        armor: { 
            "head": "item_601", 
            "chest": "item_602", 
            "gloves": "item_603",
            "boots": null,
            "pants": null,
            "cape": null
        },
        artifacts: ["item_701", null, null],
        skills: ["skill_201", "skill_203", null, null, null, null, null, null],
        aspects: ["aspect_1", "aspect_2", null],
        passives: ["passive_101", "passive_102"]
    },
    skillLoadouts: {
        "default": ["skill_201", "skill_203", null, null, null, null, null, null],
        "pvp": ["skill_201", null, null, null, null, null, null, null],
        "pve": ["skill_203", null, null, null, null, null, null, null]
    },
    activeLoadout: "default",
    availableStatPoints: 15,
    inventoryCount: 5,
    inventoryCapacity: 400
};

export const itemData = {
    "item_501": { "itemId": "item_501", "type": "weapon", "subtype": "rifle", "name": "Eclipse Carbine", "rarity": "Epic", "levelRequirement": 10, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/weapon1_s1oyap.png", "genreCompatibility": ["Shooter", "Sci-Fi"] },
    "item_502": { "itemId": "item_502", "type": "weapon", "subtype": "sword", "name": "Blade of the Abyss", "rarity": "Legendary", "levelRequirement": 15, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/weapon2_g9s0p8.png", "genreCompatibility": ["MMO", "Fantasy"] },
    "item_601": { "itemId": "item_601", "type": "armor", "subtype": "head", "name": "Chronomancer's Cowl", "rarity": "Epic", "levelRequirement": 10, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/helmet_u8xnmz.png", "genreCompatibility": ["MMO", "Sci-Fi"] },
    "item_602": { "itemId": "item_602", "type": "armor", "subtype": "chest", "name": "Aegis of the Void", "rarity": "Rare", "levelRequirement": 8, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/armor_x5vljs.png", "genreCompatibility": ["MMO", "Sci-Fi"] },
    "item_603": { "itemId": "item_603", "type": "armor", "subtype": "gloves", "name": "Gauntlets of Alacrity", "rarity": "Uncommon", "levelRequirement": 5, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/gloves_l9s8q2.png", "genreCompatibility": ["MMO", "Shooter"] },
    "item_701": { "itemId": "item_701", "type": "artifact", "name": "Heart of the Star", "rarity": "Mythic", "levelRequirement": 20, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/artifact_b5dsyn.png", "genreCompatibility": ["Sci-Fi"] },
    "aspect_1": { "itemId": "aspect_1", "type": "aspect", "name": "Void Aspect", "rarity": "Rare", "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/aspect1_gkmeyj.png" },
    "aspect_2": { "itemId": "aspect_2", "type": "aspect", "name": "Precision Aspect", "rarity": "Epic", "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/aspect2_o259x9.png" },
    "artifact_2": { "itemId": "artifact_2", "type": "artifact", "name": "Quantum Resonator", "rarity": "Legendary", "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/artifact_b5dsyn.png", "genreCompatibility": ["Sci-Fi"] },
    "artifact_3": { "itemId": "artifact_3", "type": "artifact", "name": "Mystic Orb", "rarity": "Epic", "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/artifact_b5dsyn.png", "genreCompatibility": ["Fantasy"] }
};

export const skillData = {
    "skill_201": { "skillId": "skill_201", "type": "ability", "name": "Pulse Wave", "icon": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/skill1_vmmlyh.png" },
    "skill_203": { "skillId": "skill_203", "type": "ability", "name": "Phase Shift", "icon": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/skill2_n4o7x1.png" },
    "skill_301": { "skillId": "skill_301", "type": "ability", "name": "Lightning Strike", "icon": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/skill1_vmmlyh.png" },
    "skill_302": { "skillId": "skill_302", "type": "ability", "name": "Shield Barrier", "icon": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/skill2_n4o7x1.png" },
    "skill_303": { "skillId": "skill_303", "type": "ability", "name": "Heal Burst", "icon": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/skill1_vmmlyh.png" }
};

export const inventoryData = [
    { id: 'inv_1', ...itemData['item_502'] },
    { id: 'inv_2', "itemId": "inv_2", "type": "weapon", "subtype": "pistol", "name": "Kinetic Repeater", "rarity": "Common", "levelRequirement": 1, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013697/eve_assets/weapon3_d3c3ge.png", "genreCompatibility": ["Shooter", "Sci-Fi"] },
    { id: 'inv_3', "itemId": "inv_3", "type": "armor", "subtype": "boots", "name": "Treads of the Wanderer", "rarity": "Uncommon", "levelRequirement": 3, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/boots_jfrlrm.png", "genreCompatibility": ["MMO", "Shooter"] },
    { id: 'inv_4', "itemId": "inv_4", "type": "armor", "subtype": "cape", "name": "Shadow Cloak", "rarity": "Rare", "levelRequirement": 12, "icon_url": "https://res.cloudinary.com/dji1safpy/image/upload/v1715013696/eve_assets/armor_x5vljs.png", "genreCompatibility": ["Fantasy", "MMO"] },
    { id: 'inv_5', ...itemData['artifact_2'] },
    { id: 'inv_6', ...itemData['artifact_3'] }
];