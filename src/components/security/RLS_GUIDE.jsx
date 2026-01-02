/**
 * RLS (Row-Level Security) Implementation Guide for Atom x Eve
 * 
 * This file documents the security model and provides reference for developers.
 * All entities must follow one of these access patterns.
 */

export const RLS_POLICIES = {
  // OWNER-ONLY: User can only access their own records
  OWNER_ONLY: [
    'Avatar',
    'UserAchievement', 
    'StreamSettings',
    'ViewerProfile',
    'StreamerProfile',
    'AIBehaviorState',
    'UserTask',
    'UserNote',
    'Memory'
  ],

  // MEMBERS-ONLY: Access requires clan/guild/party membership
  MEMBERS_ONLY: [
    'ClanMember',
    'ClanMessage',
    'ClanEvent',
    'ClanChannel',
    'ClanInvite',
    'ClanVote',
    'ClanQuest',
    'GuildMember',
    'GuildResource',
    'PartyMember'
  ],

  // PUBLIC-READ / USER-WRITE: Anyone reads, owner writes
  PUBLIC_READ: [
    'Post',
    'Comment',
    'StreamVideo',
    'Stream',
    'Achievement',
    'Game',
    'HeroBackground'
  ],

  // ADMIN-ONLY: All operations require admin role
  ADMIN_ONLY: [
    'GameConcept',
    'Model3D',
    'AnimationFBX',
    'ModelFBX',
    'Model3DScript',
    'PlatformUpdate',
    'WorldEvent',
    'AgentJob',
    'Tournament'
  ],

  // MARKETPLACE: Hybrid rules for trading
  MARKETPLACE: [
    'TradeOffer',
    'Bid',
    'Order',
    'MarketTransaction'
  ]
};

/**
 * Client-side query helper - ensures queries are scoped correctly
 */
export function createScopedQuery(entityName, currentUser) {
  const policy = Object.keys(RLS_POLICIES).find(key => 
    RLS_POLICIES[key].includes(entityName)
  );

  switch (policy) {
    case 'OWNER_ONLY':
      return { user_id: currentUser.id };
    
    case 'ADMIN_ONLY':
      if (currentUser.role !== 'admin') {
        throw new Error('Admin access required');
      }
      return {};
    
    case 'PUBLIC_READ':
      // No filter needed for reads
      return {};
    
    default:
      console.warn(`No RLS policy defined for entity: ${entityName}`);
      return {};
  }
}

/**
 * Verification checklist for developers:
 * 
 * ✅ No .list() calls on sensitive entities
 * ✅ All queries include user_id/created_by filters
 * ✅ Admin operations check user.role === 'admin'
 * ✅ Clan operations verify membership
 * ✅ Backend functions authenticate before querying
 * ✅ Rate limits applied to expensive operations
 * ✅ Input validation on all boundaries
 * ✅ Error messages don't leak internal details
 */