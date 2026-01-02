# Mock Data Inventory - Production Migration Plan

## 🎯 Mock Data Files to Remove/Replace

### Store & Marketplace
- **File**: `components/store/mockData.js`
- **Size**: ~450 LOC
- **Contains**: Trending games, new releases, classics, AI games, Android games
- **Migration**: Replace with Game entity queries
- **Priority**: HIGH - Core storefront data

- **File**: `components/store/mockGameDetailData.js`
- **Size**: ~145 LOC
- **Contains**: Sample game with achievements, equipment, abilities
- **Migration**: Replace with Game + Achievement + Equipment queries
- **Priority**: MEDIUM

- **File**: `components/store/androidGamesData.js`
- **Size**: Unknown (referenced but not seen)
- **Migration**: Merge into Game entity with platform=Android
- **Priority**: LOW

### Library & Game Management
- **File**: `components/dashboard/gamehub/mockLibraryData.js`
- **Size**: Unknown
- **Contains**: User's game library
- **Migration**: Query owned games via Order/Transaction entities
- **Priority**: HIGH

### Profile & Cards
- **File**: `components/profile/mockData.js`
- **Size**: Unknown
- **Contains**: User stats, card collections
- **Migration**: Replace with UserAchievement + UserCard queries
- **Priority**: MEDIUM

### Streaming
- **File**: `components/streaming/mockData.js`
- **Size**: ~142 LOC (inferred from StreamingDiscovery)
- **Contains**: Streamer profiles, games, schedules
- **Migration**: Replace with StreamerProfile + Stream entities
- **Priority**: LOW

### AI Achievements
- **File**: `components/store/AIAchievementsData.jsx`
- **Size**: ~500 LOC (export object)
- **Contains**: Game-specific AI perks and combat styles
- **Migration**: Store as JSON in Game entity metadata field
- **Priority**: MEDIUM - Required for AI system

## 📦 Required Entity Schema Updates

### Game Entity Enhancement
```javascript
{
  // ... existing fields
  "ai_achievements": {
    "type": "object",
    "description": "AI learning data from AIAchievementsData.jsx"
  },
  "platform": {
    "type": "array",
    "items": { "type": "string", "enum": ["PC", "Android", "iOS", "Console"] }
  },
  "featured_tier": {
    "type": "string",
    "enum": ["trending", "new_release", "classic", "ai_enhanced"]
  }
}
```

### Seed Data Strategy
1. **Development**: Keep mock data with `DEV_MODE` flag
2. **Staging**: Populate entities from mock data via seed script
3. **Production**: Remove mock imports entirely

## 🚀 Migration Steps

### Phase 1: Parallel Data (Low Risk)
1. Create seed script that imports mock data
2. Populate Game, Achievement, Equipment entities
3. Update UI to query entities with mock data fallback
4. Test in preview environment

### Phase 2: Entity-First (Medium Risk)
1. Remove fallback logic
2. Ensure all pages query entities
3. Add empty state handling
4. Performance test with 1000+ games

### Phase 3: Production Cleanup (Irreversible)
1. Delete mock data files
2. Remove unused imports
3. Reduce bundle size
4. Verify no regression

## 🎮 Entity Seeding Script Template

```javascript
// functions/seedDatabase.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sampleGames } from './mock_data_archive.js';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // Only admin can seed
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const results = await base44.asServiceRole.entities.Game.bulkCreate(
    sampleGames.map(game => ({
      ...game,
      created_by: 'system'
    }))
  );

  return Response.json({ 
    success: true, 
    created: results.length 
  });
});
```

## 📊 Bundle Size Impact
- **Before**: ~150KB mock data in bundle
- **After**: ~5KB (entity schemas only)
- **Savings**: ~145KB (-97%)

## ⚠️ Risk Assessment
- **Low Risk**: Store/Library (most accessed, easy to test)
- **Medium Risk**: Profile/Cards (user-specific data)
- **High Risk**: AI Achievements (complex nested data)

## ✅ Success Criteria
- [ ] All pages load without mock imports
- [ ] Empty states render correctly
- [ ] Performance maintained with real queries
- [ ] Bundle size reduced by >90%
- [ ] No user-facing errors in production