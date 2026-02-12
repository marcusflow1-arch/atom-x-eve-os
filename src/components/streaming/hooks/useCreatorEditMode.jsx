import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Creator Edit Mode Hook
 * Manages the two-state system: View Mode & Edit Mode
 * Clones data into temporary edit state. Only persists on Save.
 */
export default function useCreatorEditMode(userId) {
  // --- Persisted State (from DB) ---
  const [profile, setProfile] = useState(null);
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Edit Mode ---
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Temporary Edit State (cloned on edit enter) ---
  const [editProfile, setEditProfile] = useState(null);
  const [editLayout, setEditLayout] = useState(null);
  const [editSponsors, setEditSponsors] = useState([]);

  // Version tracking
  const versionRef = useRef(0);

  // --- Load from DB ---
  const loadFromDB = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch profile
      const profiles = await base44.entities.StreamerProfile.filter({ user_id: userId });
      const prof = profiles.length > 0 ? profiles[0] : null;
      setProfile(prof);

      // Fetch layout config
      const layouts = await base44.entities.StreamLayoutConfig.filter({ user_id: userId });
      const lay = layouts.length > 0 ? layouts[0] : null;
      setLayoutConfig(lay);
      if (lay) versionRef.current = lay.layout_version || 1;

      // Fetch sponsors
      const spons = await base44.entities.AuraSponsor.filter({ user_id: userId });
      setSponsors(spons);
    } catch (e) {
      console.error('Failed to load creator data:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  // --- Enter Edit Mode (clone current state) ---
  const enterEditMode = useCallback(() => {
    setEditProfile(profile ? { ...profile } : {
      user_id: userId,
      display_name: '',
      tagline: '',
      bio: '',
      avatar_url: '',
      personality_traits: []
    });
    setEditLayout(layoutConfig ? JSON.parse(JSON.stringify(layoutConfig)) : {
      user_id: userId,
      layout_version: 1,
      stream_box: { col_span: 9, border_style: 'subtle', glow_enabled: false },
      chat_box: { visible: true, position: 'right', opacity: 100, theme: 'default' },
      sections_order: ['schedule', 'cards', 'gallery', 'games', 'sponsors', 'products', 'seasonpass'],
      profile_theme: 'default',
      schedule_data: {},
      gallery_images: [],
      pinned_games: []
    });
    setEditSponsors(sponsors.map(s => ({ ...s })));
    setIsEditMode(true);
  }, [profile, layoutConfig, sponsors, userId]);

  // --- Cancel Edit (discard temp state) ---
  const cancelEdit = useCallback(() => {
    setEditProfile(null);
    setEditLayout(null);
    setEditSponsors([]);
    setIsEditMode(false);
  }, []);

  // --- Save Edit (persist to DB, version check, reload) ---
  const saveEdit = useCallback(async () => {
    if (!userId || !editProfile || !editLayout) return;
    setSaving(true);
    try {
      // Version check for layout
      const currentLayouts = await base44.entities.StreamLayoutConfig.filter({ user_id: userId });
      if (currentLayouts.length > 0) {
        const dbVersion = currentLayouts[0].layout_version || 1;
        if (dbVersion > versionRef.current) {
          toast.error('A newer version exists. Reloading...');
          await loadFromDB();
          setSaving(false);
          setIsEditMode(false);
          return;
        }
      }

      // Save Profile
      const profilePayload = {
        user_id: userId,
        display_name: editProfile.display_name,
        tagline: editProfile.tagline,
        bio: editProfile.bio,
        avatar_url: editProfile.avatar_url,
        personality_traits: editProfile.personality_traits || []
      };

      if (profile?.id) {
        await base44.entities.StreamerProfile.update(profile.id, profilePayload);
      } else {
        await base44.entities.StreamerProfile.create(profilePayload);
      }

      // Save Layout Config (bump version)
      const newVersion = versionRef.current + 1;
      const layoutPayload = {
        user_id: userId,
        layout_version: newVersion,
        stream_box: editLayout.stream_box,
        chat_box: editLayout.chat_box,
        sections_order: editLayout.sections_order,
        profile_theme: editLayout.profile_theme,
        schedule_data: editLayout.schedule_data,
        gallery_images: editLayout.gallery_images,
        pinned_games: editLayout.pinned_games
      };

      if (layoutConfig?.id) {
        await base44.entities.StreamLayoutConfig.update(layoutConfig.id, layoutPayload);
      } else {
        await base44.entities.StreamLayoutConfig.create(layoutPayload);
      }

      // Save Sponsors (simple: delete removed, update existing, create new)
      const existingIds = sponsors.map(s => s.id);
      const editIds = editSponsors.filter(s => s.id).map(s => s.id);

      // Delete removed sponsors
      for (const s of sponsors) {
        if (!editIds.includes(s.id)) {
          await base44.entities.AuraSponsor.delete(s.id);
        }
      }

      // Update/Create sponsors
      for (const s of editSponsors) {
        const payload = {
          user_id: userId,
          name: s.name,
          logo_url: s.logo_url,
          affiliate_link: s.affiliate_link,
          tier: s.tier || 'bronze',
          description: s.description
        };
        if (s.id && existingIds.includes(s.id)) {
          await base44.entities.AuraSponsor.update(s.id, payload);
        } else {
          await base44.entities.AuraSponsor.create(payload);
        }
      }

      toast.success('Profile saved successfully');
      versionRef.current = newVersion;

      // Reload from DB to confirm
      await loadFromDB();
      setIsEditMode(false);
      setEditProfile(null);
      setEditLayout(null);
      setEditSponsors([]);
    } catch (e) {
      console.error('Failed to save:', e);
      toast.error('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [userId, editProfile, editLayout, editSponsors, profile, layoutConfig, sponsors, loadFromDB]);

  // --- Edit helpers ---
  const updateEditProfile = useCallback((field, value) => {
    setEditProfile(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const updateEditLayout = useCallback((field, value) => {
    setEditLayout(prev => {
      if (!prev) return prev;
      // Support nested paths like 'chat_box.visible'
      const parts = field.split('.');
      if (parts.length === 1) return { ...prev, [field]: value };
      const clone = JSON.parse(JSON.stringify(prev));
      let obj = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return clone;
    });
  }, []);

  const addEditSponsor = useCallback((sponsor) => {
    setEditSponsors(prev => [...prev, { ...sponsor, user_id: userId }]);
  }, [userId]);

  const removeEditSponsor = useCallback((index) => {
    setEditSponsors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateEditSponsor = useCallback((index, field, value) => {
    setEditSponsors(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }, []);

  // --- Computed: active data (edit state if editing, else persisted) ---
  const activeProfile = isEditMode ? editProfile : profile;
  const activeLayout = isEditMode ? editLayout : layoutConfig;
  const activeSponsors = isEditMode ? editSponsors : sponsors;

  return {
    // State
    loading,
    saving,
    isEditMode,
    activeProfile,
    activeLayout,
    activeSponsors,
    // Actions
    enterEditMode,
    cancelEdit,
    saveEdit,
    updateEditProfile,
    updateEditLayout,
    addEditSponsor,
    removeEditSponsor,
    updateEditSponsor,
    // Raw edit state for direct manipulation
    editLayout,
    setEditLayout,
    editSponsors,
    setEditSponsors
  };
}