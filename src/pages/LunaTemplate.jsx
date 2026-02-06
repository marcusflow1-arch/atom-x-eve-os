// Load saved environment preference
  useEffect(() => {
    const loadUserEnv = async () => {
      if (!user?.id) return;
      try {
        const states = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
        if (states && states.length > 0 && states[0].currentEnvironmentId) {
          const savedId = states[0].currentEnvironmentId;
          setCurrentEnvId(savedId);
          
          if (savedId !== 'default_room') {
             const models = await base44.entities.Model3D.list();
             const fbxs = await base44.entities.ModelFBX.list();
             const all = [...(models || []), ...(fbxs || [])];
             
             const queries = {
               'cyber_loft': ['room 2', 'room2'],
               'zen_garden': ['zen', 'garden'],
               'mars_outpost': ['mars', 'outpost']
             };
             
             if (queries[savedId]) {
               const found = all.find(m => queries[savedId].some(q => (m.name || '').toLowerCase().includes(q)));
               if (found?.file_url) {
                 setRoomModelUrl(found.file_url);
               }
             }
          }
        }
      } catch (e) { console.error('Error loading env pref', e); }
    };
    loadUserEnv();
  }, [user]);

  const handleEnvSelect = async (env) => {
    setCurrentEnvId(env.id);
    if (env.modelUrl) {
      setRoomModelUrl(env.modelUrl);
      if (user?.id) {
        try {
          const states = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
          if (states.length > 0) {
            await base44.entities.AvatarHomeState.update(states[0].id, { currentEnvironmentId: env.id });
          } else {
            await base44.entities.AvatarHomeState.create({ avatarId: user.id, currentEnvironmentId: env.id });
          }
        } catch (e) { console.error('Error saving env pref', e); }
      }
    }
  };