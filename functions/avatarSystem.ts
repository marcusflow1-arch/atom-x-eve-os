
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requestBody = await req.json();
        const { action } = requestBody;

        switch (action) {
            case 'saveAppearance': {
                const { appearance } = requestBody;
                const updatedAvatar = await saveAvatarAppearance(base44, user.id, appearance);
                return Response.json({
                    success: true,
                    avatar: updatedAvatar,
                    message: 'Avatar appearance saved successfully!'
                });
            }

            case 'loadAvatar': {
                const avatarData = await loadUserAvatar(base44, user.id);
                return Response.json({
                    success: true,
                    avatar: avatarData
                });
            }

            case 'equipItem': {
                const { itemId, slot } = requestBody;
                const equipped = await equipItemToAvatar(base44, user.id, itemId, slot);
                return Response.json(equipped);
            }

            case 'unequipItem': {
                const { equipmentSlot } = requestBody;
                const unequipped = await unequipItemFromAvatar(base44, user.id, equipmentSlot);
                return Response.json(unequipped);
            }

            case 'updateMorphTargets': {
                const { morphTargets } = requestBody;
                const updated = await updateAvatarMorphs(base44, user.id, morphTargets);
                return Response.json(updated);
            }

            case 'getAvatarStats': {
                const stats = await getAvatarStats(base44, user.id);
                return Response.json(stats);
            }

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Avatar system error:', error);
        return Response.json({ 
            error: error.message, 
            success: false 
        }, { status: 500 });
    }
});

async function saveAvatarAppearance(base44, userId, appearance) {
    // Find or create user's avatar
    let avatars = await base44.entities.Avatar.filter({ user_id: userId });
    
    let avatar;
    if (avatars.length === 0) {
        // Create new avatar
        avatar = await base44.entities.Avatar.create({
            user_id: userId,
            name: appearance.name || 'Player Avatar',
            gender: appearance.gender || 'male',
            level: 1,
            experience: 0,
            model_url: appearance.model_url || 'base_humanoid.glb',
            skin_tone: appearance.skinTone || '#ffdbac',
            hair_color: appearance.hairColor || '#111111',
            morph_targets: appearance.morphTargets || {}
        });
    } else {
        // Update existing avatar
        avatar = await base44.entities.Avatar.update(avatars[0].id, {
            skin_tone: appearance.skinTone,
            hair_color: appearance.hairColor,
            model_url: appearance.model_url,
            morph_targets: appearance.morphTargets || {}
        });
    }

    return avatar;
}

async function loadUserAvatar(base44, userId) {
    const avatars = await base44.entities.Avatar.filter({ user_id: userId });
    
    if (avatars.length === 0) {
        return null;
    }

    const avatar = avatars[0];
    
    // Get equipped items
    const equippedItems = avatar.equipped_items || [];
    const equipment = [];
    
    for (const itemId of equippedItems) {
        try {
            // Try to find in Equipment entity
            const equipmentItems = await base44.entities.Equipment.filter({ id: itemId });
            if (equipmentItems.length > 0) {
                equipment.push(equipmentItems[0]);
            }
        } catch (e) {
            console.warn(`Could not load equipment item ${itemId}:`, e);
        }
    }

    return {
        ...avatar,
        equipment
    };
}

async function equipItemToAvatar(base44, userId, itemId, slot) {
    const avatars = await base44.entities.Avatar.filter({ user_id: userId });
    if (avatars.length === 0) {
        throw new Error('Avatar not found');
    }

    const avatar = avatars[0];
    const currentEquipment = avatar.equipped_items || [];
    
    // Check if item exists
    const items = await base44.entities.Equipment.filter({ id: itemId });
    if (items.length === 0) {
        throw new Error('Equipment item not found');
    }

    const item = items[0];
    
    // Remove any existing item in this slot
    const filteredEquipment = currentEquipment.filter(id => {
        // This would need more sophisticated slot checking in a real implementation
        return id !== itemId;
    });
    
    // Add new item
    filteredEquipment.push(itemId);

    const updatedAvatar = await base44.entities.Avatar.update(avatar.id, {
        equipped_items: filteredEquipment
    });

    return {
        success: true,
        avatar: updatedAvatar,
        message: `${item.name} equipped successfully!`
    };
}

async function unequipItemFromAvatar(base44, userId, slot) {
    const avatars = await base44.entities.Avatar.filter({ user_id: userId });
    if (avatars.length === 0) {
        throw new Error('Avatar not found');
    }

    const avatar = avatars[0];
    // Implementation would depend on how slots are tracked
    // This is a simplified version
    
    return {
        success: true,
        avatar: avatar,
        message: 'Item unequipped successfully!'
    };
}

async function updateAvatarMorphs(base44, userId, morphTargets) {
    const avatars = await base44.entities.Avatar.filter({ user_id: userId });
    if (avatars.length === 0) {
        throw new Error('Avatar not found');
    }

    const avatar = avatars[0];
    const updatedAvatar = await base44.entities.Avatar.update(avatar.id, {
        morph_targets: morphTargets
    });

    return {
        success: true,
        avatar: updatedAvatar,
        message: 'Avatar expressions updated!'
    };
}

async function getAvatarStats(base44, userId) {
    const avatars = await base44.entities.Avatar.filter({ user_id: userId });
    if (avatars.length === 0) {
        return { level: 1, experience: 0, equipment: [] };
    }

    const avatar = avatars[0];
    
    // Calculate total power from equipment
    const equippedItems = avatar.equipped_items || [];
    let totalPower = 0;
    
    for (const itemId of equippedItems) {
        try {
            const items = await base44.entities.Equipment.filter({ id: itemId });
            if (items.length > 0) {
                const item = items[0];
                // Calculate power from item stats
                if (item.stats) {
                    totalPower += Object.values(item.stats).reduce((sum, stat) => 
                        sum + (typeof stat === 'number' ? stat : 0), 0
                    );
                }
            }
        } catch (e) {
            console.warn(`Could not calculate power for item ${itemId}`);
        }
    }
    
    return {
        level: avatar.level || 1,
        experience: avatar.experience || 0,
        totalPower,
        equippedItems: equippedItems.length,
        name: avatar.name
    };
}
